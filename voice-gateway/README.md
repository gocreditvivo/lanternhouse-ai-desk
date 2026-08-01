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

Environment variables: see `.env.example`.

Twilio Voice webhook:

```text
https://YOUR-RENDER-URL.onrender.com/twilio/voice
```

Method: `POST`.

## Two modes

`/twilio/voice` picks its mode at request time:

| Condition | Behaviour |
| --- | --- |
| `VAPI_API_KEY` **and** `VAPI_ASSISTANT_ID` set, and `VAPI_ENABLED` is not `false` | `<Connect><Stream>` hands the call to the Vapi assistant (full AI ordering, menu Q&A, caller recognition) |
| Either key missing, or `VAPI_ENABLED=false` | Test-mode IVR: language + location selection, manager transfer |

If the Vapi stream fails to establish, Twilio continues past `<Connect>` and the call is
redirected to `/twilio/voice/ivr`, so a Vapi outage degrades to the IVR instead of dropping.

`VAPI_ENABLED=false` is the live kill switch — flip it in the Render dashboard and restart
to fall back to the IVR without a redeploy.

## Test

After deploy:

```text
https://YOUR-RENDER-URL.onrender.com/health
https://YOUR-RENDER-URL.onrender.com/twilio/voice
https://YOUR-RENDER-URL.onrender.com/twilio/voice/ivr
```

`/health` reports `"mode": "vapi"` or `"mode": "test-ivr"` so you can confirm which path is live.

In test-IVR mode, Linh should ask: "Reston or Falls Church?"
