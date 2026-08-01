/**
 * Twilio → Vapi Bridge
 * 
 * This file shows how to connect the existing Twilio voice gateway
 * (voice-gateway/server.js) to Vapi's AI assistant.
 * 
 * Currently, server.js uses basic TwiML Gather/Say for call handling.
 * This bridge replaces that with Vapi's conversational AI.
 * 
 * TWO APPROACHES:
 * 
 * APPROACH 1: Twilio Programmable Voice → Vapi (Recommended)
 * - Twilio receives the call, forwards to Vapi via <Connect> verb
 * - Vapi handles the entire conversation
 * - Vapi sends function-call webhooks to your Next.js API
 * - Your existing gateway stays as a thin TwiML router
 * 
 * APPROACH  2: Direct Vapi Number (Simpler)
 * - Port your Twilio number to Vapi or get a new Vapi number
 * - Vapi handles everything (no Twilio gateway needed)
 * - Keep Twilio only for SMS
 */

// ============================================================
// APPROACH 1: Updated TwiML for voice-gateway/server.js
// Replace the /twilio/voice route with this TwiML:
// ============================================================

export const vapiTwimlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="wss://your-vapi-websocket-url"
      assistantConfig='{"name":"linh","model":"gpt-4o-mini","voice":"adam"}'
    />
  </Connect>
</Response>`;

// OR using Vapi's Twilio integration directly:
export const vapiConnectTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://relay.vapi.ai/twilio" />
  </Connect>
</Response>`;

// ============================================================
// APPROACH 1: Modified server.js route (JavaScript)
// Add this to voice-gateway/server.js to forward to Vapi:
// ============================================================

export const modifiedServerJsRoute = `
// Add to voice-gateway/server.js

// New route: /twilio/voice/vapi
// Forwards calls to Vapi AI instead of using basic TwiML
if (req.method === 'POST' && url.pathname === '/twilio/voice/vapi') {
  const twiml = \`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="wss://\${VAPI_WEBSOCKET_URL}"
      assistantConfig='{"name":"linh","business_name":"\${BUSINESS_NAME}"}'
    />
  </Connect>
</Response>\`;
  sendXml(res, 200, twiml);
  return;
}
`;

// ============================================================
// Environment variables to add to voice-gateway/.env.example:
// ============================================================

export const envVarsToAdd = `
# Vapi AI (add to .env)
VAPI_API_KEY=your-vapi-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_WEBHOOK_URL=https://your-web-app-url.com/api/vapi/webhook
BUSINESS_NAME=Lantern House Vietnamese Restaurant
`;

// ============================================================
// APPROACH 2: Vapi Direct Number (no Twilio gateway changes)
// ============================================================

export const vapiDirectSetup = `
// If using Vapi's direct phone number:
// 1. Go to Vapi dashboard → Phone Numbers → Buy/Import
// 2. Import your existing Twilio number or buy a new one
// 3. Assign your assistant to the number
// 4. Calls go directly to Vapi — no TwiML gateway needed
// 5. Vapi webhooks → your Next.js API at /api/vapi/webhook
// 6. Keep Twilio only for outbound SMS

// The voice-gateway/server.js can remain for:
// - Health checks (/health)
// - Fallback if Vapi is down
// - Manager transfer (Dial to +15717495444)
`;
