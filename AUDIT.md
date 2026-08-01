# Deploy-Readiness Audit — Lantern House AI Desk ("Linh")

**Date:** 2026-08-01
**Scope:** `voice-gateway/` (Twilio TwiML gateway on Render) + `web/` (Next.js on Vercel, Supabase, Vapi, Twilio)
**Question being answered:** can the owner run a live, customer-facing pilot tonight?

---

## Verdict

**No — not a full customer-facing pilot on the main restaurant line tonight.**
**Yes — a supervised soft-launch on a secondary/forwarding number is realistic tonight**, if the owner
works through the checklist in the "Minimal path to go live" section below (~60–90 minutes of account
setup, no further coding required).

The reason is not the code. After this PR the call path is wired end to end. The reason is that
**none of the third-party accounts this depends on are provisioned yet, and the AI currently has no
verified menu, prices, or hours to answer from.** An AI receptionist with no menu data will either
refuse most questions or invent answers, and inventing answers on night one is the fastest way to
lose the owner's trust.

The remaining launch risk is now a single item:

1. **The AI has no verified knowledge base.** Menu items, prices, and hours only exist as a
   hardcoded example string (`lanternHouseExample` in `web/src/lib/vapi/assistant-config.ts`). The
   `services` and `business_hours` tables are empty. Guardrails have been tightened in this PR so
   Linh refuses rather than guesses, but that means she will refuse a lot until real data is loaded.

The location-data conflict that was previously blocking has been resolved — see section 3.

---

## 1. What is currently built and working

| Area | Status | Notes |
| --- | --- | --- |
| Twilio voice gateway (Render) | Working | Health check, TwiML routing, language + location selection, manager transfer via `<Dial>` |
| Manager escalation | Working | Keyword/DTMF triggered, English + Vietnamese, falls back to voicemail prompt |
| Database schema | Written, not deployed | `web/src/lib/supabase/schema.sql` — 10 tables, indexes, RLS on all tables, `updated_at` triggers |
| Vapi assistant config | Written, not created in Vapi | `web/src/lib/vapi/assistant-config.ts` is a source file, not a live assistant |
| Vapi webhook handler | Working | `web/src/app/api/vapi/webhook/route.ts` — booking, order, transfer, SMS, call logging |
| Twilio SMS | Working (code) | Direct REST call, no SDK dependency, degrades gracefully when unconfigured |
| Owner dashboard | **UI shell only** | 7 pages render, but every page uses hardcoded mock arrays. No Supabase reads. |
| Login / signup | **Non-functional** | Forms render with no submit handler and no Supabase Auth call |
| Landing page | Working | Bilingual EN/VI via `translations.ts` |
| Build | Passing | `next build` and `tsc --noEmit` both clean; no broken imports found |

---

## 2. What this PR fixed

### Fix 1 — The gateway now actually reaches the AI

`voice-gateway/server.js` was a test-mode IVR that never touched Vapi. `/twilio/voice` now branches
at request time:

- **Vapi mode** — when `VAPI_API_KEY` and `VAPI_ASSISTANT_ID` are both set and `VAPI_ENABLED` is not
  `false`, the call is handed to the assistant via `<Connect><Stream>`, passing the caller number,
  called number, and Twilio call SID as stream parameters.
- **Test-IVR mode** — when either key is missing, the original IVR is served unchanged.

Two safety properties were deliberately built in:

- If the Vapi stream fails to establish, Twilio continues past `<Connect>` and the call is redirected
  to `/twilio/voice/ivr`. A Vapi outage degrades to the IVR instead of dropping the call.
- `VAPI_ENABLED=false` is a live kill switch. The owner can flip it in the Render dashboard and
  restart to fall back to the IVR without a redeploy — worth knowing before a live night.

`/health` now reports `"mode": "vapi"` or `"mode": "test-ivr"` so the active path can be confirmed
without placing a call. `twilio-url-check.js` was updated to validate both modes (it previously
asserted the presence of `<Gather>`, so it would have reported a false failure in Vapi mode).

### Fix 2 — Caller recognition before the greeting

New `web/src/lib/supabase/customer-context.ts` plus a new `assistant-request` branch in the webhook.
On call connect, before Linh speaks:

1. The caller's number is normalized into every plausible stored format (`+1XXXXXXXXXX`,
   `1XXXXXXXXXX`, `XXXXXXXXXX`, raw) and matched against `customers.phone_number`.
