# Linh — Lantern House Falls Church Pilot Knowledge Base

Date: 2026-08-15
Owner: ChatGPT product/knowledge-base lane
Implementation/verification owner: Codex
Pilot business: Lantern House Viet Bistro, Falls Church, Virginia

## Purpose

This document is the controlled knowledge-base starting point for Linh's first supervised restaurant pilot. Only information marked VERIFIED may be used as an authoritative answer source. Conflicting or stale information must not be guessed or silently reconciled.

## Locked voice targets

- Vietnamese voice: female, Northern Vietnamese accent, early-to-mid 20s, warm, clear, professional, conversational.
- English voice: female, American English, early-to-mid 20s, warm, polished, clear over the phone.
- Language behavior: English-first unless caller requests/speaks Vietnamese or is clearly struggling; switch cleanly and support code-switching.

## Business identity

### VERIFIED
- Business name: Lantern House Viet Bistro
- Address: 1067 W Broad St, Falls Church, VA 22046
- Phone: +1 703-268-2878
- Business type: Vietnamese restaurant / Vietnamese fusion
- Offers takeout and delivery.
- Accepts reservations according to current business listing data.

### SOURCE CONFLICT / HUMAN CONFIRMATION REQUIRED
The public web currently contains inconsistent operating-hour information and one first-party page carries a "THIS IS A NON LIVE LOCATION" banner. Therefore hours must not be treated as authoritative until Tim or the restaurant confirms the current schedule.

Observed public hours on 2026-08-15:
- Business listing: Mon/Sun 11:00-20:00; Wed-Sat generally 11:00-21:00; Tuesday was not returned in the listing snapshot.
- Older Lantern House site snapshot: Mon/Sun 11:00-19:45; Tue-Sat 11:00-20:45.
- Uber Eats: Sun-Mon 11:00-19:30; Tue-Sat 11:00-20:00.

Linh behavior until confirmed: if asked for hours, state that current hours need confirmation and offer transfer/callback rather than guessing.

## Menu status

### VERIFIED AT CATEGORY LEVEL
Current delivery/menu sources show these categories:
- Milk teas
- Smoothies
- Fruit teas
- Non-alcoholic beverages
- Appetizers / Khai Vị
- Traditional Phở
- Add-ons
- Entrées / Món Chính
- Vegetarian / Chay
- Rice dishes / Cơm
- Specialty noodles
- Baguette / Bánh Mì

Examples repeatedly appearing across current public sources include:
- Fresh Rolls
- Fried Crispy Rolls / Chả Giò
- Traditional Phở
- Vietnamese Sandwich / Bánh Mì
- Bánh Xèo / Viet Crepe
- Shaking Beef
- Stir-fried chicken
- Fried rice
- Vietnamese coffee
- Thai milk tea

### PRICE POLICY
Do not use third-party marketplace prices as authoritative restaurant prices without confirmation. Delivery marketplaces may include channel-specific pricing. Linh must answer price questions only from the verified restaurant menu loaded into the database.

## Reservation policy

### CURRENT SAFE BEHAVIOR
- Linh may collect a reservation request: caller name, phone, date, time, party size, and notes.
- Do not promise table availability unless the booking system has a verified availability source.
- If no availability source exists, say the request has been received and needs confirmation.
- Large parties, private events, or special arrangements should route to staff.

## Order policy

### CURRENT SAFE BEHAVIOR
- Linh may collect pickup-order intent and order details only against the verified menu.
- Never invent menu items, prices, modifiers, wait times, availability, ingredients, or preparation details.
- An order is not final until the restaurant's approved ordering workflow confirms it.
- If a requested item cannot be matched confidently, ask the caller to repeat/clarify or transfer to staff.

## Allergy / dietary safety

- Do not make definitive allergy-safety claims.
- Do not infer ingredient absence from dish names.
- For allergy-sensitive questions, explain that staff confirmation is required and offer transfer/callback.
- Vegetarian/vegan menu labels may be repeated only when they come from verified restaurant data.

## Manager escalation

Escalate when:
- Caller explicitly asks for manager/staff.
- Allergy-sensitive request requires human confirmation.
- Menu/price/hour data is missing or conflicting.
- Caller is difficult to understand after reasonable clarification.
- Booking/order action fails.
- Caller disputes an order, charge, delivery, or prior interaction.

Manager transfer number must remain a deployment-controlled configuration value, not hard-coded into prompts or public documentation.

## Caller experience

Target greeting, English:
"Hi, this is Linh with Lantern House. I can help with the menu, reservations, pickup orders, hours, or connecting you with the restaurant. How can I help you today?"

Target greeting, Vietnamese:
"Xin chào anh chị, em là Linh của Lantern House. Em có thể giúp mình hỏi thực đơn, đặt bàn, đặt món mang về, hỏi giờ mở cửa, hoặc chuyển máy cho nhà hàng. Hôm nay em có thể giúp gì cho mình ạ?"

Do not mention unverified hours, prices, or availability in the greeting.

## Current blockers before a supervised call pilot

1. Confirm current restaurant hours directly with Tim/restaurant.
2. Load and verify the current master menu and in-store prices.
3. Confirm reservation rules and whether availability is real-time or request-only.
4. Confirm pickup-order rules and final confirmation workflow.
5. Apply/review the dedicated Linh Supabase schema and RLS on the dedicated project.
6. Rebuild and verify provider-neutral Linh core from canonical main.
7. Complete Vietnamese/English provider evaluation and voice audition.
8. Run synthetic bilingual regression tests.
9. Run controlled test-number calls before any main-line use.

## Acceptance gate

No customer-facing pilot passes until:
- menu/hour answers are grounded in verified data;
- English and Vietnamese flows pass;
- unknown-answer refusal is correct;
- manager escalation works;
- booking/order writes are tenant-scoped and verified;
- caller data isolation is proven;
- phone tests are supervised and evidence is recorded.
