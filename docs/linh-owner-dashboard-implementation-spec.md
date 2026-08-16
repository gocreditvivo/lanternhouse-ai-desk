# Linh Owner Dashboard — Implementation Specification

## Purpose
Build a non-technical-owner-first control center for Linh. The owner should be able to configure the business, review knowledge, set booking/order rules, test Linh, and publish approved changes without touching code.

## Pilot
Lantern House Falls Church.

## Product principles
- One unified admin experience.
- Mobile-first and usable by non-technical owners.
- Draft → Test → Approve → Publish for configuration changes.
- Never silently publish AI-extracted or owner-edited business data.
- Separate ordinary booking rules from AI-assisted booking rules.
- No guessing for menu items, prices, hours, availability, allergy details, or business policies.
- Every risky or uncertain request must have a clear staff-escalation path.

## Navigation
1. Dashboard / Today
2. Calendar
3. Reservations / Appointments
4. Orders
5. Services / Menu
6. Menu Scan
7. Staff & Availability
8. Customers
9. Calls
10. Linh Setup
11. Voice Studio
12. Rules & Safety
13. Notifications
14. Integrations
15. Test Linh
16. Go Live

## Dashboard / Today
Show:
- Linh status: Draft / Test / Live / Paused
- Calls today
- Reservations today
- Orders today
- Missed/failed interactions
- Knowledge health
- Unverified data warnings
- Pending approvals
- Last publish time
- Quick actions: Test Linh, Edit Hours, Add Menu Item, Add Reservation, Pause Linh

## Calendar
Required behaviors:
- Day / Week / Month views
- Staff/provider columns where applicable
- Quick appointment drawer
- Search by customer name, phone, or email
- Block Time
- New walk-in customer
- Add multiple services
- Staff = specific staff or Anyone
- Requested-staff flag
- Duration, buffer, start/end time calculations
- Notification toggle
- Unsaved-change warning

## Reservations / Appointments
Statuses:
- draft
- requested
- confirmed
- cancelled
- completed
- no_show
- needs_review

Fields:
- customer
- party size or participant count
- service/reservation type
- date
- start time
- end time
- duration
- staff / Anyone
- requested staff flag
- notes
- source: phone / web / staff / AI
- confirmation status
- notification status

## Orders
Statuses:
- received
- needs_review
- confirmed
- preparing
- ready
- completed
- cancelled

Required safety:
- Linh may record an order request.
- Do not claim an order is final until the configured business workflow allows it.
- Allergy-sensitive requests are escalated.
- Unsupported modifiers are not invented.

## Services / Menu
Fields:
- English name
- Vietnamese name
- description
- category
- price
- duration where relevant
- buffer
- image
- modifiers/options
- availability
- sold-out flag
- staff assignment
- public/share link
- source
- verification status
- published version

Validation:
- Prevent accidental public $0 price unless explicitly marked free.
- Warn on missing price, duration, category, or availability where required.
- Preserve prior published version until new draft is approved.

## Menu Scan
Flow:
Upload → Extract → Review/Edit → Approve Import → Save Draft → Test → Publish

Inputs:
- image
- PDF later
- mobile photo later

Extract where supported:
- category
- English item name
- Vietnamese item name
- description
- price
- modifiers
- sizes
- notes

Every extracted field must carry:
- source file
- source region/page where available
- confidence
- review state

Never auto-publish imported data.

## Staff & Availability
Fields:
- staff name
- active/inactive
- services
- working hours
- breaks
- blocked time
- booking eligibility
- languages
- transfer number if applicable

Support:
- specific staff
- Anyone assignment
- requested staff

## Customers
Fields:
- name
- phone
- email
- language preference
- notes
- visit/booking history
- order history
- call history
- SMS consent
- last interaction

Only retain customer memory that is useful for service. Avoid unnecessary personal profiling.

## Calls
Show:
- caller
- date/time
- language
- intent
- outcome
- transfer status
- reservation/order created
- summary
- failure reason
- transcript/recording only when enabled and appropriate

Filters:
- language
- outcome
- transferred
- booking/order
- failed

## Linh Setup
Fields:
- assistant name
- business name
- location
- default language policy
- greeting
- business description
- manager transfer rules
- fallback behavior
- operating mode

## Voice Studio
Vietnamese target:
- female
- Northern Vietnamese
- 20s
- warm
- natural
- clear
- professional restaurant/salon-manager tone

English target:
- female
- American
- 20s
- warm
- polished
- natural

Controls:
- voice provider
- voice ID
- preview text
- sample playback
- speed
- tone/style if provider supports it
- test-call-only flag

Do not bind business logic to one voice provider.

## Rules & Safety
Owner-configurable rules:
- never invent prices
- never invent hours
- never invent availability
- never invent menu/services
- allergy-sensitive escalation
- complaint escalation
- refund escalation
- uncertain-answer escalation
- manager transfer
- unsupported request handling

## Booking Rules
Separate normal and AI-assisted rules.

Fields:
- normal lead time
- AI lead time
- booking window
- slot size
- allow guest booking
- allow multiple services
- allow Anyone assignment
- show requested label
- duplicate-booking detection
- login requirement
- confirmation requirement

## Notifications
Support:
- SMS confirmation
- SMS reminder
- cancellation notice
- staff alert
- failed-call alert
- configurable templates
- consent tracking

## Integrations
Cards for:
- Supabase
- Twilio
- Vapi
- Retell candidate
- Vbee candidate
- POS/reservation providers
- Google reviews
- website booking widget

Each card shows:
- connected / not connected
- last verification
- environment
- test action

## Test Linh
Owner can test without publishing.

Modes:
- text simulation
- synthetic booking test
- synthetic menu question
- bilingual language-switch test
- voice sample preview
- later: supervised test call

Show:
- user input
- Linh response
- data source used
- action attempted
- result
- guardrail triggered
- escalation path

## Go Live
Checklist must include:
- business identity verified
- hours verified
- menu/services verified
- prices verified
- voice selected
- Vietnamese STT verified
- English STT verified
- booking/order rules verified
- manager transfer verified
- two-user RLS isolation passed
- auth verified
- test suite passed
- supervised test calls passed
- rollback/kill switch known

States:
- blocked
- ready_for_test
- ready_for_pilot
- live
- paused

## Acceptance gates
P0 dashboard is not complete until:
- all major routes render
- loading/error/empty/blocked states exist
- draft settings persist
- unpublished changes do not affect live behavior
- public booking flow works with synthetic data
- no cross-user data leakage
- Menu Scan requires review before import
- voice provider is abstracted
- tests, TypeScript, lint, build, and dependency audit pass

## Founder experience requirement
A non-technical owner must be able to understand what is configured, what is unverified, what is live, and what needs attention without reading code, prompts, or API documentation.
