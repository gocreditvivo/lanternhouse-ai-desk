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

Two things specifically make an unsupervised main-line launch unsafe tonight:

1. **The AI has no verified knowledge base.** Menu items, prices, and hours only exist as a
   hardcoded example string (`lanternHouseExample` in `web/src/lib/vapi/assistant-config.ts`). The
   `services` and `business_hours` tables are empty. Guardrails have been tightened in this PR so
   Linh refuses rather than guesses, but that means she will refuse a lot until real data is loaded.
2. **There is a factual conflict in the location data that nobody has resolved.** See
   "Blocking data question" below. Right now the AI could give callers the wrong address.

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

## 3. Blocking data question — needs the owner, not a developer

The codebase contains **two different Falls Church addresses** and there is no way to tell from the
code which is correct:

- `assistant-config.ts` and the dashboard settings page: **6111 Leesburg Pike, Falls Church VA 22044**
- The pilot plan document: **1067 W Broad St, Falls Church VA 22046**, phone (703) 268-2878
- `voice-gateway` manager/transfer number: **+1 571 749 5444**
- `ALLOWED_ORIGINS` references two domains: `lanternhousevietbistro.com` and `lanternhousekitchenbar.com`

This looks like two distinct restaurant entities being conflated. **Until the owner confirms which
address, phone number, and hours belong to the pilot location, Linh can give callers the wrong
address.** This is the single highest-consequence unresolved item and it costs five minutes to fix —
it was deliberately not guessed at in this PR.

---

## 4. What is still missing

### Code changes still needed (not in this PR)

| Item | Impact | Effort |
| --- | --- | --- |
| Dashboard reads real Supabase data | Owner cannot see calls/orders/bookings in the UI; must use the Supabase table editor or Vapi call logs during the pilot | ~half a day |
| Login/signup wired to Supabase Auth | Dashboard is effectively public; no owner login exists | ~half a day |
| `customers` rollup counters | `total_orders`, `total_bookings`, `lifetime_value` are never incremented, so recognition quality will not improve over the pilot | ~1 hour |
| `messages` table never written | Sent SMS is not logged anywhere, so SMS delivery can't be audited | ~30 min |
| Menu/hours served from `services` + `business_hours` | AI knowledge is a static string; menu changes require a code deploy | ~half a day |
| Twilio request-signature validation on the gateway | Anyone can POST to `/twilio/voice`; low risk for a pilot, real for production | ~1 hour |
| Automated tests | There are none anywhere in the repo | ongoing |

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

1. **Resolve the address conflict in section 3.** Confirm the pilot location's exact address, public
   phone number, and current hours. Nothing else matters if the AI gives out the wrong address.
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
