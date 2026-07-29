# Lantern House AI Desk

Node.js gateway for controlled laboratory testing of Linh, the Lantern House bilingual AI phone host.

## Safety status

- Test mode only
- Production traffic blocked
- No live ordering or payments
- Manager transfer works only when a verified E.164 phone number is supplied as a deployment secret
- Personal phone numbers must never be committed to this repository

## Render deploy

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables:

```text
NODE_ENV=production
TWILIO_TEST_MODE=true
TWILIO_MANAGER_PHONE=<verified test number in E.164 format>
PUBLIC_BASE_URL=https://YOUR-RENDER-URL.onrender.com
ALLOWED_ORIGINS=https://lanternhousevietbistro.com,https://www.lanternhousevietbistro.com,https://www.lanternhousekitchenbar.com
```

Optional environment variables:

```text
TWILIO_CALLER_ID=<Twilio-owned caller ID in E.164 format>
TWILIO_VIETNAMESE_LANGUAGE=vi-VN
```

Do not place real phone numbers in `.env.example`, source files, commits, screenshots, issues, or documentation.

## Twilio Voice webhook

```text
https://YOUR-RENDER-URL.onrender.com/twilio/voice
```

Method: `POST`.

## Verification

Run locally:

```bash
npm run check
npm test
```

After deployment, verify:

```text
GET  https://YOUR-RENDER-URL.onrender.com/health
POST https://YOUR-RENDER-URL.onrender.com/twilio/voice
```

The health response must show:

```json
{
  "ok": true,
  "mode": "test",
  "managerPhoneConfigured": true
}
```

Linh should offer English or Vietnamese, then ask whether the caller needs Reston or Falls Church.
