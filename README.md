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
4. Set the webhook URL to: `https://your-domain.com/api/vapi/webhook`
5. Buy or import a phone number in Vapi

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: Vapi
- **Telephony**: Twilio (existing gateway preserved)
- **Hosting**: Vercel (web) + Render (voice gateway)

## Origin

Built for Lantern House Vietnamese Restaurant (Reston + Falls Church, VA).
The AI receptionist is named "Linh" — she answers calls in English and Vietnamese.