2. On a match, their most recent order and booking are fetched.
3. Vapi receives `assistantOverrides` with a personalized `firstMessage`
   ("Welcome back, [Name]! … Would you like your usual — [last order]?") plus `variableValues`
   (`customer_name`, `is_returning_customer`, `last_order`, `last_booking`, `total_orders`) that the
   system prompt now references.

Failure behaviour, as required: the lookup is wrapped in a 1.5s timeout and a try/catch. A miss, a
Supabase outage, a slow query, or a missing `DEFAULT_BUSINESS_ID` all fall through to the normal
anonymous greeting. **A failed lookup can never stall or break a call.**

### Fix 3 — Language policy now matches the owner's decision

`assistant-config.ts`'s system prompt previously said to auto-detect the caller's language from
their first words, contradicting both the gateway logic and the owner's decision. Rewritten to
English-first:

- Always open and continue in English; never infer language from the first words.
- Switch to Vietnamese only if the caller explicitly asks, speaks Vietnamese, or is visibly
  struggling (in which case Linh offers once).
- Explicitly: never switch based on a Vietnamese-sounding name or accent.
- If a Vietnamese caller is hard to understand, offer transfer to Vietnamese-speaking staff rather
  than guessing.

### Additional correctness fixes found during the audit

These were blocking bugs, not cleanup — without them fixes 1–3 would not have worked in production:

- **Webhook payload shape was wrong.** The handler read `body.type` / `body.message.tool`, but Vapi
  nests server messages under `body.message` and has shipped three different tool-call shapes
  (`functionCall`, `toolCalls`, `toolCallList`). As written, **no Vapi event would have matched any
  branch.** Now normalized to accept all shapes.
- **`bookings.call_id` / `orders.call_id` were being set to the Vapi call ID**, but those columns are
  UUID foreign keys to `calls.id`. Every insert would have failed the FK constraint. Now resolved via
  a `vapi_call_id` lookup.
- **Insert errors were silently swallowed.** `await supabase.insert(...)` results were discarded, so
  a failed booking would still send the customer a "we got your order" SMS. Errors are now checked,
  logged, and returned to Vapi so Linh can tell the caller something went wrong.
- **Nothing ever inserted a `calls` row**, so `log_call` and `end-of-call-report` updated zero rows
  and no call was ever logged. A `calls` row is now created on `assistant-request`.
- **The webhook was unauthenticated.** It writes to the database and sends SMS on any anonymous POST.
  Now verifies `x-vapi-secret` against `VAPI_WEBHOOK_SECRET` when that variable is set.
- **The prompt advertised a `check_availability` tool that does not exist** in the `functions` array —
  a direct invitation to hallucinate table availability. Removed, with an explicit instruction that
  there is no live availability system.
- **Hallucination guardrails strengthened**: no invented prices, hours, menu items, wait times, or
  availability; no approximations ("around fifteen dollars"); never confirm an order as final, only
  as received.
- **Recording/AI disclosure preserved.** The test IVR disclosed recording; the Vapi path would have
  silently dropped it. The disclosure is now in both the default and personalized greetings.
  (Virginia is one-party consent, so this is best practice rather than a legal requirement — but it
  matters for the California expansion path and for caller trust.)

---

## 3. Location data conflict — RESOLVED (owner-confirmed 2026-08-01)

The codebase previously carried two different Falls Church addresses, and there was no way to tell
from the code which was correct. The owner has confirmed the pilot location:

| Field | Confirmed value |
| --- | --- |
| Address | 1067 W Broad St, Falls Church, VA 22046 |
| Phone | (703) 268-2878 |
| Email | lanternhouseyt@gmail.com |
| Website | lanternhousebistro.com |

The stale address (`6111 Leesburg Pike, Falls Church VA 22044`) has been replaced everywhere it
appeared, and `assistant-config.ts`'s `business_phone` now uses the confirmed Falls Church line.

What was deliberately **not** changed, because it belongs to the separate Reston entity (Lantern
House Kitchen & Bar) or to escalation routing rather than to the Falls Church pilot:

- Reston address `12001 Creekview Rd, Reston VA 20194`
- `lanternhousekitchenbar.com` in `ALLOWED_ORIGINS`
- `+1 571 749 5444` as `manager_phone` / `TWILIO_MANAGER_PHONE` / the dashboard's Manager Transfer
  Number — this is the escalation target, not a public-facing number

