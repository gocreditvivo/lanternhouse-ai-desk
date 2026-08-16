# Voka AI Product + Engine Study for Linh

Access date for public references below: 2026-08-16.

## Source discipline

This document separates four evidence classes. Voka is reference input only; no Voka code, branding, or pixel-for-pixel interface should be copied.

### OBSERVED PUBLIC UI
- Public product pages describe an AI receptionist product with booking, SMS, human transfer, integrations, and dashboard/analytics concepts.
- Public integration/onboarding material shows a test-caller / test-booking pattern before live forwarding.

Direct source URLs:
- https://www.voka.ai/
- https://www.voka.ai/integrations
- https://www.voka.ai/pricing

### VENDOR MARKETING CLAIM
The following are vendor claims unless independently verified against a working account or external provider:
- 24/7 answering
- appointment booking and calendar integration
- FAQ / knowledge-base answering
- SMS and two-way SMS
- customer information capture
- human transfer
- call analytics / AI insights
- recording / transcription
- outbound calling
- specific integration availability
- premium/custom MCP, API, webhook, CRM or database connections

These claims are not evidence that the feature works reliably in production.

### VERIFIED REPOSITORY FACT
The Linh repository currently contains provider-neutral booking/POS contracts, mock booking/POS adapters, a voice-core tool router, a training harness, dashboard pages, and a Test Mode implementation branch. These facts are established from repository inspection, not Voka marketing.

### LINH DESIGN PROPOSAL
Use the useful structural pattern without coupling Linh to Voka:

Caller
→ conversation/intention layer
→ provider-neutral tool layer
→ authoritative external system
→ structured action result
→ assistant response
→ dashboard/audit trail

For Linh, real external systems remain source-of-truth. Test Mode stays fully simulated. Production actions require capability checks, exact confirmation, verified business/location scope, provider success, and supervised verification.

## Product lessons retained as proposals
- Integration-first onboarding.
- Existing POS/calendar remains source of truth.
- OAuth where supported.
- Owner can enable/disable locations/services.
- Test caller / sandbox before activation.
- Tool layer between AI and providers.
- Strong operational visibility after calls.
- Human transfer/fallback.
- Knowledge-base management.
- Clear capability flags so Linh never promises unsupported actions.

## Linh differentiation proposal
- Vietnamese-first bilingual quality.
- Natural EN↔VI code-switching.
- Vietnamese names, dishes, services, and pronunciation support.
- One bilingual persona.
- Draft → Test → Approve → Publish workflow.
- Safer no-guess behavior for price, hours, menu, allergy, availability, and policy questions.
- Clear owner-facing readiness and escalation state.

## Query-before-action proposal
Before any real external action, Linh should:
1. Resolve the requested item/service.
2. Query current authoritative data.
3. Validate availability and rules.
4. Read back important details.
5. Obtain confirmation bound to the exact action and normalized payload.
6. Execute through the provider adapter.
7. Require a successful external result/ID.
8. Only then tell the caller the action is confirmed.

## Pilot scope
For the Falls Church synthetic pilot:
1. One bilingual Vietnamese/English Linh persona.
2. Synthetic scenario input and observation.
3. Scoring with adversarial failure cases.
4. Simulated order, booking, transfer, and SMS actions only.
5. User-visible failure, confirmation, verification, and escalation status.
6. No production-ready claim until real-provider and supervised-call gates pass separately.
