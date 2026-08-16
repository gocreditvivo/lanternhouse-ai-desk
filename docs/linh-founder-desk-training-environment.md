# Linh Founder Desk Training Environment

## Purpose
Run high-volume, low-cost Linh training locally or through Founder Desk Agent without touching live customers, production POS, payments, or public phone numbers.

## Operating loop
1. Generate deterministic or model-assisted scenarios.
2. Send each scenario to Linh's offline text/conversation interface.
3. Capture detected intent, entities, proposed tool, confirmation behavior, escalation behavior, and any invented facts.
4. Score the result with the deterministic scorer.
5. Put failures into a retry queue grouped by failure type.
6. Re-run after proposed fixes.
7. Escalate only repeated/hard failures to ChatGPT/Codex.
8. Produce a daily summary with pass rate, failure clusters, regressions, and recommended fixes.

## Cost discipline
- Prefer deterministic generated cases for names, dates, times, party sizes, dishes, modifiers, and order quantities.
- Use text-only simulations for most training.
- Cache menus and lexicons rather than resend large context on every case.
- Use a cheaper model for routine variations if a model is needed.
- Escalate only ambiguous/repeated failures to premium reasoning.
- Reserve STT/TTS for pronunciation, accent, interruption, barge-in, and latency tests.

## Current harness
- `web/src/lib/training/types.ts`
- `web/src/lib/training/scenarios.ts`
- `web/src/lib/training/scorer.ts`
- `web/tests/training-scorer.test.ts`

## Required Founder Desk output per run
- run id and timestamp
- scenario count
- pass count / fail count / pass rate
- failures by category
- top repeated failures
- regressions versus previous run
- proposed fixes
- retry results
- cases requiring human/Codex review

## Safety boundary
The trainer must not publish knowledge, change production configuration, send SMS, make calls, place real orders, create real reservations, or write customer data. Training data is synthetic unless separately approved.

## Promotion gate
TRAIN -> SCORE -> PROPOSE FIX -> TEST FIX -> VERIFY -> PROMOTE.

A training improvement is not promoted merely because the trainer suggests it. It must pass regression tests and be independently verified before it can affect production behavior.