Two follow-ups for the owner, neither blocking:

- `lanternhousevietbistro.com` is retained in `ALLOWED_ORIGINS` as a legacy alias. Confirm whether
  it still resolves anywhere; if not, drop it.
- `ALLOWED_ORIGINS` is documented in `.env.example` but **read by no code** — there is no CORS
  handling in `server.js`. It is currently documentation only.

Hours and menu remain unverified — see the verdict at the top.

---

## 4. What is still missing

### Code changes still needed (not in this PR)

| Item | Status | Impact | Effort |
| --- | --- | --- | --- |
| Dashboard reads real Supabase data | **Still open** | Owner cannot see calls/orders/bookings in the UI; must use the Supabase table editor or Vapi call logs during the pilot | ~half a day |
| Login/signup wired to Supabase Auth | Done — 2026-08-01 | Real `signInWithPassword` / `signUp`, middleware guards `/dashboard`, signup writes `settings.owner_id` | — |
| `customers` rollup counters | Done — handled by database triggers | Counters now bump on insert, so caller recognition improves over the pilot | — |
| `messages` table never written | Done — 2026-08-01 | Every outbound SMS is logged via `sendAndLogSMS`, so delivery can be audited | — |
| Menu/hours served from `services` + `business_hours` | Done | `business-context.ts` reads live menu and hours per call | — |
| Twilio request-signature validation on the gateway | Done — 2026-08-01 | `/twilio/voice*` rejects forged requests with 403 when `TWILIO_AUTH_TOKEN` is set | — |
| Overly-permissive RLS on `bookings` / `orders` | Migration written, **not yet applied** | `allow_anon_update_*` let anyone with the anon key update any booking or order. Run the migration below | ~5 min |
| Automated tests | Started — 2026-08-01 | Vitest configured with 17 tests covering SMS logging, Twilio signatures, and the RLS migration. Route handlers and UI are still untested | ongoing |

### RLS review

All ten tables have RLS enabled with per-business policies, and the service-role key used by the
webhook bypasses RLS as intended. Two things to be aware of rather than bugs to fix tonight:

- Policies key off `businesses.settings->>'owner_id'`, but **nothing in the signup flow ever sets
  `owner_id`**. Once real auth is added, a logged-in owner will see zero rows until that field is
  populated manually.
- The `OR auth.role() = 'service_role'` clause in every policy is redundant (service role bypasses
  RLS entirely). Harmless, but it means the policies have effectively never been exercised — no
  authenticated user has ever queried these tables. Do not assume they work until auth is live.

### Environment variables

Both `.env.example` files were incomplete and have been updated. Newly documented:
`VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_STREAM_URL`, `VAPI_ENABLED` (gateway);
`VAPI_ASSISTANT_ID`, `VAPI_WEBHOOK_SECRET`, `DEFAULT_BUSINESS_ID`, `BUSINESS_NAME` (web).

Note `OPENAI_API_KEY` is listed in `web/.env.example` but is **not used by any code** — OpenAI is
called by Vapi using the key configured in the Vapi dashboard, not by this app. Left in place, but
setting it on Vercel does nothing.

---

## 5. Minimal path to go live — in priority order

### Owner / operator steps (no code, ~60–90 min)

1. ~~**Resolve the address conflict.**~~ Done — see section 3. Address, phone, email, and website
   for the Falls Church pilot are confirmed and now correct in code. **Hours are still unverified**,
   so confirm those before step 4.
2. **Create the Supabase project** and run `web/src/lib/supabase/schema.sql` in the SQL editor.
3. **Insert one `businesses` row** for the pilot restaurant and copy its UUID.
4. **Create the Vapi assistant.** Paste `systemPrompt` from `assistant-config.ts`, filling in
   `{{business_name}}`, `{{business_hours}}`, `{{locations_list}}`, `{{business_phone}}`,
   `{{manager_phone}}`, and — most importantly — `{{services_menu}}` with the **real, verified menu
   and prices**. This is the step that determines whether Linh is useful or useless.
5. **Set the assistant's Server URL** to `https://<vercel-domain>/api/vapi/webhook`, enable the
   `assistant-request`, `function-call`, and `end-of-call-report` server events, and set a
   server-URL secret.
