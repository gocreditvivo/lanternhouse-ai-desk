# Voice Receptionist AI — Linh

Bilingual English/Vietnamese AI voice receptionist for Vietnamese nail salons and restaurants.

## Structure

```
voice-receptionist-ai/
├── voice-gateway/          # Existing Twilio voice gateway (unchanged)
│   ├── server.js           # Twilio TwiML gateway — handles calls
│   ├── twilio-url-check.js # Webhook health checker
│   ├── package.json
│   └── .env.example
├── web/                    # Next.js web app (new)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (landing)/  # Public landing page (EN/VI)
│   │   │   ├── (dashboard)/# Owner dashboard (login, signup)
│   │   │   └── api/        # API routes (Vapi webhook, bookings, SMS)
│   │   ├── lib/
│   │   │   ├── supabase/   # Supabase client + schema.sql
│   │   │   ├── vapi/       # Vapi assistant config + Twilio bridge
│   │   │   ├── sms/        # Twilio SMS service
│   │   │   └── translations.ts # EN/VI translations
│   │   ├── components/     # React components
│   │   └── types/          # TypeScript database types
│   ├── package.json
│   └── .env.example
└── package.json            # Monorepo root
```

## Getting Started

### 1. Voice Gateway (existing)

```bash
cd voice-gateway
cp .env.example .env
# Edit .env with your Twilio + Render settings
npm install
npm start
```

### 2. Web App (new)

```bash
cd web
cp .env.example .env.local
# Edit .env.local with your Supabase + Vapi + Twilio keys
npm install
npm run dev
```

### 3. Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Paste and run `web/src/lib/supabase/schema.sql`

### 4. Vapi AI Setup

1. Create an account at [vapi.ai](https://vapi.ai)
2. Create a new assistant
3. Use the config from `web/src/lib/vapi/assistant-config.ts`
4. Set the assistant's Server URL to: `https://your-domain.com/api/vapi/webhook`,
   enable the `assistant-request`, `function-call`, and `end-of-call-report` server events,
   and set a server-URL secret matching `VAPI_WEBHOOK_SECRET`
5. Either buy/import a phone number in Vapi, or point the existing Twilio number at the
   voice gateway and set `VAPI_API_KEY` + `VAPI_ASSISTANT_ID` there (see `voice-gateway/README.md`)
6. Set `DEFAULT_BUSINESS_ID` in the web app to the `businesses.id` of the pilot restaurant,
   otherwise caller recognition and call logging stay off

See [AUDIT.md](AUDIT.md) for the current deploy-readiness status and the remaining launch checklist.

## Documentation

- **[docs/booking-ordering-spec.md](docs/booking-ordering-spec.md)** — build-ready feature spec for the
  salon booking and restaurant ordering modules. 18 sections, 56 P0 requirements with Given/When/Then
  acceptance criteria, the POS adapter interface and tiering, the compliance section, a top-5
  competitor compliance benchmark, data model DDL, and the rollout plan.
- **[docs/retell-training-data-request.md](docs/retell-training-data-request.md)** — drafted written
  request to Retell on model training over customer call data (spec OQ-2). Not yet sent.

The spec is the source of truth for **intent**. `AUDIT.md` is the source of truth for **what is
actually built**. They currently disagree on the voice platform — see the 2026-08-01 changelog entry.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: Vapi *(spec section 9.8 selects Retell; not yet migrated — see [AUDIT.md](AUDIT.md))*
- **Telephony**: Twilio (existing gateway preserved)
- **Hosting**: Vercel (web) + Render (voice gateway)

## Origin

Built for Lantern House Vietnamese Restaurant (Reston + Falls Church, VA).
The AI receptionist is named "Linh" — she answers calls in English and Vietnamese.
