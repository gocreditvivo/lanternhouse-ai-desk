# Linh Dashboard Build Plan

## Goal
Build one owner-friendly dashboard for Linh, inspired by verified Bukkii workflow patterns but improved for safety, bilingual operation, restaurants, and salons.

## Core navigation
- Dashboard / Today
- Calendar
- Reservations / Appointments
- Orders
- Services / Menu
- Menu Scan
- Staff & Availability
- Customers
- Calls
- Linh Setup
- Voice Studio
- Rules & Safety
- Notifications
- Integrations
- Test Linh
- Go Live

## Core product rules
- One unified admin experience.
- Mobile-first for non-technical owners.
- Draft -> Test -> Approve -> Publish for live-affecting changes.
- Services/menu and hours are authoritative business knowledge.
- Never guess prices, hours, availability, or menu facts.
- Guest booking is allowed.
- Normal booking rules and AI booking rules are separate.
- Menu extraction always requires human review before import or publish.

## Booking flow
Just Me / Group Booking -> Service -> Staff or Anyone -> Date & Time -> Login or Guest -> Contact / Consent -> Confirm.

Requirements:
- Restaurant reservations: party size, date/time, customer name, phone, notes.
- Salon appointments: services, requested staff or Anyone, date/time, duration, notes.
- Anyone assigns only eligible staff.
- Availability enforces hours, staff schedules, buffers, booking window, blocked time, and slot size.
- Required fields block confirmation.
- SMS consent is stored separately.

## Calendar
Daily, weekly, monthly views with staff columns and a quick appointment drawer. Drawer should support customer search, walk-in customer, service, staff/Anyone, date/time, duration, end time, repeat, notification toggle, notes, status, and Block Time.

## Services / Menu
Support title, Vietnamese title, description, image, category, duration, buffer, price, assigned staff, availability, public booking link, active/draft/sold-out status, and restaurant modifiers where relevant.

Do not expose placeholder $0 values publicly unless intentionally marked free.

## Menu Scan
Upload -> Extract -> Review/Edit -> Validate -> Approve Import -> Publish separately.

MVP image formats: JPEG, PNG, WebP, GIF. Extract candidate fields such as category, item/service name, Vietnamese name, description, price, duration, and modifiers. Never auto-publish extracted data.

## Customers
Store useful operational memory only: name, phone, optional email, preferred language, notes, booking/order history, recent calls, consent, and requested staff preference.

## Calls
Show masked caller ID, time, language, intent, outcome, linked booking/order, transfer status, summary, and needs-review status. Transcript/recording only when permitted and configured.

## Linh Setup
Owner controls: assistant name, business, greeting, language behavior, business type, allowed actions, transfer target, after-hours behavior, fallback behavior.

## Voice Studio
Vietnamese target: Northern Vietnamese female, early 20s, warm, clear, professional.
English target: American female, early 20s, warm, polished, confident.

No voice is approved until supervised tests meet naturalness and language-switch requirements.

## Rules & Safety
- never invent prices
- never invent hours
- never invent availability
- never invent menu/services
- escalate allergy-sensitive questions
- escalate uncertain or complaint cases to staff
- do not confirm bookings/orders unless backend persistence succeeds

## Test Linh
Support text scenario, simulated call event, synthetic booking/order action, voice sample, and bilingual switch tests. Show intent, language, source data, proposed action, safety block, response, and whether a write would occur.

## Go Live
Show provider health, Supabase health, business-data completeness, approved menu/hours, phone routing status, latest tests, RLS/isolation status, blockers, rollback/kill-switch guidance, and current Draft/Test/Live/Paused state.

## P0 order
1. Business / hours / location
2. Services / menu
3. Staff / availability
4. Booking / reservation engine
5. Calendar
6. Customers
7. Linh Setup
8. Rules & Safety
9. Test Linh
10. Calls
11. Voice Studio
12. Go Live gate

Every phase follows BUILD -> VERIFY -> PASS/FAIL. Failure means fix and retest before advancing.
