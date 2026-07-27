# Lantern House AI Desk

Node.js gateway for testing Linh, the Lantern House AI phone host.

## Render deploy

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variables:

```text
NODE_ENV=production
TWILIO_TEST_MODE=true
TWILIO_MANAGER_PHONE=+15717495444
PUBLIC_BASE_URL=https://YOUR-RENDER-URL.onrender.com
ALLOWED_ORIGINS=https://lanternhousevietbistro.com,https://www.lanternhousevietbistro.com,https://www.lanternhousekitchenbar.com
```

Twilio Voice webhook:

```text
https://YOUR-RENDER-URL.onrender.com/twilio/voice
```

Method: `POST`.

## Test

After deploy:

```text
https://YOUR-RENDER-URL.onrender.com/health
https://YOUR-RENDER-URL.onrender.com/twilio/voice
```

Linh should ask: "Reston or Falls Church?"
