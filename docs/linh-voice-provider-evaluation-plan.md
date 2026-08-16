# Linh Voice Provider Evaluation Plan

## Objective
Select and verify voice providers for Linh without coupling booking, ordering, customer memory, or business rules to one vendor.

## Locked voice targets

### Vietnamese
- Female
- Northern Vietnamese accent
- Perceived age: 20s
- Warm, natural, clear
- Professional young restaurant/salon manager tone
- Strong Vietnamese pronunciation
- Good English code-switching

### English
- Female
- American English
- Perceived age: 20s
- Warm, polished, natural
- Clear phone presence
- Comfortable pronouncing Vietnamese names and menu/service terms

## Candidate providers

### Vbee
Primary Vietnamese voice candidate.
Evaluate:
- Northern voice availability
- Female 20s fit
- streaming/real-time TTS support
- API latency
- interruption/barge-in compatibility
- output audio formats
- pronunciation controls
- code-switching quality
- rate limits
- commercial usage terms

### Vapi
Current committed live-conversation adapter.
Evaluate as the orchestration/call layer while keeping voice provider swappable.

### Retell
Specification candidate only until implemented and verified.
Evaluate:
- bilingual live conversation
- Vietnamese STT
- provider flexibility
- latency
- interruption handling
- call control

### Higgsfield
English voice audition candidate.
Use for English voice quality comparison only unless real-time low-latency API suitability is independently verified.

### Provider-native fallback
Maintain a safe built-in English/Vietnamese fallback for testing if specialized provider integration is unavailable.

## Architecture rule
Business logic must not know which voice provider is active.

Recommended conceptual interfaces:
- SpeechToTextProvider
- TextToSpeechProvider
- ConversationProvider
- TelephonyProvider
- VoiceProfile

Linh core owns:
- booking
- ordering
- menu lookup
- hours lookup
- customer memory
- SMS
- manager transfer decisions
- safety rules

Provider adapters own:
- payload conversion
- streaming audio
- provider authentication
- provider event normalization
- provider-specific error translation

## Voice audition scripts

### Vietnamese naturalness
Xin chào anh chị, em là Linh. Em có thể giúp mình đặt bàn, hỏi về món ăn, giờ mở cửa, hoặc chuyển máy cho quản lý. Hôm nay anh chị cần em giúp gì ạ?

### Vietnamese mixed-language
Dạ, mình muốn đặt bàn cho four people lúc 7:30 tối nay đúng không ạ? Em xin phép xác nhận lại tên và số điện thoại của mình nhé.

### English naturalness
Hi, this is Linh. I can help with reservations, menu questions, hours, orders, or connecting you with our team. What can I help you with today?

### English Vietnamese-name test
Absolutely. I have a reservation for four at 7:30 tonight under Nguyễn. Let me confirm the phone number with you.

## Scoring rubric
Score 1–5 for each candidate:
- age fit
- regional/accent fit
- naturalness
- warmth
- clarity
- phone presence
- pronunciation
- code-switching
- pacing
- emotional consistency
- latency suitability

Target: 4.5/5 average or better for voice quality before voice lock.

## Real-time technical gates
A voice may sound excellent but still fail production suitability.

Require:
- first-audio latency measured
- sustained streaming stability
- barge-in behavior
- long-response behavior
- provider timeout behavior
- retry behavior
- rate-limit handling
- fallback behavior
- no duplicate speech after reconnect

## Vietnamese STT gates
Test at minimum:
- Northern Vietnamese
- fast natural speech
- restaurant names
- Vietnamese dish names
- phone numbers
- dates/times
- English words inside Vietnamese sentences
- accented and unaccented proper names

Target:
- >=95% correct language-switch behavior across test suite
- no unsafe guessing when transcription confidence is weak

## English STT gates
Test:
- American conversational speech
- Vietnamese names
- restaurant terms
- noisy phone audio
- dates/times
- party sizes
- phone numbers

## Failure behavior
If voice/STT confidence is weak:
- ask one clarification question
- repeat critical values back
- escalate to staff when unresolved
- never invent menu, price, hours, availability, or allergy details

## Provider selection decision record
For each provider record:
- provider
- product
- voice name
- voice ID
- language
- accent
- perceived age
- score
- latency
- API suitability
- real-time suitability
- fallback suitability
- blockers
- decision

## Pilot lock criteria
Do not activate a live customer number until:
- Vietnamese voice selected
- English voice selected
- both voices pass quality threshold
- Vietnamese STT passes bilingual tests
- provider adapters pass integration tests
- supervised synthetic/test-number calls pass
- manager transfer works
- kill switch is verified

## Current status
Voice targets are locked. Provider choice is not locked. Current committed repo voice configuration is historical and must not be treated as the final Linh voice.