6. **Set env vars on Vercel:** Supabase URL + anon key + service role key, `VAPI_ASSISTANT_ID`,
   `VAPI_WEBHOOK_SECRET` (matching step 5), `DEFAULT_BUSINESS_ID` (the UUID from step 3),
   `BUSINESS_NAME`, and the three Twilio variables. Redeploy.
7. **Set env vars on Render:** `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `PUBLIC_BASE_URL`. Redeploy and
   confirm `/health` reports `"mode": "vapi"`.
8. **Point a secondary Twilio number** — not the main restaurant line — at
   `https://<render-url>/twilio/voice` (POST).

### Verification before taking real calls (~20 min)

9. Call the test number and confirm Linh answers as an AI in English with the recording disclosure.
10. Ask a menu question with a known answer, then one with an unknown answer. **Confirm she refuses
    to guess on the unknown one.** If she invents an answer, stop and fix the prompt.
11. Say "Vietnamese" and confirm she switches, then confirm she does *not* switch on an
    English-speaking caller with a Vietnamese name.
12. Place a test order, confirm the SMS arrives and a row appears in `orders` in Supabase.
13. Call again from the same number and confirm the "Welcome back" greeting fires with the order
    from step 12.
14. Ask for a manager and confirm the transfer connects.
15. Note where `VAPI_ENABLED=false` lives in Render before going live, so the kill switch can be
    thrown in seconds.

### Only after steps 1–15 pass

16. Soft-launch on the forwarding number during off-peak hours with a staff member monitoring.
    Do not put this on the main line unsupervised on night one.

---

## 6. Risks to watch during the pilot

- **Vietnamese transcription is the weakest link.** The configured transcriber is Deepgram nova-2 at
  `en-US`. Vietnamese speech will transcribe poorly. The prompt now instructs Linh to offer a
  transfer to Vietnamese-speaking staff rather than guess, but if genuine Vietnamese AI handling is
  a pilot goal, a Vietnamese-capable transcriber must be selected in the Vapi dashboard and
  re-tested. Given the ~90/10 English skew this is acceptable for a soft launch, but it should be
  stated honestly to the owner rather than discovered by a Vietnamese caller.
- **"Press 3 for Vietnamese" no longer exists in Vapi mode.** That DTMF option belongs to the test
  IVR, which is now only the fallback path. In Vapi mode the caller must *say* Vietnamese. If the
  owner has advertised "press 3" anywhere, that needs correcting.
- **No load or concurrency testing has been done.** Behaviour with several simultaneous callers is
  unknown.
- **The dashboard shows mock data.** If the owner opens it during the pilot they will see fabricated
  calls and orders, not real ones. Tell them before they look, or they will reasonably conclude the
  system is making things up.

---

## Changelog

### 2026-08-01 — Auth and security hardening

- **Supabase Auth is live.** `/login` and `/signup` call `signInWithPassword` and `signUp` and show
  inline errors. `src/middleware.ts` guards every `/dashboard` route and redirects anonymous users to
  `/login`. "Sign Out" now ends the session instead of just navigating home.
- **`settings.owner_id` is finally populated**, closing the gap called out in the RLS review in
  section 4. `POST /api/auth/provision-business` links the signed-in user to a business; the first
  owner to sign up claims `DEFAULT_BUSINESS_ID` rather than creating a duplicate tenant. It reads
  business details from auth metadata, never from a client-supplied user id, and is idempotent, so
  accounts created earlier are linked on their next login.
- **Outbound SMS is logged.** `sendAndLogSMS` writes a `messages` row (with `booking_id` / `order_id`
  where known) for every send, recording failures as `status: 'failed'`. Log failures are swallowed
  so a database problem cannot fail a booking or order response.
- **The gateway verifies Twilio signatures.** `/twilio/voice*` returns 403 on a bad or missing
  `X-Twilio-Signature` once `TWILIO_AUTH_TOKEN` is set, and fails open with a warning when it is not,
  so local and test-IVR mode still work. Implemented with node `crypto` rather than the twilio SDK to
  keep the gateway dependency-free — a missing `npm install` on Render must not take the phone line
  down at startup. Verified byte-for-byte against `twilio.getExpectedTwilioSignature()`.
- **Tests exist.** Vitest, 17 tests: `npm test` in `/web`.
- **Action required:** run `web/src/lib/supabase/migrations/20260801_scope_booking_order_updates.sql`
  against Supabase. Until it runs, `allow_anon_update_bookings` and `allow_anon_update_orders` still
  allow anyone holding the public anon key to update any booking or order row.
