/**
 * Twilio → Vapi Bridge — reference notes
 *
 * The bridge is IMPLEMENTED in `voice-gateway/server.js`. This file documents the two
 * deployment shapes so the choice is not re-litigated from scratch later.
 *
 * APPROACH 1 — Twilio number → gateway → Vapi (what is implemented, and what the pilot uses)
 *   Twilio POSTs the call to the gateway's /twilio/voice. When VAPI_API_KEY and
 *   VAPI_ASSISTANT_ID are set, the gateway responds with <Connect><Stream> pointing at
 *   VAPI_STREAM_URL and Vapi runs the conversation. Vapi then calls the Next.js webhook at
 *   /api/vapi/webhook for assistant-request, tool calls, and the end-of-call report.
 *
 *   Chosen because it keeps the Twilio number, keeps the manager-transfer IVR as a live
 *   fallback, and can be switched off with VAPI_ENABLED=false without a redeploy.
 *
 * APPROACH 2 — Vapi-hosted number (simpler, less control)
 *   Import the Twilio number into Vapi (Dashboard → Phone Numbers → Buy/Import) and attach
 *   the assistant. Calls never touch the gateway, so the IVR fallback and manager transfer
 *   are lost, and Twilio is left handling only outbound SMS.
 *
 * In both approaches the gateway keeps serving /health, and Vapi's webhooks are unchanged.
 */

export {};
