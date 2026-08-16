# Bukkii → Linh Dashboard Blueprint

Status: planning artifact only. Based on a read-only walkthrough of the authenticated Bukkii admin account for Allure salon. No Bukkii account changes were made.

## Observed Bukkii patterns worth adapting

- Public booking supports solo and group booking.
- Booking funnel follows service → staff → time.
- Guest checkout is available.
- Services can have share links.
- A booking widget is exposed for embedding.
- Bukkii distinguishes AI lead time from normal booking lead time.
- Staff can be explicitly assigned, with an “Anyone” option.
- Calendar provides multiple views and zoom controls.
- Services support duration, buffers, and staff assignment.
- Consent copy is integrated into booking.
- Navigation is operational rather than technical: Calendar, Services, AI Scan, Staff, Customers/Clients, Activity, Settings.

## Observed weak points / opportunities for Linh

- AI Scan and Menu Digitizer resolve to the same legacy route, suggesting the import/digitization experience is not a strong current product surface.
- Current inspected account had 20 services all priced at $0, no categories, no buffers, zero clients, and no prior menu imports, so the setup UX does not appear to strongly enforce data completeness.
- AI Receptionist was previously shown as not activated, so the inspected account did not demonstrate a strong live-agent control center.

## Product direction for Linh

Linh should use an owner-first operating dashboard, not an AI-engineering console.

Primary navigation:

1. Overview
2. Linh Setup
3. Knowledge
4. Menu / Services
5. Hours
6. Reservations / Appointments
7. Orders
8. Customers
9. Calls
10. Voice Studio
11. Rules & Safety
12. Staff / Transfer
13. SMS / Notifications
14. Integrations
15. Test Linh
16. Go Live

## Core setup philosophy

Use a controlled lifecycle:

Draft → Test → Approve → Publish

A restaurant or salon owner should never need to understand prompts, model names, APIs, tokens, or RLS to configure Linh.

## Overview screen

Show only high-value operational information:

- Linh status: Draft / Test / Live / Paused
- Calls today
- Missed/failed calls
- Reservations or appointments created
- Orders captured
- Transfers to staff
- Unresolved questions
- Knowledge health
- Menu/services health
- Hours verification state
- Voice status for English and Vietnamese
- Integration health
- “Test Linh” shortcut
- Live kill switch

## Menu / Services design

Take the service setup simplicity from Bukkii but improve it for AI use.

Each menu/service item should support:

- English name
- Vietnamese name
- category
- description
- price
- duration where relevant
- modifiers/options
- size
- spicy level
- allergy notes
- sold-out / unavailable state
- location availability
- staff assignment for salons
- AI-safe pronunciation hint where useful
- source / last verified time
- Draft / Approved state

### Menu Digitizer

Linh should make this a first-class feature rather than a legacy side route.

Flow:

Upload photo/PDF/image → detect sections → detect items → detect prices → detect modifiers → bilingual review → owner correction → confidence flags → approve → publish to Linh knowledge.

Never publish OCR output directly to live calls without owner review.

## Booking / reservation design

Adapt Bukkii’s service → staff → time funnel for both voice and dashboard.

### Restaurant

Caller intent:

“Table for four Friday at 7.”

Linh needs:

- location
- date
- time
- party size
- customer name
- callback number
- seating preference if supported
- notes

Then Linh should check:

- business hours
- reservation policy
- blocked periods
- table/slot capacity if connected
- large-party rules

Dashboard should show:

- source = AI call / web / staff
- customer
- party size
- time
- status
- language
- notes
- transcript/summary reference
- confirmation state

### Salon

Use Bukkii’s service → staff → time pattern:

- service
- duration
- preferred technician
- “Anyone” option
- lead time
- buffers
- availability
- customer details
- reminders

Linh should be able to conversationally collect these fields and write the same underlying booking object as the web dashboard.

## Customer memory

Useful memory:

- name
- phone
- preferred language
- last booking
- last order
- favorite/recent services
- preferred staff member
- simple owner-approved notes
- call history

Avoid excessive or sensitive profiling that does not improve service.

## Voice Studio

### Vietnamese

Target: Northern Vietnamese female, early 20s; warm, natural, clear, professional.

### English

Target: American female, early 20s; friendly, polished, confident.

Voice Studio should include:

- provider
- voice name
- language
- sample playback
- speed
- warmth/style control where provider supports it
- pronunciation test
- code-switching test
- latency result
- approval status

## Rules & Safety

Owner-facing toggles/rules should include:

- never invent menu items, services, prices, hours, availability, or policies
- allergy questions escalate to staff unless a deterministic approved answer exists
- complaint/refund escalation
- manager transfer rules
- after-hours behavior
- unsupported request fallback
- maximum party size / booking restrictions
- order-confirmation wording
- permitted SMS follow-up

## Staff / Transfer

Adapt Bukkii staff assignment patterns:

- staff member
- role
- locations
- services
- working hours
- transfer number
- Vietnamese/English capability
- escalation priority
- active/inactive

Include “Anyone available” where appropriate.

## Calls

Each call should surface:

- caller
- date/time
- language
- intent
- duration
- outcome
- reservation/order/appointment created
- transfer result
- SMS sent
- AI confidence / unresolved items
- short summary
- transcript where configured

## Test Linh

This should be a major differentiator.

Owner can run scenarios before publishing:

- type a caller message
- choose English or Vietnamese
- run scripted test conversation
- test unknown menu item
- test wrong hours
- test sold-out item
- test allergy question
- test booking conflict
- test manager transfer

Output should show:

- what Linh said
- what data Linh read
- what action she would take
- whether an escalation occurred
- PASS / REVIEW

## Go Live

One page should answer: “Is Linh ready?”

Checks:

- business identity
- hours verified
- menu/services approved
- voices approved
- provider connected
- phone connected
- staff transfer tested
- bilingual test passed
- SMS tested
- booking/order integration tested
- no unresolved critical safety issues

Controls:

- Test mode
- Go live
- Pause Linh
- kill switch

## MVP recommendation

For Lantern House Falls Church, build first:

1. Overview
2. Linh Setup
3. Menu / Knowledge
4. Hours
5. Reservations
6. Calls
7. Voice Studio
8. Rules & Safety
9. Staff Transfer
10. Test Linh
11. Go Live

Orders, advanced customer analytics, deep integrations, and multi-location management can follow once the core receptionist path passes real supervised testing.

## Competitive principle

Do not copy Bukkii pixel-for-pixel. Borrow operational simplicity and booking patterns, then make Linh stronger in the areas that matter to AI reception:

- bilingual control
- verified knowledge
- voice selection
- safe publishing
- test-before-live workflow
- clear call outcomes
- restaurant + salon support from one operating model
