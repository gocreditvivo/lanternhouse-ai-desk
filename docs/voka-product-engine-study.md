# Voka AI Product + Engine Study for Linh

## Purpose
Capture the useful public patterns from Voka AI for Linh. This is product/architecture research, not a clone specification.

## What Voka publicly offers
- 24/7 AI call answering
- Appointment booking and calendar integration
- FAQ/knowledge-base answering
- SMS sending and two-way SMS add-ons
- Customer information capture
- Human call transfer
- Multiple AI assistants and phone numbers depending on plan
- Call analytics and AI insights
- Call recording/transcription in product marketing
- Voice + chat agent offerings
- Outbound calling for follow-up, qualification, nurturing, and campaigns
- Integrations with Square Appointments, Acuity Scheduling, Google Calendar, Calendly
- Automation through Zapier, Make, and n8n
- Premium/custom integrations through MCP, APIs, webhooks, CRM/database connections
- Industry-specific templates/use cases including restaurants and beauty/wellness

## Engine pattern
Voka's public architecture pattern is:

Caller
→ AI voice agent
→ conversation/intention layer
→ tool/MCP layer
→ external source-of-truth system
→ action/result
→ assistant response
→ dashboard/transcript/analytics/SMS

The strongest concept is not the specific vendor stack. It is the separation between conversation and external business systems.

## MCP/tool model
Voka publicly describes MCP as:
1. Define tools/resources with schemas.
2. Let the AI decide when to call a tool.
3. Execute the tool and return structured results.
4. Use those results to answer or complete the action.

For Linh, use the same abstract pattern without coupling the business logic to one provider.

## Square Appointments pattern
Public Voka material shows a strong onboarding/integration flow:
1. Connect Square account with OAuth.
2. Sync business, locations, staff calendars, services/products, pricing/duration, and availability.
3. Let owner enable/disable locations and services for AI use.
4. Test using a test caller.
5. Create a test booking and verify it appears in Square.
6. Forward business line to AI when ready.
7. Monitor calls, transcripts, recordings, bookings, reschedules, cancellations, SMS, success rate, duration, and booking activity.

Important principle: Square remains the source of truth.

## Scheduling integrations observed publicly
- Square Appointments
- Acuity Scheduling
- Google Calendar
- Calendly

Coming-soon/publicly advertised areas include Jobber and Housecall Pro.

## Automation integrations
- Zapier
- Make
- n8n

These can be fallback connectors when a first-party adapter does not yet exist.

## Voice/assistant configuration patterns
Public Voka material shows these settings/patterns:
- Premium voice selection
- Multiple voice providers in some integration flows
- ElevenLabs BYOK mentioned publicly
- Preferred language
- Custom greeting
- Transfer-to-human rules
- Multi-location hours/settings
- Knowledge base / FAQ configuration
- Test Caller before go-live

For Linh, voice should remain one bilingual Vietnamese/English persona rather than separate product identities.

## Knowledge-base pattern
Voka markets knowledge-base support for business questions such as:
- services
- pricing
- policies
- FAQs
- business information

Linh should extend this for Vietnamese-owned restaurants/salons with:
- Vietnamese + English names
- Vietnamese pronunciation notes
- menu/services
- modifiers
- sold-out status
- hours
- location
- reservation/appointment rules
- allergy/escalation rules
- parking/directions
- manager handoff instructions

## SMS pattern
Public product/pricing materials show:
- booking links
- directions
- menus
- intake forms
- confirmation/follow-up
- two-way SMS conversations
- owner lead-alert texts on higher SMS tier

For Linh, SMS should be tied to explicit business actions and consent records.

## Analytics/operations pattern
Useful Voka ideas:
- call transcript
- recording
- booking outcome
- reschedule/cancel outcome
- SMS activity
- total calls
- success rate
- average duration
- time saved
- booking activity
- AI insights / extracted action items

Linh should add:
- language used
- EN↔VI switch count
- transfer reason
- unresolved knowledge question
- confidence/verification outcome for menu/hours answers
- failed tool action
- retry result

## Outbound pattern
Voka publicly offers outbound calling for:
- appointment setting
- follow-up
- lead nurturing
- qualification

This is not P0 for Linh's restaurant receptionist pilot. Keep as later-phase capability.

## Pricing/packaging lessons
Voka publicly packages:
- base voice plan by minutes
- number of assistants/phone numbers by tier
- scheduling integrations as add-ons
- SMS as add-on
- automation connectors included

Lesson for Linh: keep pricing understandable. Do not force owners to understand AI infrastructure pricing.

## What Linh should copy as a pattern
- Integration-first onboarding
- Existing POS/calendar remains source of truth
- OAuth connection where possible
- Owner can enable/disable locations/services for AI use
- Test caller/test booking before activation
- Tool layer between AI and external systems
- Strong operational visibility after calls
- Human transfer/fallback
- Knowledge-base management
- Explicit add-on model for advanced integrations if commercially useful

## What Linh should improve
- One unified admin instead of fragmented tooling
- Vietnamese-first quality for Vietnamese-owned businesses
- Better Vietnamese name/menu pronunciation
- Smooth EN↔VI code-switching
- One bilingual persona
- Draft → Test → Approve → Publish for business knowledge and AI behavior
- Menu Scan with mandatory human review before import
- Safer no-guess behavior for prices/hours/menu/allergy questions
- Clear owner-facing readiness status
- Clear integration capability flags

## Linh adapter architecture
Use one provider-neutral contract.

### Booking adapter capabilities
- connectAccount
- getLocations
- getServices
- getStaff
- getAvailability
- getCustomer
- createCustomer
- createBooking
- rescheduleBooking
- cancelBooking
- subscribeWebhooks

### Restaurant POS adapter capabilities
- connectAccount
- getLocations
- getMenu
- getModifiers
- getItemAvailability
- getCustomer
- createOrder
- updateOrder
- getOrder
- getOrderStatus
- subscribeWebhooks

### Capability flags
Each adapter must explicitly declare supported functions. Linh must never promise an action that the connected provider cannot perform.

Example capability set:
- menuRead
- itemAvailability
- createOrder
- modifyOrder
- booking
- reschedule
- cancel
- deposits
- recurringBooking
- staffRouting
- customerLookup
- webhooks

## Query-before-action rule
Before Linh confirms any external action:
1. Resolve the requested item/service.
2. Query current authoritative data.
3. Validate availability/rules.
4. Read back important details.
5. Get caller confirmation where needed.
6. Execute through adapter.
7. Require successful external result/ID.
8. Only then tell caller the action is confirmed.

## First Linh pilot priorities
For Lantern House Falls Church:
1. One bilingual Vietnamese/English Linh persona.
2. Verified hours/menu/prices/policies.
3. FAQ/knowledge answering.
4. Reservation intake or booking integration if available.
5. Order-intake flow only when authoritative POS data/action path exists.
6. SMS confirmation.
7. Manager transfer.
8. Call summary/history.
9. Test Caller / sandbox flow.
10. Go-live gate only after supervised bilingual end-to-end tests.

## What not to build yet
- Broad outbound campaigns
- Complex CRM sales qualification
- Every POS integration at once
- Enterprise workflow marketplace
- Unverified live ordering without source-of-truth integration

## Core product lesson
Voka demonstrates a mature general-purpose AI receptionist pattern. Linh should use the same structural ideas while differentiating on Vietnamese/English bilingual quality, Vietnamese-owned restaurant/salon workflows, simpler configuration, and stronger owner approval controls.
