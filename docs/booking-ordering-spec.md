# Linh — Salon Booking and Restaurant Ordering Modules
## Build-Ready, Compliance-Grade Product Requirements Document

---

## 0. Document control

| Field | Value |
|---|---|
| Document | Linh booking and ordering modules — functional and compliance specification |
| Version | 1.0 |
| Date | 2026-08-01 |
| Owner | Tim Do, founder |
| Working language | English (build docs). All caller-facing and owner-facing strings specified in English and Vietnamese. |
| Status | Approved for build. Sections 3 through 13 are implementable as written. Open items are isolated in section 16. |
| Product | Linh — bilingual EN/VI AI voice receptionist for Vietnamese-owned nail salons and restaurants |
| Launch geography | Eden Center / Falls Church, VA corridor; founder based in North Laurel, Maryland |
| Infrastructure budget ceiling | Under $5,000 per month, all vendors combined |
| Existing repo | `gocreditvivo/lanternhouse-ai-desk` — Node Twilio gateway plus Next.js 14 web app, Supabase, Twilio, Vercel plus Render |
| Canonical schema | `businesses`, `calls`, `bookings`, `customers`, `messages`, `orders` as defined in `build-prompts-customized.md`. This document extends that schema; it does not replace it. |

### 0.1 Scope statement

In scope: the salon booking module, the restaurant ordering module, the POS adapter layer that both sit on, the module feature-flag system that turns each on and off per tenant, the caller-facing and owner-facing language policy, the compliance controls that gate the whole product, and the schema changes required to support all of it.

Out of scope for this document: the marketing landing page, the billing and subscription system, the mobile app shell, and the owner voice-command grammar. Those are specified in `product-specification.md` and `build-prompts-customized.md` and are unchanged by this document.

### 0.2 Priority tags

| Tag | Meaning | Test |
|---|---|---|
| P0 | Cannot ship without it. Every P0 in section 11 carries a Given/When/Then acceptance block covering happy path, error case, and edge case. | If cut, the product either does not solve the core problem or exposes the founder to statutory liability. |
| P1 | Important; the core use case works without it. Fast follow within 90 days of first paying tenant. | If cut, a tenant is annoyed, not blocked, and no statute is violated. |
| P2 | Desirable. Will not delay delivery. | If cut, nobody notices for a quarter. |
| WONT | Explicitly out of scope with a stated reason. Documented so future design decisions do not silently re-open it. | |

### 0.3 How to read the citations

Every claim about a competitor, POS vendor, price, API behavior, statute, or regulation carries an inline link to the source page. Claims that could not be grounded in a fetched source are labeled `ASSUMPTION:` and are treated as design decisions of this document, not as facts about the world. Legal claims carry both the statute cite and a URL.

---

## 1. Problem statement

### 1.1 Who has the problem

Vietnamese-owned nail salons and Vietnamese-owned restaurants in the United States. Two verticals, one owner demographic, and one shared operational failure: the phone rings while every pair of hands in the building is already occupied.

The nail salon case is structurally worse than the restaurant case. A technician mid-fill cannot answer. The front desk, where one exists, is often the owner, who is also doing a pedicure. The call that goes unanswered is a $40 to $80 fill or a $60 gel set, and the caller — who is comparison-shopping three salons within two miles — dials the next one.

### 1.2 What the market sells them today

The competitive research says the market is loud and empty at the same time.

Loud: the price band is fully converged. Nail-vertical and horizontal SMB AI receptionists cluster at $49 to $149 per month — RingBooker at $79 and $149 per month with 100 and 200 captured calls ([RingBooker pricing](https://ringbooker.com/pricing)), Bukkii's AI Assistant at $89 per month ([bukkii.ai/vi](https://www.bukkii.ai/vi)), UpMySalon at $79 per month for call answering ([upmysalon.com](https://upmysalon.com/)), Goodcall at $79 / $129 / $249 per agent per month with $0.50 per unique customer over the allowance ([Goodcall pricing](https://www.goodcall.com/pricing)), Rosie at $49 / $149 / $299 ([Rosie pricing](https://heyrosie.com/pricing)), My AI Front Desk at $99 per month for 200 voice minutes with overage at 25 credits per minute where one credit is $0.01, i.e. $0.25 per minute ([My AI Front Desk pricing](https://www.myaifrontdesk.com/pricing)). Restaurants sit higher: Popmenu from $149 per month as an add-on on top of $179 to $499 platform tiers ([Popmenu pricing](https://get.popmenu.com/pricing)), Kea at a flat $450 per month ([kea.ai](https://kea.ai/)), Slang AI at $399 and $599 per location ([Slang AI pricing](https://www.slang.ai/pricing)).

Empty: nine specific cells in that matrix have nothing in them.

1. Mid-call automatic Vietnamese detection exists nowhere. Automatic mid-call language detection ships — Serviio does it "automatically detecting and switching languages" across seven languages ([serviio.ai](https://serviio.ai/)), Bite Buddy claims it across 70-plus ([bitebuddy.ai](https://bitebuddy.ai/)) — but Serviio's seven exclude Vietnamese and Bite Buddy never names it. Every vendor that does claim Vietnamese frames it as a configured choice: RingBooker's bilingual flows are gated to Professional and above and must be configured ([RingBooker pricing](https://ringbooker.com/pricing)); Bukkii, SICUS, NailMaxx, Vinail and Tilavon all state Vietnamese support with no detection claim ([bukkii.ai](https://www.bukkii.ai/ai-receptionist), [SICUS AI Receptionist](https://sicusmedia.com/products/ai-receptionist.html), [NailMaxx MAXX AI](https://nailmaxx.com/pages/maxx-ai), [Vinail](https://vinail.net/en/nail-salon-software-for-vietnamese), [Tilavon features](https://tilavon.com/features)).

2. Vietnamese is a long-tail fallback even at the enterprise platform layer. PolyAI markets 75-plus languages and lists Vietnamese ([poly.ai/languages](https://poly.ai/languages)), but its own documentation says 73 response languages are accepted including `vi-VN` while the recommended conversation-tuned Raven 3.5 model covers only 24 languages and Vietnamese is not among them ([PolyAI language coverage](https://docs.poly.ai/agent-settings/language-coverage)). A Vietnamese PolyAI deployment falls back to a third-party LLM with provider-dependent ASR and TTS. That is the technical reason to discount every "70-plus languages" claim in the category.

3. Fair-turn rotation has never been wired to a phone agent by anyone. Rotation exists in the salon-software layer — SenSalon's skill-based even rotation ([sensalon.ai](https://sensalon.ai/)), Vinail's invoice-derived turn points weighted by customer and service type ([vinail.net](https://vinail.net/)), Tilavon's walk-in turn management with live service timers ([Tilavon features](https://tilavon.com/features)) — but no vendor publishes an AI phone agent that respects turn order when assigning an inbound caller. Bukkii routes to a tech by skill ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)), which is a skills match, not a fairness match.

4. The deepest nail-specific operational logic sits entirely in the no-API tier. Zota advertises "8 types of turn queue management", "Reward and subtract turn, lock or flexible turn jump", "Special Tech setup with different turn type", and "FIFO, Clock-in-time, or Turn credit" ([Zota salon POS](https://zotaservices.com/salon-pos/), [Zota POS](https://zota.us/pos/)). Vinail specifies "Fair turn rotation", "Factor 0.25 / 0.5 / 1 by customer and service type" and "Point carry-over (optional)" ([vinail.net](https://vinail.net/)). Neither publishes a developer API. Meanwhile the platforms with the best APIs — Square, Zenoti, Mindbody, Boulevard, Clover — document essentially none of that logic. The structural consequence: integrate technically with Square, Zenoti and Mindbody, but own turn-queue and tip/commission semantics yourself, because no integrable platform exposes them.

5. Walk-in wait-time quoting over the phone is essentially unbuilt for salons. Bukkii is the only nail vendor claiming realistic wait-time estimates, and even there the estimate surfaces on a front-desk tablet ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)). On the restaurant side Loman quotes wait times ([loman.ai](https://www.loman.ai/)) and Serviio sends pickup estimates ([serviio.ai](https://serviio.ai/)), proving the mechanic is technically ordinary.

6. True per-technician booking into a third-party salon calendar is claimed by almost nobody. My AI Front Desk is the single vendor claiming it books "the right stylist for the right service" into Vagaro, Mindbody, Booker and Square Appointments ([My AI Front Desk Mindbody page](https://www.myaifrontdesk.com/answering-service-for-salons-and-spas/mindbody)) — and it never names Vietnamese. Bukkii and SenSalon book a named tech but into their own systems ([stork.ai review of Bukkii AIVA](https://www.stork.ai/en/bukkii-ai-aiva)). RingBooker carries only "preferred stylist context" ([RingBooker pricing](https://ringbooker.com/pricing)). Smith.ai collects preferred technician as intake data ([Smith.ai nail salon page](https://smith.ai/industries/nail-salons-answering-service)). Goodcall has no technician model at all ([Goodcall pricing](https://www.goodcall.com/pricing)).

7. No competitor spans both verticals. Not one vendor in the 25-vendor teardown serves both Vietnamese nail salons and Vietnamese restaurants. The nail vendors do no food ordering; the restaurant vendors — Kea, Serviio, Maple, Bite Buddy, Loman — publish no Vietnamese and no salon capability.

8. No Vietnamese entrant publishes credible scale. Bukkii's "1,000+ salons" ([bukkii.ai](https://www.bukkii.ai/)) is the only meaningful number on the Vietnamese-niche side. Tilavon is capped at its first 50 beta salons ([Tilavon pricing](https://tilavon.com/pricing)). Heymai is still free-in-pilot ([heymai.ai](https://heymai.ai/en/)). The niche has no scaled winner.

9. No competitor publishes any legal document in a non-English language. Only PolyAI publishes a DPA at all ([poly.ai/dpa](https://poly.ai/dpa)); Slang, Smith.ai and Goodcall publish none; My AI Front Desk offers one "Available on request" ([My AI Front Desk security overview](https://www.myaifrontdesk.com/trust-center/security-overview)). A Vietnamese-reading salon owner cannot today read any competitor's DPA.

### 1.3 What it costs them

Cost of an unanswered salon call, per the market's own pricing of the fix: RingBooker sells "missed booking protection" as the whole product ([RingBooker missed booking protection](https://ringbooker.com/missed-booking-protection)); UpMySalon anchors Vietnamese owners at $79 per month for call answering ([upmysalon.com](https://upmysalon.com/)). Spam is a measurable second tax: Bukkii publishes "37K+ Spam calls filtered" ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)) and Smith.ai publishes "Over 20 million known robocalls and solicitors automatically blocked" ([Smith.ai AI receptionist](https://smith.ai/ai-receptionist)) — but neither ties the number to salon-specific nuisance patterns or to dollars saved.

ASSUMPTION: Linh's own baseline for missed-call rate, recovered-booking value and spam volume per salon will be measured on the first three design-partner tenants during Phase 1 (section 15) and is not asserted here. The landing-page claim of "40% of calls go missed" in `build-prompts-customized.md` is marketing copy, not an instrumented baseline, and must not be used as a success-metric baseline.

### 1.4 The compliance problem nobody in the category has solved

The five benchmark vendors — Slang AI, PolyAI, Smith.ai, Goodcall, My AI Front Desk — collectively leave four holes that are simultaneously legal exposure and product wedge.

- Not one of the five publishes an inbound script in which the agent identifies itself as artificial. PolyAI ships a default-on guardrail that runs the other way: "AI Identity and Confidentiality — Prevents the agent from disclosing which LLM, provider, or platform powers it" ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)).
- Non-English callers get recorded without a disclosure they can understand. Slang's bilingual template plays the disclosure in English and reduces Spanish to a nudge: "Just so you know, you're speaking on a recorded line. How can I help? También puede hablarme en español." ([Slang bilingual support KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support)).
- Non-disableable disclosure is not the same as state-aware disclosure. Slang's disclaimer is fixed nationwide ([Slang branded greeting KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)); Goodcall's whisper is mandatory but its text is never published and does not vary by state ([Goodcall recording notification KB](https://help.goodcall.com/en/articles/8007564-goodcall-s-call-recording-notification)). Only My AI Front Desk offers a two-party explicit-consent gating mode, and even it makes the operator pick the jurisdiction manually ([My AI Front Desk call recording consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent)).
- Retention is unbounded almost everywhere. Slang: "as long as necessary to provide you with our Services" ([Slang privacy policy](https://www.slang.ai/privacy-policy)). Goodcall reserves the right to set "the maximum period of time that data or other content will be retained" and never states one ([Goodcall ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service)). Smith.ai states no period ([Smith.ai privacy](https://smith.ai/privacy)). Only My AI Front Desk publishes numbers ([My AI Front Desk retention](https://www.myaifrontdesk.com/trust-center/retention-deletion)).

Maryland is an all-party consent state and the founder's home state, with a felony penalty of up to five years and $10,000 plus a mandatory civil fine of not less than $500 ([Md. Cts. & Jud. Proc. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/)). California adds statutory damages of the greater of $5,000 per violation or three times actual damages with no actual damages required ([Cal. Penal Code § 637.2](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2)). A Vietnamese-monolingual caller who hears an English-only disclosure in Maryland has not given informed consent. That single sentence is both the largest liability in this product and its sharpest differentiator.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Baseline | Target | Measurement | Evaluate by |
|---|---|---|---|---|---|
| G1 | Book a named technician into a real salon calendar, in a call that started in English, with fair-turn rotation respected when no technician is named. | Zero vendors do rotation-aware phone booking ([Bukkii](https://www.bukkii.ai/industries/nail-salon), [SenSalon](https://sensalon.ai/), [Tilavon](https://tilavon.com/features)) | 85% of booking-intent calls end in a confirmed `bookings` row with a non-null `technician_id` and no human touch | `calls.outcome = 'booked'` divided by `calls.intent = 'appointment'`, per tenant per week | End of Phase 2 |
| G2 | Take a Vietnamese-language phone order and land it in the restaurant's POS as an unpaid pay-at-pickup ticket. | No POS in the matrix documents a Vietnamese UI; MenuSifu lists English/Chinese/Spanish/French ([MenuSifu](https://www.menusifu.com/restaurants/full-service-restaurant-pos-system)), Chowbus lists English/Chinese/Japanese/Korean/Spanish ([Chowbus](https://www.chowbus.com/blog/the-best-chinese-restaurant-pos-system-in-2026)) | 90% of completed orders reach `pos_sync_log.status = 'injected'` within 20 seconds of call end, or fall back to a printed/SMS ticket with an owner acknowledgement | `pos_sync_log` outcomes joined to `orders` | End of Phase 3 |
| G3 | 100% of recorded calls carry a complete, replayable consent artifact in the caller's own language. | No competitor logs `disclosure_language`; My AI Front Desk logs `disclosure_played`, `consent_response`, `disclosure_version` but publishes no non-English disclosure ([My AI Front Desk consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent)) | 100.0%, monitored as a hard alert, not a dashboard metric | `consent_events` rows with all five fields non-null divided by `calls` where `recording_url IS NOT NULL` | Continuous from day 1 |
| G4 | Keep per-minute conversation cost under $0.12 so the free test period is affordable to run and a price point remains open later. | Retell published rates: voice engine $0.055/min, LLM from $0.040/min, telephony $0.015/min ([Retell pricing](https://www.retellai.com/pricing)) | Blended cost per answered minute at or below $0.12; a $5,000 monthly ceiling therefore buys roughly 45,000 conversation minutes, which is the hard limit on how many free-test tenants can run concurrently | Monthly vendor invoices divided by `SUM(calls.duration_seconds)/60` | Monthly |
| G5 | Serve both verticals from one codebase, one database, one voice pipeline. | No competitor in the 25-vendor teardown spans both verticals | A single `business_type = 'both'` tenant runs salon booking and restaurant ordering on the same phone number with the correct tool set in each mode | Integration test suite plus one live `both` tenant | End of Phase 3 |
| G6 | Reach a measured stability bar before anything is priced, promised, or put on a clock. | Unknown. No production reliability data exists for Linh; the 45,000-minute budget headroom in G4 is modeled, not observed | Four consecutive weeks across all live tenants at: answered-call success at or above 98%, unhandled-error rate at or below 0.5% of calls, P95 first-response latency at or below 1.5s, zero P0 compliance misses, zero double-books attributable to Linh | Weekly rollup over `calls`, `pos_sync_log`, `consent_events` and the incident log | Reassessed weekly; no target date |

### 2.2 Non-goals

| # | Non-goal | Rationale, with evidence |
|---|---|---|
| NG1 | Building our own salon or restaurant POS. | Zota ("5000+ Salons", [Zota Check-in](https://zotaservices.com/zota-check-in/)), Tilavon ([tilavon.com](https://tilavon.com/)), SICUS ("Trusted by 2,500+ Vietnamese salon owners across America", [sicusmedia.com](https://sicusmedia.com/)) and Vinail ([vinail.net](https://vinail.net/)) already own that surface inside the Vietnamese community. Competing on POS means competing on hardware, payments and 24/7 Vietnamese support desks. Linh sits beside the POS, not underneath it. |
| NG2 | Taking card numbers by voice, ever. | The PCI SSC states that "Accepting spoken account data over the telephone puts personnel, the technology used, and the infrastructure to which that technology is connected into scope of PCI DSS" and that it is "prohibited to use any form of digital audio recording" for card validation codes ([PCI SSC, Protecting Telephone-Based Payment Card Data v3.0](https://www.pcisecuritystandards.org/documents/Protecting_Telephone_Based_Payment_Card_Data_v3-0_nov_2018.pdf), [PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf)). Deposits go out as a Stripe Payment Link over SMS, keeping us in SAQ A ([Stripe PCI compliance guide](https://stripe.com/guides/pci-compliance)). |
| NG3 | Speaker recognition, voice enrollment, or any voiceprint. | Illinois BIPA expressly covers voiceprints with statutory damages up to $1,000 negligent and $5,000 reckless or intentional per violation ([Sidley on BIPA](https://datamatters.sidley.com/2026/04/08/seventh-circuit-limits-potential-damages-under-bipa-holds-2024-amendment-applies-retroactively/)); Texas CUBI covers voiceprints at up to $25,000 per violation ([Tex. Bus. & Com. Code § 503.001](https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001)). This is a hard architectural prohibition, not a roadmap item. |
| NG4 | Outbound AI voice marketing campaigns at launch. | FCC Declaratory Ruling FCC 24-17, released 8 February 2024, makes AI-generated voice "artificial" under the TCPA, requiring prior express consent ([FCC-24-17A1](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf)). Statutory damages are $500 per violation, trebled to $1,500 for willful violations ([47 U.S.C. § 227](https://www.law.cornell.edu/uscode/text/47/227)). The inbound product is exempt from the FCC's proposed AI-call definition, which "expressly exempts technologies used to answer inbound calls, such as virtual customer service agents" ([FCC-24-84A1](https://docs.fcc.gov/public/attachments/FCC-24-84A1.pdf)). We stay on the safe side of that line at launch. |
| NG5 | Native integration with Fresha, Booksy write paths, GlossGenius, Vagaro appointment writes, or any Tier C vendor's calendar. | Fresha publishes only a Snowflake read replica at "$295 per location, monthly" with no write path ([Fresha Data Connector KB](https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools)). Vagaro support states outright "currently, we do not have any API's for creating and/or updating appointment classes in Vagaro" ([Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro)). GlossGenius has no API and ships its own competing receptionist ([GlossGenius Reception](https://glossgenius.com/reception)). Booksy's public API is on an `alpha.` subdomain, is partner-keyed, and shows no appointment write endpoint ([Booksy Public API](https://alpha.docs.booksy.net/v02.html)). |
| NG6 | Boulevard, Olo Rails, Aloha/NCR and TouchBistro in v1. | Boulevard API access is "Available for Enterprise tier only" ([Boulevard API feature page](https://www.joinblvd.com/features/api)) on top of $140 to $328 per month per location ([Boulevard pricing](https://www.joinblvd.com/pricing)). Olo Rails is structurally prepaid-only ([Olo Rails FAQ](https://olosupport.zendesk.com/hc/en-us/articles/115005665043-Rails-FAQ)). TouchBistro evaluates API requests closely, requires commercial terms, and keys are "intensely monitored" ([Reforming Retail](https://reformingretail.com/index.php/2019/01/23/why-do-some-cloud-pos-companies-still-lack-apis/)). |
| NG8 | Publishing a price, a rate card, a tier structure, or a trial end date during the free rollout. | Founder decision, 1 August 2026: Linh rolls out free and lets shops test it, with no fixed end. No pricing page, no quoted rate, no card on file, no countdown shown to the owner, and no `free_test_ends_at` field in the schema — because a stored end date is a promise the product cannot yet keep. Stability is unknown (G6): there is no production reliability data for this system, so the free period ends when the stability bar in G6 is met and holds, not when a calendar says so. Two to four weeks per shop is the working estimate for how long a design partner needs to form an opinion, and it is an estimate only — it is not committed to the owner, not enforced in code, and not an exit criterion for any phase. The billing and subscription system stays out of scope for this document. |
| NG7 | Deepgram `multi` mode, ElevenLabs `eleven_multilingual_v2`, Cartesia Sonic-2, Deepgram Flux, Rime, PlayHT, or Google's `telephony` STT model for Vietnamese. | Every one of them excludes Vietnamese. Deepgram `multi` covers ten languages, none Vietnamese ([Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview)). `eleven_multilingual_v2` has no Vietnamese while Flash v2.5 does ([LiveKit TTS catalog](https://docs.livekit.io/agents/models/tts/), [Retell language support](https://docs.retellai.com/build/language-support)). Cartesia Sonic-2 and Sonic Turbo exclude it ([Cartesia API changes](https://docs.cartesia.ai/build-with-cartesia/tts-models/api-changes)). Deepgram Flux has no Vietnamese at all ([Deepgram Flux multilingual](https://deepgram.com/learn/introducing-flux-multilingual)). PlayDialog and Rime have none ([PlayHT Dialog launch](https://play.ht/blog/introducing-dialog/), [Rime models](https://docs.rime.ai/api-reference/models)). Google's `telephony` and `telephony_short` models, the ones tuned for 8 kHz phone audio, are not offered for vi-VN ([Google STT v2 supported languages](https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages)). |

---

## 3. Product architecture: one product, two modes

### 3.1 The mode switch

`businesses.business_type` already exists in the canonical schema with the values `'nail_salon'`, `'restaurant'`, `'both'` and a default of `'restaurant'`. That column is the mode switch. It is not a cosmetic label; it selects the caller-facing language policy, the default module preset, the domain object set, and the adapter tier candidates.

### 3.2 What is shared and what diverges

| Layer | Shared across modes | Diverges by mode |
|---|---|---|
| Codebase | Next.js 14 app, Node voice gateway, one deployment | Route guards on `/dashboard/orders` when `business_type` excludes restaurant |
| Database | One Supabase project, one `businesses` table, one `calls` table, one `customers` table, one `messages` table | `bookings` carries salon fields plus restaurant reservation fields; `orders` is restaurant-only; `technicians` / `turn_queue` are salon-only; `menu_items` are restaurant-only |
| Voice pipeline | Same telephony, same ASR/TTS vendors, same consent front-door | Caller-facing language policy (section 5); assistant tool list (section 4) |
| Vietnamese language layer | Identical: same vi-VN ASR config, same keyterm list schema, same TTS voice pool, same diacritic handling | Keyterm content: technician names and service names for salons; dish names and modifiers for restaurants |
| Owner backend | One dashboard, one auth model, one per-user language preference | Nav items and widgets |
| Compliance front-door | Identical and non-bypassable in both modes | Nothing. Compliance does not diverge by vertical. |

### 3.3 Architecture diagram

```
                          PSTN inbound
                               |
                    +----------v-----------+
                    |  Twilio number       |   mu-law 8 kHz, mono
                    |  (tenant-owned or    |   audio/x-mulaw sampleRate 8000
                    |   Linh-provisioned)  |
                    +----------+-----------+
                               |
                    +----------v-----------------------------+
                    |  voice-gateway (Node, Render)           |
                    |  - ANI capture -> state inference       |
                    |  - START RECORDING (before disclosure)  |
                    |  - spam pre-screen                      |
                    +----------+------------------------------+
                               |
                    +----------v------------------------------+
                    |  CONSENT FRONT DOOR (non-bypassable)     |
                    |  1. detect caller language (1 utterance) |
                    |  2. play AI + recording disclosure in    |
                    |     THAT language                        |
                    |  3. capture consent_response             |
                    |  4. write consent_events row             |
                    +----------+-------------------------------+
                        no-record path |  consent path
                        (press 0)      |
                    +---------+        |
                    | voicemail|       |
                    | no audio |       |
                    +---------+        |
                                       |
                    +------------------v----------------------+
                    |  Retell assistant (per business)         |
                    |  ASR: Deepgram Nova-3 monolingual vi|en  |
                    |  TTS: ElevenLabs Flash v2.5 |            |
                    |       Cartesia Sonic-3 (8k mu-law)       |
                    |  Tool list = resolveTools(business)      |
                    +------------------+----------------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
+-------v--------+           +---------v---------+          +---------v---------+
| SALON TOOLS    |           | RESTAURANT TOOLS  |          | SHARED TOOLS      |
| check_avail    |           | get_menu          |          | get_business_info |
| book_appt      |           | place_order       |          | take_message      |
| modify_appt    |           | quote_pickup_time |          | transfer_human    |
| cancel_appt    |           | create_reservation|          | send_sms_link     |
| quote_walkin   |           | escalate_catering |          | flag_spam         |
| request_tech   |           |                   |          |                   |
| send_deposit   |           |                   |          |                   |
| join_waitlist  |           |                   |          |                   |
+-------+--------+           +---------+---------+          +---------+---------+
        |                              |                              |
        +------------------------------+------------------------------+
                                       |
                    +------------------v----------------------+
                    |  Linh core (Next.js API routes)          |
                    |  - turn-queue engine (owned by us)       |
                    |  - availability resolver                 |
                    |  - idempotency + reconciliation          |
                    |  - PAN/CVV redaction filter              |
                    +----+----------------+--------------------+
                         |                |
             +-----------v----+   +-------v-------------------+
             | Supabase        |   |  POSAdapter registry      |
             | (source of      |   |  capabilities descriptor  |
             |  truth for      |   +-------+-------------------+
             |  Linh bookings) |           |
             +-----------------+   +-------+--------+--------------+
                                   |       |        |              |
                              Tier A   Tier B   Tier C         Fallback
                              Square   Toast    parallel       print /
                              Zenoti   Otter    ledger         SMS ticket
                              Mindbody Checkmate (Zota,        / dashboard
                              (salon)  Deliverect Tilavon,
                              Square   Phorest   SICUS,
                              (rest.)  Meevo     Vinail,
                              Clover   Vagaro RO GlossGenius,
                              (pay only)         Fresha)
                                       |
                    +------------------v----------------------+
                    |  Twilio SMS (A2P 10DLC Standard brand)   |
                    |  confirmations, reminders, deposit links |
                    |  Stripe Payment Link (never spoken card) |
                    +------------------------------------------+

  OWNER BACKEND (per-user language, EN or VI):
    web dashboard  ->  Supabase RLS  ->  same tables
    morning brief / VIP alert / re-engagement  -> SMS + push
```

### 3.4 Source-of-truth rule

Linh's `bookings` and `orders` tables are the system of record for anything Linh created. The POS is a downstream projection, not an upstream authority, except where the adapter's `capabilities.availabilityIsAuthoritative` is true (Tier A). This inversion is what makes Tier C viable rather than a failure state, and it is what makes conflict reconciliation (section 8.7) a tractable problem rather than an unbounded one.

---

## 4. Module system (feature flags)

### 4.1 Why flags are capability boundaries, not preferences

A prompt instruction that says "do not take orders" is a suggestion to a language model. A missing tool definition is a capability that does not exist. Linh generates the Retell assistant's tool list from the enabled module set. If `ordering` is off, there is no `place_order` function in the assistant payload, so the model physically cannot place an order. This is the single most important architectural rule in the module system.

The same rule applies in reverse to compliance. `call_recording` cannot be disabled independently of the disclosure module, because the disclosure is the thing that makes the recording lawful in all-party states ([Md. Cts. & Jud. Proc. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/), [RCW 9.73.030](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030)).

### 4.2 The `modules` JSONB column — full schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://linh.ai/schemas/business-modules-v1.json",
  "title": "Linh business module configuration",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "booking", "walkin_queue", "deposits", "ordering",
               "reservations", "sms_reminders", "reengagement", "morning_brief",
               "vip_alerts", "spam_filter", "pos_sync", "call_recording",
               "waitlist", "loyalty"],
  "properties": {
    "schema_version": { "const": 1 },

    "booking": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "min_lead_minutes": { "type": "integer", "minimum": 0, "maximum": 10080, "default": 60 },
        "max_advance_days": { "type": "integer", "minimum": 1, "maximum": 365, "default": 60 },
        "allow_technician_request": { "type": "boolean", "default": true },
        "rotation_mode": { "enum": ["off", "fifo", "clock_in", "turn_credit", "weighted_points"], "default": "weighted_points" },
        "gap_fill_minutes": { "type": "integer", "minimum": 0, "maximum": 60, "default": 15 },
        "double_book_tolerance_minutes": { "type": "integer", "minimum": 0, "maximum": 15, "default": 0 },
        "default_service_duration_minutes": { "type": "integer", "minimum": 5, "maximum": 480, "default": 45 }
      }
    },

    "walkin_queue": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "quote_wait_by_phone": { "type": "boolean", "default": true },
        "quote_padding_minutes": { "type": "integer", "minimum": 0, "maximum": 30, "default": 5 },
        "max_quotable_wait_minutes": { "type": "integer", "minimum": 15, "maximum": 240, "default": 90 },
        "refuse_quote_above_max": { "type": "boolean", "default": true },
        "hold_minutes_after_quote": { "type": "integer", "minimum": 0, "maximum": 60, "default": 15 }
      }
    },

    "deposits": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "stripe_account_id": { "type": ["string", "null"], "pattern": "^acct_[A-Za-z0-9]+$", "default": null },
        "trigger": { "enum": ["always", "new_customer_only", "high_value_only", "prior_no_show_only"], "default": "prior_no_show_only" },
        "amount_cents": { "type": "integer", "minimum": 500, "maximum": 20000, "default": 2000 },
        "high_value_threshold_cents": { "type": "integer", "minimum": 0, "default": 8000 },
        "hold_minutes": { "type": "integer", "minimum": 10, "maximum": 1440, "default": 30 },
        "refund_policy_hours": { "type": "integer", "minimum": 0, "maximum": 168, "default": 24 },
        "spoken_card_capture": { "const": false }
      }
    },

    "ordering": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "fulfillment_types": { "type": "array", "items": { "enum": ["pickup", "delivery", "dine_in"] }, "default": ["pickup"] },
        "payment_posture": { "enum": ["pay_at_pickup", "prepaid_required", "prepaid_optional"], "default": "pay_at_pickup" },
        "max_items_per_order": { "type": "integer", "minimum": 1, "maximum": 60, "default": 25 },
        "max_order_total_cents": { "type": "integer", "minimum": 1000, "maximum": 200000, "default": 30000 },
        "large_party_escalation_threshold_cents": { "type": "integer", "minimum": 1000, "default": 15000 },
        "read_back_required": { "const": true },
        "fallback_channel": { "enum": ["none", "sms_ticket", "print_ticket", "dashboard_only"], "default": "sms_ticket" }
      }
    },

    "reservations": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "max_party_size_auto": { "type": "integer", "minimum": 1, "maximum": 30, "default": 8 },
        "escalate_above_max": { "type": "boolean", "default": true },
        "turn_time_minutes": { "type": "integer", "minimum": 30, "maximum": 240, "default": 90 },
        "seatings_per_slot": { "type": "integer", "minimum": 1, "default": 4 }
      }
    },

    "sms_reminders": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "a2p_campaign_id": { "type": ["string", "null"], "default": null },
        "confirmation": { "type": "boolean", "default": true },
        "reminder_hours_before": { "type": "array", "items": { "type": "integer", "minimum": 1, "maximum": 168 }, "default": [24] },
        "quiet_hours_start_local": { "const": "21:00" },
        "quiet_hours_end_local": { "const": "08:00" },
        "stop_keywords_enforced": { "const": true }
      }
    },

    "reengagement": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "inactive_weeks": { "type": "integer", "minimum": 2, "maximum": 52, "default": 6 },
        "max_per_customer_per_quarter": { "type": "integer", "minimum": 0, "maximum": 4, "default": 1 },
        "requires_marketing_consent": { "const": true }
      }
    },

    "morning_brief": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "send_at_local": { "type": "string", "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$", "default": "08:00" },
        "channel": { "enum": ["sms", "push", "both"], "default": "sms" },
        "language": { "enum": ["per_user", "en", "vi"], "default": "per_user" }
      }
    },

    "vip_alerts": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "min_visits": { "type": "integer", "minimum": 2, "maximum": 100, "default": 6 },
        "min_lifetime_cents": { "type": "integer", "minimum": 0, "default": 30000 },
        "alert_channel": { "enum": ["sms", "push", "both"], "default": "push" }
      }
    },

    "spam_filter": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "block_list": { "type": "array", "items": { "type": "string", "pattern": "^\\+1[0-9]{10}$" }, "default": [] },
        "silent_caller_seconds": { "type": "integer", "minimum": 3, "maximum": 30, "default": 8 },
        "vendor_pitch_classifier": { "type": "boolean", "default": true },
        "never_bill_flagged_minutes": { "type": "boolean", "default": true }
      }
    },

    "pos_sync": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "adapter_id": { "type": ["string", "null"], "default": null },
        "tier": { "enum": ["A", "B", "C", null], "default": null },
        "direction": { "enum": ["read_only", "write_only", "two_way"], "default": "two_way" },
        "poll_interval_seconds": { "type": "integer", "minimum": 30, "maximum": 3600, "default": 300 },
        "conflict_policy": { "enum": ["pos_wins", "linh_wins", "manual_review"], "default": "manual_review" }
      }
    },

    "call_recording": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "consent_mode": { "enum": ["all_party_gated", "announcement_only", "auto_by_state"], "default": "auto_by_state" },
        "audio_retention_days": { "type": "integer", "minimum": 0, "maximum": 365, "default": 30 },
        "transcript_retention_days": { "type": "integer", "minimum": 1, "maximum": 730, "default": 90 },
        "disclosure_module_enabled": { "const": true },
        "no_audio_mode": { "type": "boolean", "default": false }
      }
    },

    "waitlist": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "max_entries_per_day": { "type": "integer", "minimum": 1, "maximum": 200, "default": 40 },
        "offer_window_minutes": { "type": "integer", "minimum": 5, "maximum": 180, "default": 20 },
        "max_offers_per_slot": { "type": "integer", "minimum": 1, "maximum": 10, "default": 3 },
        "notify_channel": { "enum": ["sms", "call", "sms_then_call"], "default": "sms" }
      }
    },

    "loyalty": {
      "type": "object", "additionalProperties": false,
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "points_per_dollar": { "type": "number", "minimum": 0, "maximum": 10, "default": 1 },
        "redeem_threshold_points": { "type": "integer", "minimum": 10, "default": 200 },
        "announce_balance_on_call": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### 4.3 Default presets

Nail salon preset — literal JSON written on tenant creation when `business_type = 'nail_salon'`:

```json
{
  "schema_version": 1,
  "booking":        { "enabled": true,  "min_lead_minutes": 60, "max_advance_days": 60,
                      "allow_technician_request": true, "rotation_mode": "weighted_points",
                      "gap_fill_minutes": 15, "double_book_tolerance_minutes": 0,
                      "default_service_duration_minutes": 45 },
  "walkin_queue":   { "enabled": true,  "quote_wait_by_phone": true, "quote_padding_minutes": 5,
                      "max_quotable_wait_minutes": 90, "refuse_quote_above_max": true,
                      "hold_minutes_after_quote": 15 },
  "deposits":       { "enabled": false, "stripe_account_id": null, "trigger": "prior_no_show_only",
                      "amount_cents": 2000, "high_value_threshold_cents": 8000, "hold_minutes": 30,
                      "refund_policy_hours": 24, "spoken_card_capture": false },
  "ordering":       { "enabled": false, "fulfillment_types": ["pickup"], "payment_posture": "pay_at_pickup",
                      "max_items_per_order": 25, "max_order_total_cents": 30000,
                      "large_party_escalation_threshold_cents": 15000, "read_back_required": true,
                      "fallback_channel": "sms_ticket" },
  "reservations":   { "enabled": false, "max_party_size_auto": 8, "escalate_above_max": true,
                      "turn_time_minutes": 90, "seatings_per_slot": 4 },
  "sms_reminders":  { "enabled": true,  "a2p_campaign_id": null, "confirmation": true,
                      "reminder_hours_before": [24], "quiet_hours_start_local": "21:00",
                      "quiet_hours_end_local": "08:00", "stop_keywords_enforced": true },
  "reengagement":   { "enabled": false, "inactive_weeks": 6, "max_per_customer_per_quarter": 1,
                      "requires_marketing_consent": true },
  "morning_brief":  { "enabled": true,  "send_at_local": "08:00", "channel": "sms", "language": "per_user" },
  "vip_alerts":     { "enabled": true,  "min_visits": 6, "min_lifetime_cents": 30000, "alert_channel": "push" },
  "spam_filter":    { "enabled": true,  "block_list": [], "silent_caller_seconds": 8,
                      "vendor_pitch_classifier": true, "never_bill_flagged_minutes": true },
  "pos_sync":       { "enabled": false, "adapter_id": null, "tier": null, "direction": "two_way",
                      "poll_interval_seconds": 300, "conflict_policy": "manual_review" },
  "call_recording": { "enabled": true,  "consent_mode": "auto_by_state", "audio_retention_days": 30,
                      "transcript_retention_days": 90, "disclosure_module_enabled": true,
                      "no_audio_mode": false },
  "waitlist":       { "enabled": true,  "max_entries_per_day": 40, "offer_window_minutes": 20,
                      "max_offers_per_slot": 3, "notify_channel": "sms" },
  "loyalty":        { "enabled": false, "points_per_dollar": 1, "redeem_threshold_points": 200,
                      "announce_balance_on_call": false }
}
```

Restaurant preset — literal JSON written on tenant creation when `business_type = 'restaurant'`:

```json
{
  "schema_version": 1,
  "booking":        { "enabled": false, "min_lead_minutes": 60, "max_advance_days": 60,
                      "allow_technician_request": false, "rotation_mode": "off",
                      "gap_fill_minutes": 0, "double_book_tolerance_minutes": 0,
                      "default_service_duration_minutes": 45 },
  "walkin_queue":   { "enabled": false, "quote_wait_by_phone": false, "quote_padding_minutes": 5,
                      "max_quotable_wait_minutes": 90, "refuse_quote_above_max": true,
                      "hold_minutes_after_quote": 15 },
  "deposits":       { "enabled": false, "stripe_account_id": null, "trigger": "prior_no_show_only",
                      "amount_cents": 2000, "high_value_threshold_cents": 8000, "hold_minutes": 30,
                      "refund_policy_hours": 24, "spoken_card_capture": false },
  "ordering":       { "enabled": true,  "fulfillment_types": ["pickup"], "payment_posture": "pay_at_pickup",
                      "max_items_per_order": 25, "max_order_total_cents": 30000,
                      "large_party_escalation_threshold_cents": 15000, "read_back_required": true,
                      "fallback_channel": "sms_ticket" },
  "reservations":   { "enabled": true,  "max_party_size_auto": 8, "escalate_above_max": true,
                      "turn_time_minutes": 90, "seatings_per_slot": 4 },
  "sms_reminders":  { "enabled": true,  "a2p_campaign_id": null, "confirmation": true,
                      "reminder_hours_before": [3], "quiet_hours_start_local": "21:00",
                      "quiet_hours_end_local": "08:00", "stop_keywords_enforced": true },
  "reengagement":   { "enabled": false, "inactive_weeks": 8, "max_per_customer_per_quarter": 1,
                      "requires_marketing_consent": true },
  "morning_brief":  { "enabled": true,  "send_at_local": "10:00", "channel": "sms", "language": "per_user" },
  "vip_alerts":     { "enabled": true,  "min_visits": 8, "min_lifetime_cents": 40000, "alert_channel": "push" },
  "spam_filter":    { "enabled": true,  "block_list": [], "silent_caller_seconds": 8,
                      "vendor_pitch_classifier": true, "never_bill_flagged_minutes": true },
  "pos_sync":       { "enabled": false, "adapter_id": null, "tier": null, "direction": "write_only",
                      "poll_interval_seconds": 300, "conflict_policy": "manual_review" },
  "call_recording": { "enabled": true,  "consent_mode": "auto_by_state", "audio_retention_days": 30,
                      "transcript_retention_days": 90, "disclosure_module_enabled": true,
                      "no_audio_mode": false },
  "waitlist":       { "enabled": true,  "max_entries_per_day": 60, "offer_window_minutes": 20,
                      "max_offers_per_slot": 3, "notify_channel": "sms" },
  "loyalty":        { "enabled": false, "points_per_dollar": 1, "redeem_threshold_points": 200,
                      "announce_balance_on_call": false }
}
```

A `business_type = 'both'` tenant receives the union: the nail salon preset with `ordering.enabled` and `reservations.enabled` set to true.

### 4.4 Validation matrix

Toggles are validated at save time and rejected with a bilingual message. A stored-but-invalid flag is a bug, not a state.

| Flag turning ON | Preconditions, all must hold | English error when precondition fails | Vietnamese error when precondition fails |
|---|---|---|---|
| `booking` | At least one row in `services` for this business; at least one active row in `technicians`; `business_hours` non-empty | "Turn on booking after you add at least one service and one technician, and set your business hours." | "Hãy thêm ít nhất một dịch vụ và một thợ, và cài đặt giờ làm việc trước khi bật đặt lịch." |
| `walkin_queue` | `booking.enabled` is true; at least two active technicians | "Walk-in queue needs booking turned on and at least two technicians." | "Hàng chờ khách vãng lai cần bật đặt lịch và có ít nhất hai thợ." |
| `deposits` | A connected Stripe account: `deposits.stripe_account_id` matches `^acct_` and `stripe.accounts.retrieve` returns `charges_enabled = true`; `sms_reminders.enabled` is true because the link is delivered by SMS | "Connect a Stripe account and turn on SMS before enabling deposits. Linh never takes card numbers by phone." | "Hãy kết nối tài khoản Stripe và bật tin nhắn SMS trước khi bật tiền cọc. Linh không bao giờ nhận số thẻ qua điện thoại." |
| `ordering` | `business_type` includes restaurant; at least one row in `menu_items`; AND either a `pos_adapters` row in tier A or B with `capabilities.canCommitOrder = true`, OR `ordering.fallback_channel != 'none'` | "Ordering needs a menu and either a connected POS or a fallback ticket channel (SMS or printer)." | "Nhận đơn hàng cần có thực đơn và hoặc là kết nối POS, hoặc là kênh dự phòng (tin nhắn hoặc máy in phiếu)." |
| `reservations` | `business_type` includes restaurant; `reservations.turn_time_minutes` set; `business_hours` non-empty | "Reservations need your business hours and an average table turn time." | "Đặt bàn cần giờ làm việc và thời gian trung bình mỗi lượt bàn." |
| `sms_reminders` | An A2P 10DLC campaign in `approved` state; `modules.sms_reminders.a2p_campaign_id` non-null; the sending number is in the Messaging Service sender pool | "Your SMS registration is not approved yet. Messages from an unregistered number are blocked by the carriers (Twilio error 30034)." | "Đăng ký tin nhắn của quý vị chưa được duyệt. Nhà mạng sẽ chặn tin nhắn từ số chưa đăng ký (lỗi Twilio 30034)." |
| `reengagement` | `sms_reminders.enabled` is true; tenant has accepted the marketing-consent addendum; per-contact `marketing_consent = true` is enforced at send time | "Re-engagement messages are marketing. Turn on SMS first and accept the marketing terms." | "Tin nhắn mời khách quay lại là tin quảng cáo. Hãy bật SMS trước và đồng ý điều khoản quảng cáo." |
| `morning_brief` | At least one `user_preferences` row with a delivery channel | "Add at least one person to receive the morning brief." | "Hãy thêm ít nhất một người nhận bản tin buổi sáng." |
| `vip_alerts` | `customers` table has at least one row; push or SMS channel configured | "VIP alerts need at least one saved customer and a delivery channel." | "Cảnh báo khách quen cần ít nhất một khách đã lưu và một kênh nhận thông báo." |
| `spam_filter` | None. Always available; cannot be disabled while `never_bill_flagged_minutes` is true | "Spam filtering cannot be turned off while unbilled spam minutes are enabled." | "Không thể tắt lọc cuộc gọi rác khi đang bật chế độ không tính phút gọi rác." |
| `pos_sync` | A `pos_adapters` row with `status = 'connected'` and a successful `healthCheck()` within the last 15 minutes | "Connect and test your POS before turning on sync." | "Hãy kết nối và kiểm tra POS trước khi bật đồng bộ." |
| `call_recording` | `disclosure_module_enabled` is `true` (constant, cannot be false); if resolved consent posture is all-party, `consent_mode` must be `all_party_gated` or `auto_by_state` | "In an all-party consent state we must ask the caller and get a yes. Announcement-only is not allowed here." | "Ở tiểu bang yêu cầu tất cả các bên đồng ý, chúng ta phải hỏi và được khách đồng ý. Chỉ thông báo là không đủ." |
| `waitlist` | `booking.enabled` is true | "Waitlist needs booking turned on." | "Danh sách chờ cần bật đặt lịch." |
| `loyalty` | `customers` table exists; `loyalty.points_per_dollar > 0` | "Set how many points a dollar earns before turning on loyalty." | "Hãy đặt số điểm cho mỗi đô la trước khi bật chương trình tích điểm." |

### 4.5 Runtime resolution order

1. Load `businesses.modules` (JSONB). If `schema_version` is absent, run the migration that stamps the type-appropriate preset.
2. Overlay hard compliance constraints. These win over tenant config unconditionally: `deposits.spoken_card_capture = false`, `ordering.read_back_required = true`, `call_recording.disclosure_module_enabled = true`, `sms_reminders.stop_keywords_enforced = true`, `reengagement.requires_marketing_consent = true`.
3. Intersect with adapter capabilities. If `pos_sync.enabled` and the adapter reports `canCommitOrder = false`, then `ordering` is downgraded to `fallback_channel` mode and the `place_order` tool is emitted with `commit_mode: "fallback"`.
4. Intersect with the caller's resolved jurisdiction (section 9.1). All-party resolution forces `consent_mode = 'all_party_gated'` for that call regardless of tenant setting.
5. Emit the tool list. Cache keyed on `(business_id, modules_hash, adapter_capabilities_hash)`; invalidate on any write to `businesses.modules` or `pos_adapters`.

### 4.6 `resolveTools(business)` pseudocode

```typescript
type ToolName =
  | 'get_business_info' | 'take_message' | 'transfer_to_human' | 'send_sms_link' | 'flag_spam'
  | 'check_availability' | 'book_appointment' | 'modify_appointment' | 'cancel_appointment'
  | 'request_technician' | 'quote_walkin_wait' | 'send_deposit_link' | 'join_waitlist'
  | 'get_menu' | 'place_order' | 'quote_pickup_time' | 'create_reservation' | 'escalate_large_party';

interface ResolvedAssistant {
  tools: ToolName[];
  toolConfig: Record<string, unknown>;
  systemPromptFragments: string[];
  consentMode: 'all_party_gated' | 'announcement_only';
  disclosureLanguagePolicy: 'caller_detected';
}

function resolveTools(
  business: Business,
  adapter: POSAdapterCapabilities | null,
  jurisdiction: ConsentPosture
): ResolvedAssistant {
  const m = applyHardConstraints(business.modules);          // step 2, non-negotiable
  const tools: ToolName[] = [
    'get_business_info', 'take_message', 'transfer_to_human', 'send_sms_link'
  ];

  if (m.spam_filter.enabled) tools.push('flag_spam');

  // ---- salon surface -------------------------------------------------
  if (m.booking.enabled && businessIsSalon(business)) {
    tools.push('check_availability', 'book_appointment', 'modify_appointment', 'cancel_appointment');
    if (m.booking.allow_technician_request) tools.push('request_technician');
    if (m.waitlist.enabled) tools.push('join_waitlist');
  }
  if (m.walkin_queue.enabled && m.walkin_queue.quote_wait_by_phone) {
    tools.push('quote_walkin_wait');
  }
  if (m.deposits.enabled && stripeReady(m.deposits.stripe_account_id) && m.sms_reminders.enabled) {
    tools.push('send_deposit_link');                          // link only. never a card field.
  }

  // ---- restaurant surface --------------------------------------------
  if (m.ordering.enabled && businessIsRestaurant(business)) {
    const canCommit = adapter?.canCommitOrder === true;
    const hasFallback = m.ordering.fallback_channel !== 'none';
    if (canCommit || hasFallback) {
      tools.push('get_menu', 'place_order', 'quote_pickup_time');
    }
    // capability narrowing: an adapter that requires prepayment cannot serve
    // a pay_at_pickup tenant, so the tool is emitted in fallback mode only.
    if (adapter?.requiresPrepaidOrder === true && m.ordering.payment_posture === 'pay_at_pickup') {
      setToolMode(tools, 'place_order', 'fallback');
    }
  }
  if (m.reservations.enabled && businessIsRestaurant(business)) {
    tools.push('create_reservation');
    if (m.reservations.escalate_above_max) tools.push('escalate_large_party');
  }

  // ---- compliance overlay (step 4) ------------------------------------
  const consentMode =
    jurisdiction.allParty ? 'all_party_gated'
    : (m.call_recording.consent_mode === 'announcement_only' ? 'announcement_only' : 'all_party_gated');

  return {
    tools: dedupe(tools),
    toolConfig: buildToolSchemas(tools, business, adapter),
    systemPromptFragments: buildPromptFragments(business, m, adapter),
    consentMode,
    disclosureLanguagePolicy: 'caller_detected'   // never tenant-overridable
  };
}
```

The Retell assistant is re-created or patched whenever `resolveTools` produces a different `tools` array hash. `businesses.vapi_assistant_id` in the canonical schema is reused as the assistant identifier column and is renamed by migration to `assistant_id` with `assistant_provider` alongside it (section 13).

---

## 5. Language model

### 5.1 The policy

| Surface | Language | Rule |
|---|---|---|
| Nail salon, caller-facing | English only | The agent greets, converses, confirms and closes in English. It does not offer Vietnamese. |
| Nail salon, recording and AI disclosure | Caller's detected language | The one exception. See 5.3. |
| Restaurant, caller-facing | EN/VI with auto-detection | Detect from the first caller utterance, then pin for the call, with an explicit switch path on request. |
| Owner and manager backend, both modes | EN or VI, per user | `user_preferences.language`, not `businesses.language_default`. A Vietnamese owner and an English-speaking manager use the same tenant with different UI languages. |
| SMS to callers | Caller's `customers.preferred_language`, defaulting to the language of the call that created the record | |
| SMS and push to owners and staff | The recipient's `user_preferences.language` | |

### 5.2 Why the salon is English-only, honestly

The founder's stated observation is that 90%-plus of nail salon callers speak English; `product-specification.md` records it as the design premise. The competitive evidence supports the decision from a different angle: the Vietnamese-language nail competitors that do offer Vietnamese to callers are doing it as a configured, non-detected option — RingBooker's bilingual flows are gated to Professional and must be configured ([RingBooker pricing](https://ringbooker.com/pricing)) — which means they are effectively picking a language per tenant, not per caller. Doing that badly is worse than not doing it. A Vietnamese agent that misfires on an English caller's technician name is a lost booking.

There is also a cost and quality argument. Vietnamese runs on the previous-generation tier of every vendor (section 5.4). Keeping the salon's high-volume caller path monolingual English keeps that path on the fast, well-supported model, which is where the 45,000-minute budget headroom comes from.

This is a decision, not a hedge. It is revisited only if a design-partner salon measures more than 15% Vietnamese-preferring inbound callers over a four-week window, which is logged as open question OQ-4 in section 16.

### 5.3 Where the English-only rule bends, and why it must

The recording and AI-identity disclosure is delivered in the caller's detected language even in salon mode.

An all-party consent statute requires prior consent to the interception. Maryland's § 10-402(c)(3) permits interception only where "all of the parties to the communication have given prior consent to the interception" ([Md. Cts. & Jud. Proc. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/)). California's § 632 does the same for confidential communications ([Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632)). Consent that the consenting party cannot understand is not consent.

The benchmark confirms this is an unoccupied position. Slang AI's bilingual mode keeps the disclosure in English and reduces Spanish to a language nudge: "Hi, thanks for calling Slang Cafe! Just so you know, you're speaking on a recorded line. How can I help? También puede hablarme en español." ([Slang bilingual support KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support)). The Spanish sentence is an invitation to switch, not a translated consent disclosure. A Spanish-only caller is recorded without ever hearing a disclosure they can understand. None of the other four benchmark vendors publishes any non-English consent language at all.

Mechanically: the gateway captures a first utterance of up to 2.5 seconds, runs a language classification pass, plays the disclosure in the winning language, records `consent_events.disclosure_language`, and then — in salon mode — continues the conversation in English with one sentence acknowledging the switch. In restaurant mode it simply continues in the detected language.

### 5.4 The vi-VN stack

Hard constraint first: Twilio Media Streams deliver call audio as `audio/x-mulaw`, `sampleRate: 8000`, `channels: 1` ([Twilio Media Streams WebSocket messages](https://www.twilio.com/docs/voice/media-streams/websocket-messages)). Vietnamese is tonal and part of its tone contour lives in the band narrowband telephony truncates. Every ASR and TTS choice has to survive that codec.

The meta-pattern from the stack research: vendors ship Vietnamese on the previous-generation or fast-tier model and reserve the newest, lowest-latency, best-sounding model for English and the major European languages. Concretely:

- Deepgram Flux, the model built specifically for voice-agent turn-taking, has no Vietnamese at all; `flux-general-multi` covers the same ten non-Vietnamese languages as `multi` ([Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview), [Deepgram Flux multilingual](https://deepgram.com/learn/introducing-flux-multilingual)).
- ElevenLabs `eleven_multilingual_v2`, its most lifelike model, does not support Vietnamese, while `eleven_flash_v2_5` and `eleven_v3` do ([LiveKit TTS catalog](https://docs.livekit.io/agents/models/tts/), [Retell language support](https://docs.retellai.com/build/language-support)).
- Cartesia Sonic-2 and Sonic Turbo have no Vietnamese; only Sonic-3 and later do ([Cartesia API changes](https://docs.cartesia.ai/build-with-cartesia/tts-models/api-changes), [Cartesia TTS models](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest)).
- AssemblyAI locks Vietnamese out of the cheap streaming tiers; Universal-Streaming is English-only and its multilingual sibling covers six European languages, forcing Vietnamese onto Universal-3.5 Pro at $0.45 per hour versus $0.15 ([AssemblyAI streaming](https://www.assemblyai.com/products/streaming-speech-to-text)).
- Google Cloud STT v2 does not offer the `telephony` or `telephony_short` models — the ones tuned for 8 kHz phone audio — for vi-VN ([Google STT v2 supported languages](https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages)). For a phone-first product that is disqualifying.
- OpenAI's TTS documentation states "Voices are currently optimized for English" and ships zero Vietnamese voices ([OpenAI TTS guide](https://platform.openai.com/docs/guides/text-to-speech)).

Retell is the only managed platform in the benchmark that names `vi-VN` as a first-class supported language with a published per-vendor compatibility matrix, and its own docs surface the vendor-level exclusions ([Retell language support](https://docs.retellai.com/build/language-support)). It has supported Vietnamese since September 2024 ([Retell changelog](https://www.retellai.com/changelog/more-languages-max-call-duration-and-more)) and maintains a Vietnamese landing page ([Retell Vietnamese](https://www.retellai.com/languages-ai/vietnamese-ai)). By contrast, every auto-detect path Vapi documents excludes Vietnamese ([Vapi multilingual](https://docs.vapi.ai/customization/multilingual)).

#### Option A — launch stack (chosen)

Retell orchestration, Deepgram Nova-3 monolingual `vi` and `en` for ASR, ElevenLabs Flash v2.5 or Cartesia Sonic-3 for TTS, telephony via Retell.

| Component | Rate | Source |
|---|---|---|
| Retell voice engine (STT plus TTS bundled) | $0.055 per minute | [Retell pricing](https://www.retellai.com/pricing) |
| LLM, low-cost tier | $0.040 per minute | [Retell pricing](https://www.retellai.com/pricing) |
| Telephony | $0.015 per minute | [Retell pricing](https://www.retellai.com/pricing) |
| Total | approximately $0.11 per minute | |

At $0.11 per minute, the $5,000 monthly ceiling buys roughly 45,000 conversation minutes. Even on Retell's premium LLM tier at $0.345 per minute the blended figure is about $0.42 per minute and roughly 11,900 minutes, which still exceeds Phase 1 and Phase 2 volume.

Mandatory configuration:

- Pin the transcriber to Deepgram Nova-3 monolingual `vi` and `en` as two selectable languages. Never `multi` — `multi` excludes Vietnamese ([Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview)).
- Load the tenant's technician names, service names and dish names into Deepgram Keyterm Prompting, which is available on Nova-3 ([Deepgram keyterm prompting](https://developers.deepgram.com/docs/keyterm)) and is marketed for Vietnamese specifically ([Deepgram Vietnamese](https://deepgram.com/product/speech-to-text/vietnamese)).
- Select `eleven_flash_v2_5` at approximately 75 ms and $0.05 per 1,000 characters, or `eleven_v3`. Never `eleven_multilingual_v2` ([ElevenLabs models](https://elevenlabs.io/docs/models), [ElevenLabs API pricing](https://elevenlabs.io/pricing/api)).
- Cartesia Sonic-3 is the alternative TTS when you want native 8 kHz μ-law output with no resampling: `pcm_mulaw` and `pcm_alaw` at 8000 Hz are first-class output formats ([Cartesia TTS bytes API](https://docs.cartesia.ai/api-reference/tts/bytes)) at sub-90 ms ([Cartesia Vietnamese](https://www.cartesia.ai/languages/vietnamese)).
- Sign the free BAA and DPA at [click-agreements.retellai.com](https://click-agreements.retellai.com/), set per-agent retention to the minimum, and enable PII exclusion and signed recording URLs ([Retell compliance](https://docs.retellai.com/general/compliance)).

Accepted trade-off: no true mid-sentence code-switching. Language is detected at the top of the call and pinned; a switch requires an explicit signal. Deepgram's seamless-switch mode does not cover Vietnamese ([Retell changelog](https://www.retellai.com/changelog)).

#### Option B — the escape hatch

Pipecat self-hosted on the Twilio transport, ElevenLabs Scribe v2 Realtime as primary ASR with self-hosted PhoWhisper-large as a Vietnamese verification pass on booking-critical fields, and a two-lane TTS router: Cartesia Sonic-3 for English and a Vietnamese-native voice for Vietnamese, with FPT.AI used as a pre-render cache for fixed prompts only.

Why each piece: Pipecat's Twilio and Telnyx transports are first-party maintained and it is the only option that routes the same call to different TTS engines per language ([Pipecat supported services](https://docs.pipecat.ai/server/services/supported-services)). ElevenLabs places Vietnamese in Scribe v2's "Excellent (≤5% WER)" tier — the strongest published Vietnamese claim from any global vendor — and `scribe_v2_realtime` natively accepts μ-law and 8 kHz PCM at approximately 150 ms, removing a resampling step ([ElevenLabs STT capabilities](https://elevenlabs.io/docs/capabilities/speech-to-text), [ElevenLabs models](https://elevenlabs.io/docs/models)). PhoWhisper-large publishes 8.14% WER on CommonVoice-Vi and 4.67% on VIVOS, the only fully transparent reproducible Vietnamese WER benchmark in the research ([PhoWhisper](https://github.com/VinAIResearch/PhoWhisper)). Only Vietnamese domestic vendors offer a Southern accent: FPT.AI ships 21 voices tagged MB North, MN South, MT Central ([FPT.AI TTS voices](https://docs.fpt.ai/docs/en/speech/documentation/tts-voice/)); Viettel uses `hn-`, `hcm-`, `hue-` prefixes and supports streaming output ([Viettel TTS API](https://www.vtcc.vn/api-tts-text-to-speech/)); Zalo ships two Northern and two Southern voices and states it is optimized for realtime ([Zalo TTS](https://github.com/iconclub/zalo-tts)). FPT.AI must never be used live: its API returns a URL you poll with a "waiting time from 5 seconds to 2 minutes depending on text length" ([FPT.AI TTS API](https://docs.fpt.ai/docs/vi/speech/api/text-to-speech/)).

Caveat carried forward: Viettel and Zalo do not publish per-character rates ([Viettel AI](https://viettelai.vn/en/chuyen-giong-noi)), and both serve from Vietnam, adding trans-Pacific round-trip latency to a US-hosted agent. Cartesia Sonic-3 remains the Vietnamese fallback if RTT proves unacceptable. Also note LiveKit marks `elevenlabs/scribe_v2_realtime` as Deprecated in its inference catalog ([LiveKit STT models](https://docs.livekit.io/agents/models/stt/)) — a platform-level, not model-level, signal to verify direct-API lifecycle before committing.

#### Recommendation and trigger

Launch on Option A. Move to Option B when any one of the following fires:

1. Vietnamese booking-field correction rate — the share of Vietnamese-language calls where the owner edits the name, phone or time after the fact — exceeds 8% over a rolling 200 calls.
2. A design-partner restaurant reports Vietnamese comprehension complaints on more than 3 calls in a week and the transcripts confirm ASR error rather than model reasoning error.
3. A tenant requires a Southern Vietnamese voice as a contractual condition. No global vendor can deliver one; Google gives 40 vi-VN voices with no accent metadata ([Google TTS voice list](https://cloud.google.com/text-to-speech/docs/list-voices-and-types)) and Azure gives exactly two, `vi-VN-HoaiMyNeural` and `vi-VN-NamMinhNeural` ([Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt)).
4. Blended Retell cost exceeds $0.18 per minute at a volume where self-hosting is cheaper.

### 5.5 Vietnamese text handling rules

- All Vietnamese strings are stored and transmitted as UTF-8 NFC with full diacritics. Diacritic-stripped Vietnamese is never written to the database and never spoken.
- Vietnamese surnames Nguyễn, Trần, Lê, Phạm, Huỳnh, Hoàng, Võ, Đặng, Bùi, Đỗ, Hồ, Ngô, Dương, Lý are seeded into every tenant's keyterm list at provisioning, in addition to the tenant's own staff names ([Deepgram keyterm prompting](https://developers.deepgram.com/docs/keyterm)).
- Caller-name capture in salon mode uses English orthography as spoken; if the caller spells a Vietnamese name, store the diacritic form when it can be resolved from the tenant's existing `customers` rows, and the as-spelled form otherwise.
- The owner backend renders Vietnamese with `lang="vi"` and a font stack that has full Vietnamese coverage. Any UI that truncates must truncate on grapheme clusters, not code units.

---

## 6. Salon booking module — functional spec

### 6.1 Service catalog and duration model

The canonical `businesses.services` JSONB array holds `[{ name, price, duration, category }]`. That is sufficient for a greeting bot and insufficient for a booking engine, because the same service takes different amounts of time depending on the technician and the customer. Mangomint documents "Client-Specific Service Durations" as a distinct feature ([Mangomint Learning Center](https://www.mangomint.com/learn/)); no integrable API in the salon matrix exposes it. We own it.

Model:

- `services` is promoted to a real table (section 13) with `base_duration_minutes`, `buffer_before_minutes`, `buffer_after_minutes`, `price_cents`, `requires_skill`, and `gap_fillable`.
- `technician_services` carries a per-technician `duration_override_minutes` and `proficiency` so a fast technician's book is not padded.
- `customers.duration_multiplier`, default 1.00, captures the client-specific reality that some customers reliably take 20% longer. It is set by the owner, never inferred by the model, and never spoken to the caller.

Effective duration:

```
effective_minutes =
  ceil(
    ( COALESCE(ts.duration_override_minutes, s.base_duration_minutes)
      * COALESCE(c.duration_multiplier, 1.00) )
  )
  + s.buffer_before_minutes
  + s.buffer_after_minutes
```

Gap filling. A service with `gap_fillable = true` and an effective duration at or below `modules.booking.gap_fill_minutes` can be placed inside an existing dead slot between two bookings on the same technician. This is the mechanic Phorest markets as "Reducing the 'White Space' in your Schedule" ([Phorest AI features](https://www.phorest.com/us/features/ai-features/)) and GlossGenius calls "Gap time" ([GlossGenius pricing](https://glossgenius.com/pricing)). Neither exposes it through an API, so the gap search runs against Linh's own `bookings` plus, in Tier A, the adapter's `getAvailability` result.

Missing-data behavior. If a service has no duration, Linh uses `modules.booking.default_service_duration_minutes`, marks the resulting booking `duration_estimated = true`, and includes the row in the owner's morning brief as an item to correct. The agent never invents a duration out loud; it books the default silently and confirms only the start time.

### 6.2 Per-technician availability

Availability for technician `t` on date `d` is the intersection of five sets, computed in this order:

1. Business hours for `d` from `businesses.business_hours`.
2. The technician's shift for `d` from `availability_blocks` where `kind = 'shift'`.
3. Minus `availability_blocks` where `kind IN ('break','vacation','block')`.
4. Minus existing `bookings` for `t` with `status IN ('confirmed','pending_deposit')`, expanded by each booking's buffers.
5. Minus adapter-reported busy intervals when `pos_sync.enabled` and `capabilities.availabilityIsAuthoritative`.

Step 5 is what makes Square, Zenoti and Mindbody worth integrating. Square documents `POST /v2/bookings/availability/search` — "Searches for availabilities for booking" with the `APPOINTMENTS_READ` scope ([Square SearchAvailability](https://developer.squareup.com/reference/square/bookings-api/search-availability)). Zenoti documents Service Booking APIs that "allow you to search for a guest, add a service to the guest, and then book an appointment" ([Zenoti Service Booking APIs](https://docs.zenoti.com/docs/service-booking-apis)). Mindbody names "Book Appointments", "Update Appointments" and "View Staff Appointment Schedule" endpoints ([Mindbody endpoints](https://developers.mindbodyonline.com/Resources/Endpoints)).

Freshness. Adapter availability is cached for at most 45 seconds during an active call and re-fetched immediately before `commit`. For adapters with no webhooks — Phorest states "The Phorest API does not currently support webhooks" and instructs integrators to poll the `updated_at` field ([Phorest getting started](https://developer.phorest.com/docs/getting-started)) — the poll interval is `modules.pos_sync.poll_interval_seconds` and the cache TTL drops to 20 seconds during a live call.

### 6.3 Fair-turn rotation

This is the feature no integrable platform exposes and no phone agent has ever been wired to. We model both dominant semantics because both exist in the field and Vietnamese owners will name them.

#### 6.3.1 Zota-style queue types

Zota advertises "8 types of turn queue management", "Reward and subtract turn, lock or flexible turn jump", "Turn on or off turn on appointment", "Special Tech setup with different turn type", and the three base orderings "FIFO, Clock-in-time, or Turn credit" ([Zota salon POS](https://zotaservices.com/salon-pos/), [Zota POS](https://zota.us/pos/)). Linh implements the following queue types, keyed by `turn_queue.queue_type`:

| Queue type | Ordering rule | Notes |
|---|---|---|
| `fifo` | Order of arrival on shift | Simplest; ignores work done |
| `clock_in` | Order of `clock_in_at` ascending | Rewards early arrival |
| `turn_credit` | Ascending `credit_points`, ties broken by `clock_in_at` | The weighted model; see 6.3.2 |
| `appointment_exempt` | Appointments do not consume a turn | "Turn on or off turn on appointment" |
| `appointment_counted` | Appointments consume a turn | The other half of the same toggle |
| `special_tech` | Technician has an independent queue with its own type | "Special Tech setup with different turn type" |
| `locked` | Technician is pinned at their current queue position and neither advances nor is skipped | "lock … turn jump" |
| `flexible_jump` | A technician may be moved up or down by the owner without recomputing others | "flexible turn jump" |

Reward and subtract are explicit operations, not side effects: `turn_events.event_type IN ('reward','subtract')` with a signed `points_delta` and a mandatory `reason`, written only by an authenticated owner or manager, never by the agent.

#### 6.3.2 Vinail-style weighted points

Vinail specifies "Fair turn rotation", "Factor 0.25 / 0.5 / 1 by customer and service type", with "turn points generated automatically from the invoice" and "Point carry-over (optional)" ([vinail.net](https://vinail.net/), [Vinail EN](https://vinail.net/en/nail-salon-software-for-vietnamese)). Linh implements exactly that arithmetic:

```
turn_weight(booking) =
    service.turn_factor          -- 0.25 | 0.5 | 1.0, set per service
  * customer_factor(customer)    -- 1.0 default; 0.5 for a returning request client;
                                 -- owner-configurable, never model-inferred
```

with `credit_points += turn_weight` on completion, and optional end-of-day carry-over controlled by `turn_queue.carry_over_enabled`. A 15-minute polish change at factor 0.25 does not cost a technician the same turn as a full set at factor 1.0. That asymmetry is the entire point of the mechanic and it is why a naive round-robin is unacceptable to a Vietnamese salon owner.

#### 6.3.3 Selection algorithm

```typescript
interface TurnCandidate {
  technicianId: string;
  creditPoints: number;      // lower is "more owed a turn"
  clockInAt: Date | null;
  queueType: QueueType;
  locked: boolean;
  canPerform: boolean;       // technician_services join
  freeAt: Date | null;       // earliest slot that fits effective_minutes
}

function selectTechnician(
  candidates: TurnCandidate[],
  requestedTechnicianId: string | null,
  serviceId: string,
  desiredStart: Date,
  mode: RotationMode
): { technicianId: string; reason: 'requested' | 'rotation' | 'only_qualified' } | null {

  // 1. An explicit request beats rotation, always. Rotation is a fairness
  //    mechanism among the house's own staff, not a rationing device for clients.
  if (requestedTechnicianId) {
    const t = candidates.find(c => c.technicianId === requestedTechnicianId);
    if (t && t.canPerform && t.freeAt !== null) {
      return { technicianId: t.technicianId, reason: 'requested' };
    }
    return null;    // caller is offered alternatives by the agent, see 6.4
  }

  const eligible = candidates.filter(c => c.canPerform && c.freeAt !== null && !c.locked);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) {
    return { technicianId: eligible[0].technicianId, reason: 'only_qualified' };
  }

  const ordered = [...eligible].sort((a, b) => {
    switch (mode) {
      case 'fifo':
        return (a.clockInAt?.getTime() ?? 0) - (b.clockInAt?.getTime() ?? 0);
      case 'clock_in':
        return (a.clockInAt?.getTime() ?? Infinity) - (b.clockInAt?.getTime() ?? Infinity);
      case 'turn_credit':
      case 'weighted_points':
      default: {
        if (a.creditPoints !== b.creditPoints) return a.creditPoints - b.creditPoints;
        return (a.clockInAt?.getTime() ?? Infinity) - (b.clockInAt?.getTime() ?? Infinity);
      }
    }
  });

  return { technicianId: ordered[0].technicianId, reason: 'rotation' };
}
```

Edge cases resolved by rule, not by the model:

- Two technicians tied on `credit_points` and both clocked in at the same minute: order by `technicians.id` ascending, deterministically, so a retry of the same call produces the same assignment.
- `special_tech` technicians are evaluated against their own queue and are excluded from the house queue's ordering entirely.
- A `locked` technician is never selected by rotation but is always selectable by explicit request.
- If `modules.booking.rotation_mode = 'off'`, selection is earliest-free-first among qualified technicians.

#### 6.3.4 What the agent says

The agent never explains the queue. It never says "it is Tina's turn" and never says "the system assigned you to Kim". Assignment language is: "I have you with Kim at 2:15." / "Em xếp quý khách với Kim lúc 2 giờ 15." Rotation is an internal fairness mechanism between the owner and the staff; exposing it to callers invites arguments the owner will have to settle.

### 6.4 Skill and preference routing

"I want Tina" is the highest-value sentence in a salon call and the one competitors handle worst. Bukkii is explicit about the mechanic — "Lisa wants Tina for nail art? AIVA knows Tina's schedule and skills, and books her — not the next free chair" ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)) — but an independent review reports it books into its own booking site and Reserve with Google rather than into Vagaro or Boulevard ([stork.ai on Bukkii AIVA](https://www.stork.ai/en/bukkii-ai-aiva)). Smith.ai only collects "preferred technician" as intake data ([Smith.ai nail salon page](https://smith.ai/industries/nail-salons-answering-service)). SICUS captures "technician (if requested)" ([SICUS AI Receptionist](https://sicusmedia.com/products/ai-receptionist.html)).

Resolution order for a spoken name:

1. Exact case-insensitive match on `technicians.display_name`.
2. Match on `technicians.aliases[]`, which holds the shop-floor name a customer would actually say — "Tina" for Trinh, "Kim" for Kim Ngân, "Amy" for Ánh My. This array is owner-maintained and is loaded into the ASR keyterm list.
3. Fuzzy match with a Damerau-Levenshtein distance of at most 1 against the union of names and aliases, only when the candidate set collapses to exactly one technician.
4. Otherwise, disambiguate out loud with at most two candidates: "Do you mean Tina or Tiên?"

Skill gate. A requested technician who has no `technician_services` row for the requested service is not booked for it. The agent says so and offers the alternatives in this order: (a) the same technician for a service they can do, if the caller's intent is ambiguous; (b) the next rotation-selected qualified technician at the same time; (c) the requested technician at their next qualified opening.

Caller-facing strings:

| Situation | English | Vietnamese |
|---|---|---|
| Requested tech available | "Tina has 2:30 open. Want me to put you down?" | "Chị Tina có trống lúc 2 giờ 30. Em đặt lịch cho quý khách nhé?" |
| Requested tech busy, alternatives exist | "Tina is booked until 5. I can do 5:15 with Tina, or 2:30 with Kim, who also does gel-X." | "Chị Tina đã kín lịch đến 5 giờ. Em có 5 giờ 15 với chị Tina, hoặc 2 giờ 30 với chị Kim, cũng làm gel-X được ạ." |
| Requested tech cannot perform service | "Tina does not do pink and white, but Kim does and she is open at 3." | "Chị Tina không làm bột hồng trắng, nhưng chị Kim làm được và trống lúc 3 giờ." |
| Requested tech off that day | "Tina is off Tuesday. She is in Wednesday from ten." | "Thứ Ba chị Tina nghỉ. Chị ấy làm thứ Tư từ 10 giờ sáng." |

### 6.5 Walk-in wait-time quoting by phone

Only Bukkii claims wait-time estimates in the nail vertical, and it surfaces them on a front-desk tablet ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)). Zenoti has a real digital queue where "walk-ins are added at the front desk, assigned to the next available technician" ([Zenoti nail booking](https://www.zenoti.com/salon-management-software/nail-salon-booking/)), with settings including "Prioritize guests with scheduled services over walk-in guests" ([Zenoti queue settings](https://help.zenoti.com/en/queue/onboard-and-set-up/general-settings-for-queue.html)) — but it is a front-desk surface, not a phone answer. On the restaurant side the mechanic is ordinary: Loman quotes wait times ([loman.ai](https://www.loman.ai/)) and Serviio sends pickup estimates ([serviio.ai](https://serviio.ai/)).

Estimator:

```
for each qualified technician t:
    t.free_at = max(now, end_of_current_service(t), end_of_all_queued_walkins_ahead(t))
             + travel_and_setup_buffer

quoted_wait_minutes =
    min over t of (t.free_at - now)
  + modules.walkin_queue.quote_padding_minutes
```

Rules:

- If `quoted_wait_minutes > modules.walkin_queue.max_quotable_wait_minutes` and `refuse_quote_above_max` is true, the agent does not quote a number. It says the shop is very busy and offers an appointment or the waitlist. A wrong 90-minute quote costs the salon a review; refusing to quote costs nothing.
- The quote is a range, never a point: floor to the nearest 5 and present as "about X to X+10 minutes."
- A quote optionally places a soft hold for `hold_minutes_after_quote`, recorded in `turn_events` as `event_type = 'walkin_hold'` so the queue does not hand the slot away while the caller drives over.
- Scheduled appointments always outrank walk-ins in the estimator, mirroring Zenoti's "Prioritize guests with scheduled services over walk-in guests" setting ([Zenoti queue settings](https://help.zenoti.com/en/queue/onboard-and-set-up/general-settings-for-queue.html)).

Strings:

| Situation | English | Vietnamese |
|---|---|---|
| Quote given | "Right now it is about 20 to 30 minutes for a fill. If you head over I will put your name down." | "Bây giờ khoảng 20 đến 30 phút cho một lần đắp thêm. Nếu quý khách qua bây giờ, em ghi tên trước cho ạ." |
| Too busy to quote | "We are very busy right now and I do not want to give you a wrong number. I can book you at 4:30 instead." | "Hiện giờ tiệm rất đông, em không muốn nói sai thời gian. Em đặt lịch cho quý khách lúc 4 giờ 30 nhé?" |
| Hold placed | "I have your name down for the next 15 minutes." | "Em giữ tên quý khách trong 15 phút tới." |

### 6.6 Booking create, modify, cancel

Create sequence:

1. `check_availability(service, date_range, technician?)` → slot list, already intersected with adapter availability.
2. Agent offers at most three slots. Never more; a phone caller cannot hold four options.
3. `book_appointment(...)` with a client-generated `idempotency_key = sha256(call_id + service_id + slot_start_iso)`.
4. Linh writes the `bookings` row as `status = 'pending'` inside a transaction that also takes an advisory lock on `(technician_id, date)`.
5. Adapter `commit()` is called. On success the row moves to `confirmed` and `pos_external_id` is stored. On failure the row moves to `confirmed` anyway if the adapter tier is C or the failure is retryable, and a `pos_sync_log` row is written with `status = 'pending_retry'`.
6. SMS confirmation is queued, subject to quiet hours (section 9.3).
7. Agent reads back the booking. Read-back is mandatory and includes service, technician, day, time and location.

Modify. Reschedule is implemented as cancel-then-create inside one transaction, preserving `bookings.id` and appending to a `bookings.history` JSONB trail. Boulevard exposes a direct reschedule mutation, `appointmentReschedule`, described as "Reschedule the provided appointment to a new date and time" ([Boulevard appointmentReschedule](https://developers.joinblvd.com/graphql-admin-api/api-reference/mutations/appointmentReschedule)), and adapters that expose one use it; the internal model is uniform either way.

Cancel. Sets `status = 'cancelled'`, releases the slot, fires waitlist backfill (section 6.8), and — if a deposit was captured and the cancellation is inside `deposits.refund_policy_hours` — enqueues a refund decision for the owner rather than auto-refunding. Linh does not make money decisions on the owner's behalf.

Caller identity. `customers` is matched on `(business_id, phone)`, which the canonical schema already enforces as UNIQUE. A caller with no match is created on booking, not on call, so that spam and wrong numbers do not pollute the CRM.

### 6.7 Deposits and no-show protection

Hard rule: Linh never hears, repeats, transcribes or stores a card number. The PCI SSC is unambiguous that "Accepting spoken account data over the telephone puts personnel, the technology used, and the infrastructure to which that technology is connected into scope of PCI DSS", that sensitive authentication data including the card security code taken during a call must not be stored after authorization even if encrypted, and that "It is therefore prohibited to use any form of digital audio recording" for those values ([PCI SSC, Protecting Telephone-Based Payment Card Data v3.0](https://www.pcisecuritystandards.org/documents/Protecting_Telephone_Based_Payment_Card_Data_v3-0_nov_2018.pdf), [PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf)). Agent-initiated pause and resume is not a compliant control, because it depends on the agent remembering ([Sycurio fact sheet citing the PCI SSC supplement](https://cdn.asp.events/CLIENT_ROAR_Eve_16F4C528_E03F_0401_6D78CA8E12A9EF6E/sites/CCCE-2023/media/libraries/exhibitor-documents/36160-Sycurio-Pause&Resume-Fact-Sheet-UK-May-22.pdf)). And CVV can never be kept for a card on file: PCI DSS "prohibits storage of card verification codes, for example, after transaction authorization or to facilitate potential future transactions" ([PCI SSC FAQ 1574](https://www.pcisecuritystandards.org/faqs/1574/)).

Flow:

1. `book_appointment` returns `deposit_required: true` when the `modules.deposits.trigger` condition matches.
2. Linh creates a Stripe Payment Link for `amount_cents` on the tenant's connected account and writes a `deposits` row with `status = 'link_sent'` and an expiry of `hold_minutes`.
3. The booking sits at `status = 'pending_deposit'`. The slot is held, not confirmed.
4. SMS goes out with the link. The agent says the amount and that a text is on the way; it does not read the URL aloud.
5. Stripe webhook `checkout.session.completed` moves `deposits.status = 'paid'`, sets `bookings.deposit_paid = true` and `bookings.status = 'confirmed'`, and fires the confirmation SMS.
6. On expiry with no payment, the hold is released, the booking is cancelled, and the waitlist is offered the slot.

Stripe Checkout, Payment Links and Elements all keep the merchant at SAQ A because "Checkout, Stripe.js and Elements host all card-collection inputs within an iframe served from Stripe's domain, not yours" ([Stripe PCI compliance guide](https://stripe.com/guides/pci-compliance)). Direct API card handling is SAQ D and is prohibited by NG2. Because we use Stripe-hosted Payment Links rather than embedding Elements on our own domain, we also avoid PCI DSS Requirements 6.4.3 and 11.6.1 payment-page script inventory and change detection ([PCI SSC guidance on e-commerce requirements](https://blog.pcisecuritystandards.org/coffee-with-the-council-podcast-guidance-for-pci-dss-e-commerce-requirements-effective-after-31-march-2025)).

Competitive context: deposits are rare and shallow in the nail vertical. Only Tilavon lists "Booking Deposits" and "No-Show Protection" as named features, and only on Pro and Elite ([Tilavon pricing](https://tilavon.com/pricing)). Bukkii lists deposit handling only on its most expensive AI plus Human tier ([bukkii.ai/vi](https://www.bukkii.ai/vi)) and an independent review says it does not capture deposits itself ([stork.ai](https://www.stork.ai/en/bukkii-ai-aiva)).

Strings:

| Situation | English | Vietnamese |
|---|---|---|
| Deposit requested | "This one takes a $20 deposit to hold the time. I am texting you a secure link now — it comes from the salon, not from me, and I never take card numbers over the phone." | "Dịch vụ này cần đặt cọc 20 đô la để giữ chỗ. Em đang nhắn tin gửi đường dẫn an toàn cho quý khách — đường dẫn từ tiệm, không phải từ em, và em không bao giờ nhận số thẻ qua điện thoại." |
| Hold expiring | "Your 2:30 is held for 30 more minutes until the deposit goes through." | "Giờ hẹn 2 giờ 30 được giữ thêm 30 phút cho đến khi tiền cọc được thanh toán." |
| Caller reads a card number anyway | "I cannot take card numbers on this line. Please use the link I texted you." | "Em không nhận số thẻ qua điện thoại được ạ. Xin quý khách dùng đường dẫn em vừa nhắn." |

If a caller begins reciting digits anyway, the runtime PAN filter (section 9.5) redacts the transcript segment, the audio segment is excluded from persistence, and the agent replies with the string above. This is an automatic control, not an agent behavior.

### 6.8 Waitlist and gap backfill

Waitlist entries carry a service, a technician preference of `any | specific | list`, and a time window. They are matched on three triggers: a cancellation, a no-show marked by the owner, and a gap opening created by a shortened service.

Backfill algorithm:

1. On slot release, select waitlist entries whose window contains the slot and whose service fits the released duration, ordered by `priority DESC, created_at ASC`.
2. Offer to at most `modules.waitlist.max_offers_per_slot` entries simultaneously by SMS, first-accept-wins, with an `offer_window_minutes` timer.
3. Losers are told the slot went and stay on the list at unchanged priority.
4. If nobody accepts, the slot returns to open availability.

Quiet hours apply to waitlist offers: no outbound SMS before 8:00 a.m. or after 9:00 p.m. in the recipient's local time ([47 CFR 64.1200(c)(1)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200)). A slot released at 9:40 p.m. is offered at 8:00 a.m., not at 9:41 p.m.

Strings:

| Situation | English | Vietnamese |
|---|---|---|
| Added to waitlist | "You are on the list for Saturday morning with Tina. If something opens I will text you." | "Em đã ghi tên quý khách vào danh sách chờ sáng thứ Bảy với chị Tina. Có chỗ trống em sẽ nhắn tin ngay." |
| Offer SMS | "A 10:30 with Tina just opened at [Salon]. Reply YES in the next 20 minutes to take it. Reply STOP to opt out." | "Vừa có chỗ trống 10 giờ 30 với chị Tina tại [Tiệm]. Nhắn YES trong 20 phút tới để nhận. Nhắn STOP để ngừng nhận tin." |
| Offer lost | "That slot was taken. You are still on the list." | "Chỗ đó đã có người nhận. Quý khách vẫn còn trong danh sách chờ." |

### 6.9 Spam and robocall screening

Salon-specific nuisance patterns are the target: nail-supply cold calls, fake Google and Yelp listing calls, merchant-services pitches, and silent auto-dialers. The two published benchmarks are Bukkii's "37K+ Spam calls filtered" ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)) and Smith.ai's "Over 20 million known robocalls and solicitors automatically blocked" ([Smith.ai AI receptionist](https://smith.ai/ai-receptionist)); neither ties the number to salon economics. Goodcall handles it structurally rather than as a feature — "Robo calls, numbers you block, or callers who never say anything to your agent never count toward the allowance" ([Goodcall pricing](https://www.goodcall.com/pricing)) — which is the model worth copying, because it aligns the vendor's incentive with the owner's.

Four-layer screen, evaluated in order, before the consent disclosure completes:

1. Tenant block list from `modules.spam_filter.block_list`. Immediate hang-up, no recording retained, no minute billed.
2. Silence detector. No caller audio for `silent_caller_seconds` after the disclosure completes: terminate, mark `calls.intent = 'spam_silent'`.
3. Vendor-pitch classifier on the first two caller turns. Keys on supplier, merchant-services, listing-verification and SEO pitch patterns. On a hit the agent says one sentence and ends the call.
4. Repeat-offender promotion. Three classifier hits from the same ANI within 30 days auto-adds the number to the tenant block list with an owner-visible undo.

Billing rule, following the Goodcall precedent: minutes on calls terminated by layers 1 through 3 are never billed to the tenant when `never_bill_flagged_minutes` is true.

Recording rule: a call terminated at layer 1 is not recorded at all. Calls terminated at layers 2 and 3 have already passed the disclosure, so the recording is lawful, but audio is deleted at the end of the day rather than held for 30 days.

Strings:

| Situation | English | Vietnamese |
|---|---|---|
| Vendor pitch | "We do not take sales calls on this line. Goodbye." | "Đường dây này không nhận cuộc gọi chào hàng. Xin chào." |
| Owner morning brief line | "Blocked 6 spam calls yesterday, 11 minutes saved." | "Hôm qua đã chặn 6 cuộc gọi rác, tiết kiệm 11 phút." |

### 6.10 Human transfer with context

Transfer triggers, in priority order: an explicit request for a person, an explicit request for the owner or manager, a complaint or refund keyword in either language, three consecutive low-confidence ASR turns, a price dispute, and any utterance the health-suppression classifier flags (section 9.7).

Vietnamese and English trigger vocabulary, at minimum: manager, owner, complaint, refund, speak to a person, quản lý, chủ tiệm, khiếu nại, hoàn tiền, nói chuyện với người thật.

Warm transfer payload written to `calls.summary` before the dial, and pushed to the manager as an SMS preamble:

```json
{
  "caller_phone": "+1703...",
  "caller_name": "Lisa Tran",
  "language": "en",
  "intent": "complaint",
  "summary_en": "Caller says her fill from Saturday lifted after two days. Asking for a redo, not a refund.",
  "summary_vi": "Khách nói bộ móng đắp hôm thứ Bảy bị bong sau hai ngày. Khách muốn làm lại, không đòi hoàn tiền.",
  "booking_ref": "b_01J...",
  "consent_event_id": "ce_01J..."
}
```

Both summaries are generated. Which one the manager reads is decided by that manager's `user_preferences.language`, not by the business. Maple's pattern of passing "complex enquiries and high-priority guests to staff with call context" ([Verdict Foodservice on Maple](https://www.verdictfoodservice.com/news/maple-links-voice-ai-with-opentable/)) and Bite Buddy's "warm transfers with context preserved" ([bitebuddy.ai](https://bitebuddy.ai/)) are the market baseline; the bilingual dual summary is the addition.

Failure path. If the manager does not answer within four rings, the agent returns to the caller, apologizes, takes a message, and sends the owner an SMS. It never drops the caller into an unanswered ring-out. If the tenant has no `manager_phone`, the transfer tool is not emitted at all by `resolveTools`.

---

## 7. Restaurant ordering module — functional spec

### 7.1 Menu catalog and modifiers

Source of truth precedence: adapter catalog when `capabilities.canReadCatalog` is true, otherwise the `menu_items` and `menu_modifiers` tables maintained by the owner.

Adapter catalog reads that exist today: Square Catalog API exposes `ITEM`, `ITEM_VARIATION`, `MODIFIER` and `CATEGORY` object types and requires the `ITEMS_READ` scope for OAuth apps ([Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does)). Toast exposes `GET /menus` v2 ([Toast menus API](https://doc.toasttab.com/doc/devguide/apiMenusApiRateLimit_V2.html)). SpotOn exposes Online Ordering "Menus READ" ([SpotOn getting started](https://developers.spoton.com/central-api/docs/getting-started)). Lightspeed K-Series exposes `GET /o/op/1/menu/load/{ikentooMenuId}` and `GET /o/op/1/itemAvailability` ([Lightspeed K-Series online ordering features](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-features)). ItsaCheckmate exposes `GET /api/v2/menu/:order_source` requiring the `menus` scope and a verified location ([ItsaCheckmate Marketplace API collection](https://raw.githubusercontent.com/api-evangelist/itsacheckmate/main/collections/itsacheckmate-marketplace-api.opencollection.json)).

86'ing. Out-of-stock handling is adapter-specific and matters more than it looks. Toast has a stock API plus a stock webhook for in-stock, out-of-stock and low-quantity, with `stock:read` and `stock:write` scopes — but the orders API still accepts orders containing out-of-stock items ([Toast stock API](https://doc.toasttab.com/doc/devguide/apiStock.html), [Toast stock webhook](https://doc.toasttab.com/doc/devguide/apiStockWebhook.html)). SpotOn publishes an Item Availability webhook ([SpotOn getting started](https://developers.spoton.com/central-api/docs/getting-started)). Deliverect provides snooze and unsnooze webhooks ([Deliverect Commerce API overview](https://developers.deliverect.com/reference/commerce-api-overview)). Where no 86 signal exists, the owner marks items unavailable in the Linh dashboard, and the agent respects that flag. The agent must never confirm an item it cannot verify is available; it says "let me check with the kitchen" and takes the rest of the order.

### 7.2 Order taking

Sequence: greeting and language detection, consent disclosure, fulfillment type, items with modifiers, read-back, name and callback number, pickup time quote, confirmation.

Read-back is mandatory and non-configurable (`ordering.read_back_required` is a JSON `const: true`). The agent reads the full order with quantities and modifiers and asks for a yes before any adapter call. Restaurant orders are the one flow where a model hallucination costs the owner real food.

Guards:

- `max_items_per_order` and `max_order_total_cents` are hard stops. Exceeding either escalates (7.6).
- Modifier validity is checked against the catalog before read-back; an unmatched modifier becomes a free-text note on the line item and is flagged to the kitchen, never silently dropped.
- Special instructions in Vietnamese are preserved verbatim with diacritics in the line item note and are also machine-translated into English into a second field, because no POS in the matrix documents a Vietnamese UI. Kitchen tickets will carry whatever the restaurant typed as the item name, not a POS localization.

### 7.3 Order injection to POS

Injection is a two-phase operation: `commit()` returns a provisional acceptance, and the adapter's confirmation signal upgrades it to `injected`. HTTP 200 is not confirmation for several vendors and treating it as such is the classic failure mode. Lightspeed K-Series is explicit that "HTTP 200 does not mean the order reached the POS" — you must wait for the confirmation webhook, and an error webhook means the order was NOT sent to the POS ([Lightspeed K-Series online ordering tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial)). Otter returns POS `injectionState`, `injectionEvent` and `orderIssues` on order detail and fires a webhook telling you whether the order was injected, requires manual injection, or failed ([Otter API reference](https://developer-guides.tryotter.com/api-reference/)). That observability is the reason the agent can honestly tell a caller "your order is in."

The canonical `orders.status` values from `build-prompts-customized.md` — pending, confirmed, preparing, ready, completed, cancelled — are unchanged. Injection is tracked separately in `orders.injection_state` and in `pos_sync_log`, so the owner-facing status column keeps the meaning the dashboard already gives it.

```
orders.status          pending -> confirmed -> preparing -> ready -> completed
                                     |
                                     +-> cancelled

orders.injection_state  null -> accepted -> injected
                                    |
                                    +-> manual_injection_required
                                    +-> injection_failed -> fallback_sent
```

The agent's closing line is conditioned on the sub-state. If injection has not confirmed within 6 seconds, the agent says the order is placed and the restaurant will see it, then the fallback channel fires. It never claims the kitchen has it when the adapter has not said so.

### 7.4 Payment posture — the real constraint

API access is not the binding constraint on restaurant ordering. Payment posture is. Vietnamese takeout is overwhelmingly pay-at-pickup, and half the POS vendors in the matrix will not accept an unpaid order.

| Vendor | Accepts unpaid pay-at-pickup? | Exact constraint | Source |
|---|---|---|---|
| Toast | Yes | Payments are optional; you may omit the `payments` object. Two traps: the API creates the order even if the restaurant is closed, and with an auto-firing KDS device the order goes straight to the kitchen bypassing approval rules. Prices must be pulled from `/prices` first; `externalId` must be unique; no shopping-cart support; `promisedDate` for scheduled orders. | [Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html) |
| Clover | Yes | Order may be created unpaid, then marked paid via a payment record; max 3,000 line items. To actually reach the kitchen you generally fire it with the Print API. | [Clover orders FAQ](https://docs.clover.com/dev/docs/orders-faqs), [Clover print orders](https://docs.clover.com/dev/docs/printing-orders-rest-api) |
| Lightspeed K-Series | Yes | Unpaid or partially-paid orders land in the Dine In or Pickup/Delivery section of the Orders tab; fully paid orders land on the receipt screen. Requires at least one item `sku`, an active webhook `endpointId`, and a unique `thirdPartyReference`. | [Lightspeed K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial) |
| Deliverect | Yes | The Commerce API supports `isPrepaid=false`, injecting the order as unpaid. | [Deliverect Commerce channel API](https://developers.deliverect.com/reference/commerce-channel-api) |
| Square | No | "Orders with fulfillment that have been fully paid are pushed to the Square Point of Sale and Square Dashboard Order Manager" — an injected order must carry a fulfillment object and be fully paid to surface. | [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does) |
| SpotOn | No | "The SpotOn Order API allows the injection of fully paid orders into the POS." Only fully paid CLOSED orders are accepted by `/submit`; DRAFT and OPEN orders error out; payment amount must match the total; `menu_id` is required; payment type `EXTERNAL` with `provider_name` becomes the custom tender name on the receipt. | [SpotOn create order](https://developers.spoton.com/central-api/docs/create-order) |
| Olo Rails | No | Prepaid only. "Rails allows third-party UI's to submit prepaid orders through the Ordering API… There is not a separate API"; Olo cannot refund or adjust prepaid Rails orders. | [Olo Rails FAQ](https://olosupport.zendesk.com/hc/en-us/articles/115005665043-Rails-FAQ) |
| Lightspeed U-Series | No | `payment_info` is required on every order. | [Upserve/U-Series API docs](https://api-docs.upserve.com/olo/) |

Decision: `ordering.payment_posture = 'pay_at_pickup'` is the default and is the only posture supported at launch. Adapters whose `capabilities.requiresPrepaidOrder` is true are not offered to pay-at-pickup tenants for order commit; they are downgraded to fallback ticket mode by `resolveTools` step 3. A Square restaurant therefore gets Linh's ordering flow with an SMS or printed ticket, not a native Order Manager entry, unless the tenant explicitly opts into `prepaid_required` and accepts that callers must pay by link before the kitchen sees the order.

That is a decision, not a limitation to apologize for. Forcing a phở customer to complete a Stripe checkout before the kitchen starts is a worse product than a ticket on the counter.

### 7.5 Pickup time quoting

```
quoted_pickup_at =
    now
  + kitchen_prep_baseline_minutes(business, daypart)
  + sum(item.prep_weight for item in order)
  + current_queue_pressure_minutes
  + modules.ordering safety pad (default 5)
```

`current_queue_pressure_minutes` comes from the adapter's busy-mode signal where one exists — Deliverect publishes a `busyMode` webhook ([Deliverect Commerce API overview](https://developers.deliverect.com/reference/commerce-api-overview)) — and otherwise from the count of Linh orders in `confirmed` or `preparing` in the last 20 minutes. Kea's approach of throttling orders when tickets back up ([kea.ai](https://kea.ai/)) is the right instinct; Linh implements it as a quote extension first and a soft refusal second.

Quotes are ranges, rounded to 5 minutes, and are repeated in the SMS confirmation. Serviio's practice of sending pickup estimates by SMS ([serviio.ai](https://serviio.ai/)) is the baseline.

### 7.6 Reservations, large parties and catering

Reservations use the existing `bookings` table with `party_size` non-null and `service_name = NULL`. Capacity is modeled as `seatings_per_slot` per `turn_time_minutes` window, which is deliberately crude; a real table-topology model is P2 and is out of scope for v1.

Escalation rules:

- Party size above `reservations.max_party_size_auto` (default 8) is not booked by the agent. It takes contact details and escalates.
- Order total above `ordering.large_party_escalation_threshold_cents` (default $150) is not committed by the agent. It reads back, takes contact details and escalates.
- Any mention of catering, party tray, đặt tiệc, đặt mâm, or a date more than 48 hours out for food escalates.

Escalation is a `take_message` plus an immediate owner SMS, in the owner's language, plus a dashboard task. It is never a promise to the caller that the restaurant will do it.

Strings:

| Situation | English | Vietnamese |
|---|---|---|
| Large party | "For a party of twelve I want the owner to confirm the room. Can I take your name and number and have her call you back within the hour?" | "Với bàn mười hai người, em cần chủ tiệm xác nhận chỗ. Em xin tên và số điện thoại của quý khách, chị chủ sẽ gọi lại trong vòng một tiếng nhé?" |
| Catering | "Catering goes through the owner directly. I will pass your details on right now." | "Đặt tiệc thì chủ tiệm trực tiếp lo. Em gửi thông tin của quý khách ngay bây giờ ạ." |

### 7.7 Vietnamese dish-name handling

This is the part no POS solves. MenuSifu lists English, Spanish, Chinese and French across POS, KDS and kiosk ([MenuSifu full-service POS](https://www.menusifu.com/restaurants/full-service-restaurant-pos-system)); Chowbus lists English, Chinese, Japanese, Korean and Spanish including on kitchen screens ([Chowbus](https://www.chowbus.com/blog/the-best-chinese-restaurant-pos-system-in-2026)). Vietnamese is in neither list. The Vietnamese layer has to be entirely ours.

Rules:

1. Every `menu_items` row carries four name fields: `name_vi` with full diacritics, `name_en`, `name_pos` which is exactly the string the POS expects, and `aliases[]`.
2. `aliases[]` is seeded automatically with the diacritic-stripped form, common transliterations, and the number if the menu is numbered. "Phở tái" gets `pho tai`, `pho tai`, `#1`, `number one`, `beef noodle soup rare`.
3. Regional naming variance is handled by alias, not by model reasoning. The same dish is bánh mì thịt in one shop and bánh mì đặc biệt in another; the owner's `aliases[]` is authoritative.
4. Every alias and every `name_vi` goes into the ASR keyterm list. Deepgram Keyterm Prompting is available on Nova-3 and is marketed for Vietnamese specifically ([Deepgram keyterm prompting](https://developers.deepgram.com/docs/keyterm), [Deepgram Vietnamese](https://deepgram.com/product/speech-to-text/vietnamese)). The keyterm budget is finite, so the list is ranked by 30-day order frequency and truncated to the transcriber's limit.
5. Numeric disambiguation is preferred when confidence is low: "Number 15, phở tái — is that right?" A number is far more robust over an 8 kHz μ-law channel than a tone-bearing minimal pair.
6. Tone-collision guard. Where two menu items differ only by diacritic — for example bún bò and bún bơ — the pair is registered as a `confusable_pair` and the agent always disambiguates explicitly rather than guessing.
7. The POS receives `name_pos`. The kitchen ticket, the SMS to the customer and the dashboard show `name_vi` or `name_en` according to the reader's language. Nothing downstream ever sees a diacritic-stripped string.

---

## 8. POS adapter interface

### 8.1 The interface

One interface serves both verticals. A salon adapter and a restaurant adapter differ in their `capabilities` descriptor and in which commit payloads they accept, not in their shape.

```typescript
// ---------- shared value types ---------------------------------------------

export type AdapterTier = 'A' | 'B' | 'C';
export type Vertical = 'salon' | 'restaurant';

export interface Money { amountCents: number; currency: 'USD'; }

export interface TimeInterval { startsAt: string; endsAt: string; }   // ISO 8601 with offset

export interface AdapterAuth {
  businessId: string;
  adapterId: string;
  credentials: Record<string, string>;    // never logged, never in transcripts
  externalLocationId?: string;
}

// ---------- capabilities ----------------------------------------------------

export interface AdapterCapabilities {
  tier: AdapterTier;
  verticals: Vertical[];

  // read side
  canReadAvailability: boolean;
  availabilityIsAuthoritative: boolean;   // true only when the POS owns the calendar
  canReadCatalog: boolean;
  canReadStaff: boolean;
  canReadStock: boolean;

  // write side
  canCommitBooking: boolean;
  canModifyBooking: boolean;
  canCancelBooking: boolean;
  canCommitOrder: boolean;
  requiresPrepaidOrder: boolean;          // Square, SpotOn, Olo Rails => true
  requiresFulfillmentObject: boolean;     // Square => true
  requiresMenuId: boolean;                // SpotOn => true
  maxLineItems: number | null;            // Clover => 3000

  // eventing
  hasWebhooks: boolean;
  webhookEvents: string[];
  requiresPolling: boolean;               // Phorest => true
  pollCursorField: string | null;         // Phorest => 'updated_at'
  confirmationIsAsync: boolean;           // Lightspeed K-Series, Otter => true

  // nail-specific: universally false today, kept so the runtime can assert it
  exposesTurnQueue: false;
  exposesTipSplit: false;
  exposesCommission: false;

  // operational
  rateLimit: { requestsPerSecond: number | null; requestsPerWindow: number | null; windowSeconds: number | null; };
  sandboxAvailable: boolean;
  notes: string;
}

// ---------- domain payloads --------------------------------------------------

export interface AvailabilityQuery {
  vertical: Vertical;
  serviceExternalId?: string;
  staffExternalId?: string;
  window: TimeInterval;
  durationMinutes: number;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  staffExternalId: string | null;
  serviceExternalId: string | null;
  source: 'pos' | 'linh';
}

export interface CatalogItem {
  externalId: string;
  namePos: string;
  priceCents: number | null;
  durationMinutes: number | null;        // salon
  category: string | null;
  modifiers: CatalogModifier[];          // restaurant
  available: boolean;
}

export interface CatalogModifier {
  externalId: string;
  namePos: string;
  priceDeltaCents: number;
  minSelections: number;
  maxSelections: number;
}

export type CommitPayload =
  | { kind: 'booking';
      idempotencyKey: string;
      customer: { name: string; phone: string; email?: string; };
      serviceExternalId: string;
      staffExternalId: string | null;
      startsAt: string;
      durationMinutes: number;
      notes?: string; }
  | { kind: 'order';
      idempotencyKey: string;
      customer: { name: string; phone: string; };
      fulfillment: 'pickup' | 'delivery' | 'dine_in';
      requestedReadyAt: string | null;
      lineItems: Array<{
        externalId: string; quantity: number; priceCents: number;
        modifierExternalIds: string[]; noteVi?: string; noteEn?: string; }>;
      totals: { subtotal: Money; tax: Money | null; total: Money; };
      prepaid: boolean;
      paymentReference: string | null; };

export type CommitResult =
  | { status: 'committed'; externalId: string; confirmedAt: string; }
  | { status: 'accepted_pending_confirmation'; externalId: string; expectConfirmationWithinMs: number; }
  | { status: 'rejected'; code: AdapterErrorCode; message: string; retryable: false; }
  | { status: 'failed'; code: AdapterErrorCode; message: string; retryable: true; retryAfterMs: number | null; };

export type AdapterErrorCode =
  | 'AUTH_EXPIRED' | 'RATE_LIMITED' | 'SLOT_TAKEN' | 'ITEM_UNAVAILABLE'
  | 'PREPAYMENT_REQUIRED' | 'LOCATION_CLOSED' | 'VALIDATION_FAILED'
  | 'UPSTREAM_TIMEOUT' | 'UPSTREAM_5XX' | 'NOT_SUPPORTED' | 'UNKNOWN';

export interface HealthReport {
  healthy: boolean;
  checkedAt: string;
  latencyMs: number;
  degraded: Array<'availability' | 'catalog' | 'commit' | 'webhooks'>;
  message: string | null;
}

// ---------- the interface ----------------------------------------------------

export interface POSAdapter {
  readonly adapterId: string;
  readonly displayName: string;
  capabilities(auth: AdapterAuth): Promise<AdapterCapabilities>;
  getAvailability(auth: AdapterAuth, q: AvailabilityQuery): Promise<AvailabilitySlot[]>;
  getCatalog(auth: AdapterAuth, vertical: Vertical): Promise<CatalogItem[]>;
  commit(auth: AdapterAuth, payload: CommitPayload): Promise<CommitResult>;
  healthCheck(auth: AdapterAuth): Promise<HealthReport>;
}
```

`capabilities()` is a live call, not a static constant, because access is per-tenant. The same Toast adapter has `canCommitOrder = true` for a certified-partner tenant and `false` for a tenant on the standard-access path whose employee permission has lapsed.

### 8.2 Tier A — self-serve

| Vendor | Vertical | Why tier A | Key constraint |
|---|---|---|---|
| Square Appointments | Salon | Fully public reference covering availability search and appointment mutation, documented OAuth scopes, mature webhooks with a published 24-hour retry window and static source IPs 54.245.1.154 and 34.202.99.168. Onboarding is per-seller and self-service in the seller's own dashboard. | Rate limits are not published; Square staff state "we currently do not publicly disclose the rate limits" and expose `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` ([Square developer forum](https://developer.squareup.com/forums/t/current-square-api-rate-limit/449)); the canonical rate-limit doc returned a client error when fetched ([Square rate limits page](https://developer.squareup.com/docs/build-basics/general-considerations/rate-limits)). Sources: [Square Bookings API](https://developer.squareup.com/reference/square/bookings-api), [SearchAvailability](https://developer.squareup.com/reference/square/bookings-api/search-availability), [Onboard to the API](https://developer.squareup.com/docs/bookings-api/onboard-to-the-api), [Webhooks overview](https://developer.squareup.com/docs/webhooks/overview) |
| Zenoti | Salon | The salon itself mints the credential without vendor gatekeeping: Manage Applications then Generate API Key, with "Bot" as a first-class source-app type. Booking writes documented. | Published limits: "The standard applicable rate limit is 60 calls per minute", org bucket capacity 60, examples of 5,000 org calls per day and 400 calls per hour, headers `RateLimit-Limit`/`RateLimit-Remaining`/`RateLimit-Reset`/`Retry-After`, 429 on breach ([Zenoti rate limits](https://help.zenoti.com/en/zenoti-apis/api-rate-limits.html)). Sources: [Zenoti Service Booking APIs](https://docs.zenoti.com/docs/service-booking-apis), [Zenoti API key setup](https://help.zenoti.com/en/zenoti-apis/create-the-backend-app-and-generate-a-new-api-key.html) |
| Mindbody | Salon | Self-serve sandbox on signup; review only to flip live. Book and Update Appointment endpoints named; signed webhooks with `appointmentBooking.created/cancelled/updated` and `X-Mindbody-Signature`. | "There is a 1,000 call limit per day … Once this limit is reached, you will be charged one third of a cent for every call"; sandbox free ([Mindbody developer FAQs](https://developers.mindbodyonline.com/resources/faqs)). Sources: [Mindbody endpoints](https://developers.mindbodyonline.com/Resources/Endpoints), [Mindbody webhooks](https://developers.mindbodyonline.com/WebhooksDocumentation), [Mindbody developer tools](https://www.mindbodyonline.com/business/developer-tools) |
| Square for Restaurants | Restaurant | The only fully self-serve path in the restaurant matrix: create an app in the Developer Console, register a redirect URL, run the seller through `https://connect.squareup.com/oauth2/authorize`, exchange at `ObtainToken`. No approval step. Access tokens expire in 30 days; code-flow refresh tokens do not expire. | Prepaid constraint (section 7.4). Sources: [Square OAuth API](https://developer.squareup.com/docs/oauth-api/overview), [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does), [Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does) |
| Clover | Payments and distribution only | Self-serve sandbox and App Market distribution, with the only published developer revenue share in the salon matrix: "Developers receive 70% of the net subscription revenue" ([Clover dev home](https://docs.clover.com/dev/docs/home)); Clover states it has "disbursed close to $8 million in earnings to our developers to date" ([Clover developers](https://www.clover.com/developers)). Restaurant orders are genuinely supported: atomic order creation, then a payment record, then the Print API to fire it. | No appointments API was found on either fetched Clover developer page, so Clover is tier A for restaurant orders, payments and billing, and tier C for salon booking ([Clover developer documentation](https://docs.clover.com/dev/docs/developer-documentation)). App review is four-part and developers on Clover's own forum report approval "normally takes 9 plus weeks" ([Clover community](https://community.clover.com/questions/27693/why-does-it-take-so-long-to-get-approved-to-get-an.html)). Rate limits: 50 req/sec per app, 16 req/sec per token, concurrency 10 per app and 5 per token, 429 with `retry-after` ([Clover rate limits](https://docs.clover.com/dev/docs/api-usage-rate-limits)) |

### 8.3 Tier B — gated partner

Salon:

| Vendor | Gate | Consequence for Linh |
|---|---|---|
| Boulevard | "Only Enterprise tier customers have access to these APIs and custom apps" ([Boulevard Developer Portal](https://developers.joinblvd.com/)); "Available for Enterprise tier only" ([Boulevard API feature page](https://www.joinblvd.com/features/api)), on top of $140 to $328 per month per location ([Boulevard pricing](https://www.joinblvd.com/pricing)) | Best booking API in the set — GraphQL cart flow `createCart` → `addCartSelectedBookableItem` → `reserveCartBookableItems` → `checkoutCart` plus `appointmentReschedule` ([Boulevard booking guide](https://developers.joinblvd.com/2020-01/client-api/guides/booking-an-appointment/)) — and commercially unreachable for the SMB nail segment. Deferred. |
| Booksy | Partner credentials: `partner_uuid`, `partner_name`, key file and a signed JWT; docs on an `alpha.` subdomain implying pre-GA ([Booksy Public API](https://alpha.docs.booksy.net/v02.html)) | Schedule reads are concrete; no appointment write endpoint appeared on the fetched page. Language codes listed are da, de, en, es, fi, nb, pl, pt, ru — no Vietnamese. Read-only at best. |
| Phorest | Access by support ticket, and "the email must come from email address that is associated with your business in Phorest" ([Phorest getting started](https://developer.phorest.com/docs/getting-started)) | No webhooks at all: "The Phorest API does not currently support webhooks"; you must poll `updated_at`. `capabilities.requiresPolling = true`, `pollCursorField = 'updated_at'`. The `createbooking` reference page returned no extractable content, so write capability is unconfirmed ([Phorest createbooking](https://developer.phorest.com/reference/createbooking)). |
| Meevo | Request form then appId/appSecret in a Welcome package, with separate production credentials ([Meevo developer tools](https://www.meevo.com/developer-tools)) | Paid: "$49 per month (includes Daily Data Stream solution)" plus a "$199 startup fee" ([Meevo API docs](https://docs.meevoapi.com/)). Appointment mutation and event names are visible. It already hosts third-party AI concierges as partners ([Meevo partner integrations](https://www.meevo.com/partner-integrations)), which is a favorable precedent. |
| Vagaro | "Vagaro Webhooks and APIs are only available to businesses on the web version of Vagaro that use Credit Card Processing and are not in the free trial … contact our Enterprise Sales Team"; webhooks cost "$10 monthly, including 5,000 webhook calls", $0.002 per call beyond, max 10 webhooks, retry up to five times over 15 minutes, 2xx required within 20 seconds ([Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro)) | Read-plus-notify only. Documented operations are all GET, and Vagaro support states "currently, we do not have any API's for creating and/or updating appointment classes in Vagaro". `canCommitBooking = false`; Linh runs a parallel ledger and pushes the booking to the salon out of band. |
| Mangomint | A "Webhooks" help article exists ([Mangomint integrations help](https://www.mangomint.com/learn/help-articles/integrations/)) but no public developer docs, pricing or access process | Unverified. Requires direct vendor contact to classify. Modeled as tier B with all write capabilities false until confirmed. |

Restaurant:

| Vendor | Gate | Consequence for Linh |
|---|---|---|
| Toast | Eight stages: Application, Discovery, Partner agreement, Development kickoff, Certification with a one-hour interactive demo call, Alpha at one restaurant for one week, Beta at three to five locations over several weeks, then General availability ([Toast integration dev process](https://doc.toasttab.com/doc/devguide/integrationDevProcess.html)) | The largest prize at approximately 171,000 total locations as of 31 March 2026 ([Toast Q1 2026 results](https://www.nasdaq.com/press-release/toast-announces-first-quarter-2026-financial-results-2026-05-07)) and the best fit for pay-at-pickup because payments are optional. Interim: the standard-access path requires active employee status, Toast RMS Essentials or higher, and Manage Integrations permission ([Toast API access requirements](https://doc.toasttab.com/doc/devguide/devApiAccessRequirements.html)) — workable for a handful of design partners, not scalable. Rate limits: global 20 req/sec and 10,000 req per 15 minutes, `GET /menus` 1 req/sec/location, `GET /ordersBulk` 5 req/client/location/sec, 429 with `Retry-After` and `X-Toast-RateLimit-*`; auth no more than 2 token requests per hour ([Toast rate limiting](https://doc.toasttab.com/doc/devguide/apiRateLimiting.html), [Toast auth rate limit](https://doc.toasttab.com/doc/devguide/apiAuthenticationRateLimit.html)) |
| Otter | Six steps: sign-up form, API key plus staging, build, certification call against required event logs, phased onboarding (Pilot one location two clean consecutive weeks, then Early Adoption five more locations two clean weeks), then General Adoption ([Otter integrated partner process](https://helpdesk.tryotter.com/hc/en-us/articles/22695702216979-Integrated-Partner-Process)) | Critical path. The only documented API route into MenuSifu, supported in US and Canada ([Otter x MenuSifu](https://www.tryotter.com/integrations/menusifu)). `POST /v1/orders` rate limit is 32 requests per minute ([Otter API reference](https://developer-guides.tryotter.com/api-reference/)). OAuth 2.0 client credentials against `https://partners.tryotter.com` ([Otter quickstart](https://developer-guides-staging.tryotter.com/docs/guides-quickstart/)). Lifecycle ORDER_ACCEPTED → ORDER_READY_TO_PICK_UP → PREPARED → ORDER_HANDED_OFF → FULFILLED ([Otter order creation flow](https://developer-guides.tryotter.com/docs/orders-integrations-creation-flow/)). |
| ItsaCheckmate | Marketplace onboarding form then sandbox Developer Portal after approval ([Order Receivers program](https://openapi-itsacheckmate.readme.io/page/order-receivers)) | Best price-to-coverage ratio for the long tail: launched so that "innovators and startups" could build one integration and reach 50-plus POS systems and 20,000-plus locations ([ItsaCheckmate Marketplace launch](https://www.globenewswire.com/news-release/2022/11/15/2556195/0/en/ItsaCheckmate-launches-Marketplace-a-next-generation-open-API-platform.html)). Call order is fixed: `POST /oauth/token`, then `GET /api/v2/activate` must be first, then `GET /api/v2/get_location`, `GET /api/v2/menu/:order_source`, `POST /api/v2/orders/:order_source`. Sandbox `https://sandbox-api.itsacheckmate.com`; tokens 24h default ([API collection](https://raw.githubusercontent.com/api-evangelist/itsacheckmate/main/collections/itsacheckmate-marketplace-api.opencollection.json)). |
| Deliverect | "Become a partner to gain access to our APIs"; the channel build has eight required components and "You will receive access to our Production environment once your integration is certified by our API team" ([Deliverect channel integration](https://developers.deliverect.com/docs/building-a-channel-integration-overview), [Deliverect environments](https://developers.deliverect.com/docs/staging-and-production-environment)) | Only documented route to Chowbus POS ([Deliverect x Chowbus](https://www.deliverect.com/en-us/integrations/chowbus-pos)) and the only major aggregator supporting `isPrepaid=false`. Cancel by resending the same `channelOrderId` with `"status": 100`; orderType 1 pickup, 2 delivery, 3 eat-in, 4 curbside, 5 drive-thru ([Deliverect create channel order](https://developers.deliverect.com/v3.0/reference/create-channel-order)). Competitive note: Deliverect has partnered with SoundHound on automated restaurant voice ordering ([PR via Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/deliverect-soundhound-ai-partner-turn-123000067.html)). |
| Chowly | No public developer portal; per-location API key ([apis.io Chowly, non-authoritative](https://apis.io/apis/chowly/orders/)) | 17,000-plus locations and 50-plus POS integrations including Toast, Square, SpotOn, Clover, Aloha and Lightspeed ([Chowly](https://chowly.com/), [Chowly partnerships](https://chowly.com/partnerships/)), but the least accessible of the four SMB aggregators. Deferred. |
| SpotOn | "SpotOn OAuth (Merchant Self-serve Partner Authorization)" plus Menus READ and Order WRITE scopes and webhooks ([SpotOn getting started](https://developers.spoton.com/central-api/docs/getting-started)) | Access is nearly self-serve, but the fully-paid CLOSED-orders-only constraint puts it out of the launch posture. Opportunistic. |
| Lightspeed | K-Series requires partner integration with webhook registration; U-Series "enables select partners", requires the partner to supply its own iPad, and publishes 100 requests per second per API key ([Upserve/U-Series API docs](https://api-docs.upserve.com/olo/)) | K-Series is the usable one because unpaid orders are allowed. Async confirmation is mandatory. |

### 8.4 Tier C — standalone and parallel ledger

Zota POS, Tilavon, SICUS Booking, Vinail, Viet Nails / iNailPOS, SalonTouch Studio, GlossGenius, Fresha, DaySmart Salon, Rosy Salon Software. None published any developer documentation, endpoint, credential process or webhook specification on any page fetched. Specifically: Tilavon's only integration route is "Our Elite plan includes custom integrations … Contact our sales team" ([Tilavon integrations](https://tilavon.com/integrations)); Zota's is agent-mediated ([Zota Check-in](https://zotaservices.com/zota-check-in/)); SICUS builds on other vendors' APIs rather than exposing its own ([SICUS products](https://www.sicusmedia.com/products/)); Fresha publishes only a Snowflake analytics replica ([Fresha Data Connector KB](https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools)).

Tier C is not a failure state. It is the default state of the founder's actual target market, and the parallel-ledger design is what makes it shippable.

Parallel-ledger design:

1. Linh owns the booking or order record outright. `pos_sync.enabled = false`, `pos_adapters.tier = 'C'`.
2. Availability is computed entirely from Linh's own `technicians`, `availability_blocks` and `bookings`. The owner must maintain shifts in Linh. This is the one real cost of tier C and it is disclosed at onboarding.
3. Push channels, in preference order and all supported simultaneously: (a) SMS ticket to the shop phone with the full booking or order in the owner's language; (b) a thermal print via the shop's existing receipt printer where one is reachable; (c) the Linh dashboard "Today" board, which the front desk keeps open.
4. Reconciliation is manual and structured, not aspirational. The owner marks each pushed item `entered_in_pos`, `walked_in`, `no_show` or `cancelled` from the dashboard or by replying to the SMS with a number. Unreconciled items older than 24 hours appear at the top of the next morning brief.
5. Double-book risk is managed by shrinking the exposure window: Linh only writes bookings into slots it created, never into slots it cannot see, and it caps concurrent unreconciled tier-C bookings per technician per day at a tenant-configurable number, default 6.

### 8.5 Tier C vendors that are competitors, not integration targets

Tilavon, SICUS, Vinail and GlossGenius all ship their own AI phone receptionist, and so does Fresha:

- Tilavon: "Tilavon AI Assistant … AI-powered chatbot and voice assistant for your salon website and phone line" ([Tilavon integrations](https://tilavon.com/integrations)), four languages including Vietnamese with "native Vietnamese language support" ([Tilavon features](https://tilavon.com/features)).
- SICUS: "A 24/7 AI phone receptionist", "Bilingual EN/VI", sold standalone ([SICUS AI Receptionist](https://sicusmedia.com/products/ai-receptionist.html)).
- Vinail: "an AI receptionist that answers the phone and books appointments … in Vietnamese, German and English" ([Vinail EN](https://vinail.net/en/nail-salon-software-for-vietnamese)).
- GlossGenius: "Reception by Genius AI … answers every call and text 24/7", "Books and reschedules directly on your calendar using real-time availability", "collects deposits for you" ([GlossGenius Reception](https://glossgenius.com/reception)).
- Fresha: "AI Concierge … It books or reschedules appointments directly in your calendar" ([Fresha AI Concierge KB](https://www.fresha.com/help-center/knowledge-base/calendar/101702-ai-concierge-overview)).
- Zenoti also ships a first-party competitor: "AI Receptionist … handles every call your front desk misses" ([Zenoti AI Receptionist](https://www.zenoti.com/ai-workforce/ai-receptionist)), which is a reason to treat the Zenoti integration as tactical rather than strategic.

What that means for GTM: these vendors will not partner and will not send leads. They must be displaced at the salon, not partnered with at the vendor. The displacement argument is concrete rather than rhetorical: none of them publishes state-aware consent, none publishes a Vietnamese-language legal document, none wires rotation to the phone agent, and none spans both verticals. Sell against the compliance surface, not against the feature list, because on features Tilavon and Bukkii are close.

Non-competing tier C vendors — Zota, iNailPOS/ATSoft, SalonTouch, DaySmart, Rosy — are neutral parallel-ledger territory and are the friendliest tier C accounts to sell into. Zota in particular, with "5000+ Salons" ([Zota Check-in](https://zotaservices.com/zota-check-in/)) and no AI receptionist on any fetched page, is the single largest neutral installed base in the Vietnamese nail market.

### 8.6 Partner economics, where published

| Vendor | Published economics | Source |
|---|---|---|
| Clover | "App royalties are 70%" — developers receive 70% of net subscription revenue; distribution and billing through the Clover App Market | [Clover developers](https://www.clover.com/developers), [Clover dev home](https://docs.clover.com/dev/docs/home) |
| ItsaCheckmate | Merchant price $85 per store per month for up to two delivery providers, $100 per store unlimited, no setup fee, month-to-month, 14-day trial, $100 refundable deposit; reselling dealer receives 15% of the billed monthly price per location | [Heartland dealer guide](https://pos.heartlandpaymentsystems.com/kb/kb_upload/file/ItsaCheckmate%20Third-Party%20Integration%20Master%20Dealer%20Guide.pdf), [Checkmate pricing](https://support.itsacheckmate.com/hc/en-us/articles/8105450179867-Checkmate-Pricing) |
| Meevo | $49 per month including Daily Data Stream, plus a $199 startup fee | [Meevo API docs](https://docs.meevoapi.com/) |
| Fresha | Data Connector at $295 per location per month — read-only Snowflake replica, no write path | [Fresha pricing](https://www.fresha.com/pricing), [Fresha Data Connector KB](https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools) |
| Vagaro | Webhooks $10 per month including 5,000 calls, $0.002 per call beyond | [Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro) |
| Mindbody | 1,000 calls per day free, then one third of a cent per call; sandbox free; "Earn a $1,000 gift card when your clients join Mindbody" | [Mindbody developer FAQs](https://developers.mindbodyonline.com/resources/faqs), [Mindbody developer tools](https://www.mindbodyonline.com/business/developer-tools) |
| Cuboh | Merchant price $119 / $169 / $229 per month by volume; Square's UK marketplace lists $80.00 to $240.00 per month | [Cuboh pricing](https://www.cuboh.com/pricing), [Square partner apps](https://squareup.com/gb/en/point-of-sale/restaurants/integrations) |
| Toast, Otter, Deliverect, Chowly | Nothing published. Toast notes only that some integrations are free and others "require an additional fee" ([Toast platform guide](https://doc.toasttab.com/doc/platformguide/adminRestaurantServiceIntegrationsAndToastPartnerIntegrations.html)). A secondary blog reports a 2019 figure of 30% revenue share plus $500 per referred lead ([DirectOrders](https://www.directorders.com/blog/toast-partner-api-restaurant-guide)) — dated and unverified; ask Toast in Discovery. | |
| Square | No published integration fee or revenue share on the fetched developer or restaurant-partnership pages | [Square Restaurants partnerships](https://squareup.com/us/en/point-of-sale/restaurants/integrations) |

Two structural notes. Otter is the only documented route to MenuSifu, which has 15,000-plus active restaurants ([MenuSifu About](https://www.menusifu.com/about-us)) — and because Mealkeyway is MenuSifu's own online-ordering arm founded by MenuSifu in 2015 ([MealKeyway About](https://www.mealkeyway.online/form)), one Otter integration plausibly addresses both. Deliverect is the only certified route to Chowbus ([Deliverect x Chowbus](https://www.deliverect.com/en-us/integrations/chowbus-pos)). And no POS in either matrix documents Vietnamese as a supported UI language.

### 8.7 Rate limits, retry, idempotency and reconciliation

Rate-limit and retry table:

| Adapter | Published limit | Retry policy in Linh |
|---|---|---|
| Square (bookings and orders) | Not published; honor `X-RateLimit-*` headers ([Square developer forum](https://developer.squareup.com/forums/t/current-square-api-rate-limit/449)) | Token bucket seeded at 5 rps, adaptive on header feedback; exponential backoff 250 ms base, jitter, 4 attempts |
| Zenoti | 60 calls per minute, bucket capacity 60; `Retry-After` on 429 ([Zenoti rate limits](https://help.zenoti.com/en/zenoti-apis/api-rate-limits.html)) | Hard bucket at 1 rps per tenant; obey `Retry-After` verbatim; 3 attempts |
| Mindbody | 1,000 calls per day then billed; per-endpoint limits differ ([Mindbody FAQs](https://developers.mindbodyonline.com/resources/faqs)) | Daily budget guard at 800; availability cache TTL raised to 120 s outside active calls |
| Toast | 20 req/sec and 10,000 per 15 min globally; `GET /menus` 1 req/sec/location; `GET /ordersBulk` 5 req/client/location/sec; auth max 2 token requests/hour ([Toast rate limiting](https://doc.toasttab.com/doc/devguide/apiRateLimiting.html), [Toast auth rate limit](https://doc.toasttab.com/doc/devguide/apiAuthenticationRateLimit.html)) | Per-location menu fetch scheduled, never on-demand; auth token cached with a 45-minute refresh floor |
| Clover | 50 req/sec per app, 16 req/sec per token, concurrency 10 per app and 5 per token; 429 with `retry-after` ([Clover rate limits](https://docs.clover.com/dev/docs/api-usage-rate-limits)) | Per-token semaphore of 4; obey `retry-after` |
| Otter | `POST /v1/orders` 32 requests per minute ([Otter API reference](https://developer-guides.tryotter.com/api-reference/)) | Global queue at 24 per minute with per-tenant fairness; overflow goes to fallback ticket rather than waiting |
| Lightspeed U-Series | 100 requests per second per API key ([Upserve/U-Series API docs](https://api-docs.upserve.com/olo/)) | Not used at launch |
| Phorest | None published; no webhooks, poll `updated_at` ([Phorest getting started](https://developer.phorest.com/docs/getting-started)) | Poll at `pos_sync.poll_interval_seconds`, floor 60 s idle and 20 s during an active call |
| Vagaro webhooks | Max 10 webhooks; retry up to five times over 15 minutes; must return 2xx within 20 seconds ([Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro)) | Webhook receiver returns 200 immediately and processes async; hard 5-second internal budget |
| ItsaCheckmate | None published; `GET /api/v2/activate` must be the first call and the location must be verified ([API collection](https://raw.githubusercontent.com/api-evangelist/itsacheckmate/main/collections/itsacheckmate-marketplace-api.opencollection.json)) | Activate-once cached per location with a 24-hour re-check tied to token expiry |
| Deliverect | None published | Conservative 2 rps default until measured |

Idempotency:

- `idempotencyKey = sha256(business_id || call_id || intent || canonical_payload_json)`. It is stable across retries of the same logical action and different across a genuine second booking in the same call.
- The key is stored on the `bookings` or `orders` row before the adapter call, with a unique index. A duplicate insert short-circuits to the existing row.
- Adapter-specific external uniqueness is also populated: Toast requires `externalId` to be unique ([Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html)); Lightspeed K-Series requires a unique `thirdPartyReference` ([Lightspeed K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial)); Deliverect cancels by resending the same `channelOrderId` with `"status": 100` ([Deliverect create channel order](https://developers.deliverect.com/v3.0/reference/create-channel-order)).
- A `failed` result with `retryable = true` is retried against the same key. A `rejected` result is never retried.

Reconciliation and double-booking rules:

| Situation | Rule |
|---|---|
| Adapter reports the slot taken between `getAvailability` and `commit` | Linh does not write the booking. The agent immediately offers the next two slots. `pos_sync_log` records `SLOT_TAKEN`. This is the reason the availability cache is re-validated within 45 seconds of commit. |
| Linh wrote the booking, adapter commit failed non-retryably, tier A or B | Booking is held at `pending`, owner is alerted within 60 seconds, and the caller receives the confirmation SMS only after the owner resolves. Never confirm to a caller what the POS rejected. |
| Linh wrote the booking, adapter commit failed retryably | Booking is `confirmed` in Linh, `pos_sync_log.status = 'pending_retry'`, retried with backoff for up to 30 minutes, then escalated as a fallback ticket. |
| POS webhook reports a booking Linh does not know about | Insert as an external booking with `source = 'pos'`. It participates in availability but never in rotation credit unless the owner links it to a technician. |
| POS and Linh disagree on a booking's time | `pos_sync.conflict_policy` decides. Default `manual_review`: both versions are shown side by side in the dashboard with a one-tap resolution. `pos_wins` and `linh_wins` are available but the default is deliberately human, because an automatic overwrite of a salon calendar is unrecoverable. |
| Tier C, two bookings created for the same technician-minute | Impossible by construction: Linh is the only writer. The residual risk is a walk-in the front desk seated without telling Linh, which is what the unreconciled-item alert exists to surface. |
| Same caller books twice in one call | Second `book_appointment` with a different `slot_start` produces a different idempotency key and is allowed. The agent reads back both. |

---

## 9. Compliance requirements (P0)

This section is audit-grade. Every runtime behavior below is traceable to a statute, a regulation, or a standards-body document.

### 9.1 Recording consent by state

| State | Rule | Statute and source | Penalty | Linh runtime behavior |
|---|---|---|---|---|
| Maryland | ALL-PARTY. § 10-402(c)(3) permits interception only where "all of the parties to the communication have given prior consent to the interception." | [Md. Cts. & Jud. Proc. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/) | Felony, up to 5 years and/or $10,000 under § 10-402(b); mandatory civil fine of not less than $500 under § 10-402(f)(2)(ii) | Affirmative consent gate. Recording starts before the disclosure; audio is destroyed if consent is declined. |
| California | ALL-PARTY for confidential communications. | [Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632) | Up to $2,500 per violation and/or 1 year, $10,000 per violation for repeat offenders; civil: greater of $5,000 per violation or 3x actual damages with no actual damages required ([Cal. Penal Code § 637.2](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2)) | Affirmative consent gate. This is the single largest class-action exposure in the product. |
| Florida | ALL-PARTY. § 934.03(2)(d). | [Fla. Stat. § 934.03](https://law.justia.com/codes/florida/title-xlvii/chapter-934/section-934-03/) | Third-degree felony under § 934.03(4)(a) | Affirmative consent gate. |
| Washington | ALL-PARTY. RCW 9.73.030(1)(a). Consent is deemed obtained when one party announces to all other parties, in any reasonably effective manner, that the communication is about to be recorded — and the announcement itself must be recorded at the beginning of the recording, per RCW 9.73.030(3). | [RCW 9.73.030](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030) | Gross misdemeanor ([RCW 9.73.080](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.080)); civil actual damages or liquidated $100 per day capped at $1,000, plus attorney fees ([RCW 9.73.060](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.060)) | Recording MUST start before the disclosure plays, so the announcement is inside the recording. This is the constraint that fixes the ordering for every state. |
| Virginia | ONE-PARTY. Lawful "where such person is a party to the communication or one of the parties … has given prior consent." | [Va. Code § 19.2-62](https://law.lis.virginia.gov/vacode/title19.2/chapter6/section19.2-62/) | Class 6 felony | Announcement plays anyway. Linh does not run a one-party mode. |
| District of Columbia | ONE-PARTY. § 23-542(b)(3). | [D.C. Code § 23-542](https://code.dccouncil.gov/us/dc/council/code/sections/23-542) | Fine and/or up to 5 years | Announcement plays anyway. |
| Texas | ONE-PARTY. § 16.02(c)(4). | [Tex. Penal Code § 16.02](https://law.justia.com/codes/texas/penal-code/title-4/chapter-16/section-16-02/) | Second-degree felony under § 16.02(f) | Announcement plays anyway. |
| Georgia | ONE-PARTY. § 16-11-66(a). | [O.C.G.A. § 16-11-66](https://law.justia.com/codes/georgia/title-16/chapter-11/article-3/part-1/section-16-11-66/) | Felony, 1 to 5 years and/or up to $10,000 ([O.C.G.A. § 16-11-69](https://law.justia.com/codes/georgia/title-16/chapter-11/article-3/part-1/section-16-11-69/)) | Announcement plays anyway. |

Four of the eight target jurisdictions are all-party, and one of them is home base. There is no commercially sensible one-party mode, so Linh is architected all-party-by-default everywhere. Maryland remains all-party as of this research; a House Judiciary Committee briefing on changing Maryland's recording-consent and evidence laws was held in November 2025 with the bill not taken up until the January 2026 session ([WYPR, 20 November 2025](https://www.wypr.org/wypr-news/2025-11-20/maryland-considers-altering-its-recording-consent-and-evidence-laws)). ASSUMPTION: no 2026 Maryland session bill amending § 10-402 has been enacted; this must be re-verified on mgaleg.maryland.gov before launch and is tracked as OQ-1.

State inference:

```
resolveConsentPosture(ani, businessState):
    callerState = areaCodeToState(ani)            // NANP area code table, cached
    if callerState is null      -> posture = ALL_PARTY   // default deny
    if ani is blocked/withheld  -> posture = ALL_PARTY
    if ani is non-NANP          -> posture = ALL_PARTY
    if isAllParty(callerState) or isAllParty(businessState) -> posture = ALL_PARTY
    else -> posture = ONE_PARTY_ANNOUNCEMENT
```

Area-code inference is imperfect — a Maryland number can be answered in Texas — which is precisely why the unknown case defaults to all-party and why the announcement plays in every state regardless of posture. My AI Front Desk is the benchmark for the artifact set, capturing `disclosure_played`, `consent_response` with values accepted, declined or announcement_only, `recording_start`, `call_id` and `disclosure_version` ([My AI Front Desk call recording consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent)), and it explicitly makes the operator configure consent mode per number or per location. Linh derives it instead, and adds the field none of the five can produce: `disclosure_language`.

`consent_events` audit fields, all mandatory: `call_id`, `business_id`, `ani_e164`, `inferred_state`, `posture`, `disclosure_version`, `disclosure_language`, `disclosure_played_at`, `disclosure_completed`, `consent_response`, `recording_started_at`, `recording_deleted_at`.

### 9.2 AI identity disclosure

FCC Declaratory Ruling FCC 24-17, CG Docket 23-362, adopted 2 February 2024 and released 8 February 2024, holds that calls using AI technologies that generate human voices are "artificial" under § 227(b)(1)(A)(iii), so prior express consent is required and TCPA identification obligations apply ([FCC-24-17A1](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf), [FCC announcement](https://www.fcc.gov/document/fcc-confirms-tcpa-applies-ai-technologies-generate-human-voices)).

The FCC's August 2024 NPRM, FCC 24-84, proposes an AI-generated-call definition that covers only outbound calls and expressly exempts technologies used to answer inbound calls, such as virtual customer service agents ([FCC-24-84A1](https://docs.fcc.gov/public/attachments/FCC-24-84A1.pdf), [Wiley alert](https://www.wiley.law/alert-FCC-Proposes-New-Rules-for-AI-Generated-Calls-and-Texts)). Comments were due 10 October 2024 and replies 25 October 2024; it remains a proposal, not a rule ([FCC comment deadlines notice](https://www.fcc.gov/consumer-governmental-affairs/comment-deadlines-established-ai-generated-robocall-rules)).

No currently enacted law in MD, VA or DC unambiguously forces an AI-identity disclosure on an inbound business line. Maryland's enacted AI statutes are narrow and none reaches this product ([Maryland official AI legislation list](https://ai.maryland.gov/ai-maryland/legislation)); Virginia's HB 2094 was vetoed on 24 March 2025 ([Ogletree](https://ogletree.com/insights-resources/blog-posts/virginia-governor-vetoes-artificial-intelligence-bill-hb-2094-what-the-veto-means-for-businesses/)). California's B.O.T. Act defines a bot as an automated online account and "online" as a public-facing website or application, so a phone call is arguably outside its scope — but § 17943(a)(2) sets the audio standard we adopt anyway: clear and conspicuous means spoken in a clearly audible and intelligible manner at the beginning of the communication ([Cal. BPC Div. 7 Pt. 3 Ch. 6](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=7.&title=&part=3.&chapter=6.&article)). Utah's safe harbor removes enforcement risk where the GenAI clearly and conspicuously discloses at the outset and throughout that it is generative AI and not human ([Utah SB 226 enrolled](https://le.utah.gov/Session/2025/bills/enrolled/SB0226.pdf), [Davis Polk](https://www.davispolk.com/insights/client-update/utah-scales-back-reach-generative-ai-consumer-protection-law)). Colorado's ADMTA, effective 1 January 2027, requires notice when users interact with AI, with penalties up to $20,000 per violation and a 60-day cure ([Colorado AG AI page](https://coag.gov/ai/), [Skadden](https://www.skadden.com/insights/publications/2026/06/colorado-repeals-and-replaces-its-ai-act)).

Decision: mandatory, non-disableable, bilingual AI self-identification on every inbound call. We do the opposite of PolyAI, which ships a default-on guardrail — "AI Identity and Confidentiality — Prevents the agent from disclosing which LLM, provider, or platform powers it" ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)) — and the opposite of Goodcall, whose own template greeting hides behind "I'm a smartphone assistant who can think" ([Goodcall greeting KB](https://help.goodcall.com/en/articles/8348837-how-to-create-the-perfect-greeting-for-your-ai-assistant)) while its homepage advises operators that "it's always important to disclose to customers that they are speaking with an AI" ([goodcall.com](https://www.goodcall.com/)).

The agent also answers "are you a real person?" truthfully and immediately, in either language, which is what Utah's reactive disclosure rule requires of a supplier using GenAI in a consumer transaction ([Utah SB 226 enrolled](https://le.utah.gov/Session/2025/bills/enrolled/SB0226.pdf)).

### 9.3 TCPA and outbound

| Item | Rule | Source |
|---|---|---|
| Statutory damages | $500 per violation or actual loss, whichever is greater; trebled to $1,500 for willful or knowing violations, 47 U.S.C. § 227(b)(3) | [47 U.S.C. § 227](https://www.law.cornell.edu/uscode/text/47/227) |
| One-to-one consent | Vacated. Insurance Marketing Coalition Ltd. v. FCC, No. 24-10277 (11th Cir., decided 24 January 2025) vacated Part III.D of the FCC's 2023 Order | [Eleventh Circuit opinion](https://media.ca11.uscourts.gov/opinions/pub/files/202410277.pdf), [Mintz](https://www.mintz.com/insights-center/viewpoints/2776/2025-05-02-telephone-and-texting-compliance-news-litigation-update), [JD Supra](https://www.jdsupra.com/legalnews/fcc-repeals-one-to-one-consent-rule-1730983/) |
| Revocation | Any reasonable method; per-se reasonable includes replying with stop, quit, end, revoke, opt out, cancel or unsubscribe; honor within a reasonable time not to exceed 10 business days; the caller may not designate an exclusive means. In effect since 11 April 2025. | [47 CFR 64.1200(a)(10)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) |
| Revoke-all | Extended to 31 January 2027 by FCC CGB Order DA 26-12, released 6 January 2026 | [Consumer Financial Services Law Monitor](https://www.consumerfinancialserviceslawmonitor.com/2026/01/fcc-further-extends-effective-date-for-tcpa-revoke-all-rule/), [Burr and Forman](https://www.burr.com/telephone-consumer-protection-act/the-fcc-delays-effective-date-of-tcpa-revoke-all-rule-until-january-31-2027) |
| Confirmation text | A single confirmation is presumed within the original consent if sent within 5 minutes of the opt-out request, § 64.1200(a)(12) | [47 CFR 64.1200](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) |
| Quiet hours | No telephone solicitation to a residential subscriber before 8:00 a.m. or after 9:00 p.m., local time at the called party's location, § 64.1200(c)(1) | [47 CFR 64.1200](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) |
| Internal DNC | Written policy, honor requests within 30 days, retain records 5 years, § 64.1200(d) | [47 CFR 64.1200](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) |
| Consent records | CTIA § 5.1.2 requires retaining timestamp, medium and method of opt-in, capture of the opt-in experience, the campaign, IP address, phone number and identity. § 5.1.2.2: consent is not transferable — it applies only to the specific campaign and sender. | [CTIA Messaging Principles and Best Practices](https://api.ctia.org/wp-content/uploads/2019/07/190719-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf) |

Linh builds to revoke-all now. It is one boolean per contact and it removes the 2027 cliff. Consent is scoped per tenant and per campaign; a salon's customer list is never reused across tenants, which the CTIA non-transferability rule requires. Quiet hours are applied to all outbound SMS including transactional reminders, which is stricter than the rule requires and is the safest engineering posture.

### 9.4 A2P 10DLC

Register as a Standard brand, not Sole Proprietor. Sole Proprietor is capped at one phone number and 2.25 MPS total and cannot scale past a handful of tenants ([Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio)).

| Item | Value | Source |
|---|---|---|
| Standard brand one-time fee | $44 | [Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio) |
| Campaign vetting | $15, applicable since 26 January 2023 | [Twilio A2P Campaign Vetting FAQ](https://support.twilio.com/hc/en-us/articles/11587910480155-A2P-10DLC-Campaign-Vetting-FAQ) |
| Monthly per campaign | $1.50 to $10 | [Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio) |
| Secondary vetting | $40, non-refundable, Standard brands only | [Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio) |
| Throughput | Trust Score 75 to 100 gives 225 MPS total; 50 to 74 gives 120; 1 to 49 gives 12 | [Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio) |
| Timing | Brand registration minutes to 24 hours; secondary vetting up to 7 days; campaign review currently up to 10 business days | [Twilio: What is A2P 10DLC](https://help.twilio.com/articles/1260800720410-What-is-A2P-10DLC-) |
| Failure mode | Error 30034, "US A2P 10DLC – Message from an Unregistered Number". Twilio blocks messages from a +1 10DLC number not associated with an approved campaign, including when the number is not in the Sender Pool of the linked Messaging Service. | [Twilio error 30034](https://www.twilio.com/docs/api/errors/30034) |

Per-message carrier pass-through, from [Twilio US SMS pricing](https://www.twilio.com/en-us/sms/pricing/us): AT&T $0.0035 out, T-Mobile $0.0045 out, Verizon $0.0045 out, US Cellular $0.0050 out, all other carriers $0.0040 out.

Product consequence: the `sms_reminders` flag cannot be turned on until `a2p_campaign_id` is in the approved state and the sending number is in the sender pool. That is the validation rule in section 4.4, and its bilingual error text names error 30034 so the owner can search for it.

### 9.5 PCI DSS

Restated as a hard architectural boundary rather than a policy: the agent never captures spoken card numbers.

| Rule | Requirement | Source |
|---|---|---|
| Spoken card data expands scope | "Accepting spoken account data over the telephone puts personnel, the technology used, and the infrastructure to which that technology is connected into scope of PCI DSS." | [PCI SSC, Protecting Telephone-Based Payment Card Data v3.0](https://www.pcisecuritystandards.org/documents/Protecting_Telephone_Based_Payment_Card_Data_v3-0_nov_2018.pdf) |
| Digital audio recording of CVV is prohibited | "It is a violation of PCI DSS Requirement 3.2 to store any sensitive authentication data, including card validation codes and values, after authorization even if encrypted. It is therefore prohibited to use any form of digital audio recording." | [PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf) |
| Pause and resume is not compliant | Manual pause and resume fails because agents forget; SAD must be removed automatically with no manual intervention | [Sycurio fact sheet citing the PCI SSC supplement](https://cdn.asp.events/CLIENT_ROAR_Eve_16F4C528_E03F_0401_6D78CA8E12A9EF6E/sites/CCCE-2023/media/libraries/exhibitor-documents/36160-Sycurio-Pause&Resume-Fact-Sheet-UK-May-22.pdf) |
| No CVV for card on file | PCI DSS "prohibits storage of card verification codes, for example, after transaction authorization or to facilitate potential future transactions." | [PCI SSC FAQ 1574](https://www.pcisecuritystandards.org/faqs/1574/) |
| Target SAQ | Stripe Checkout, Payment Links and Elements are SAQ A because they host card inputs "within an iframe served from Stripe's domain, not yours". Direct API card handling is SAQ D. | [Stripe PCI compliance guide](https://stripe.com/guides/pci-compliance) |

Runtime controls:

1. No `collect_card` tool exists in any tool list, in any module configuration. The capability is absent, not discouraged.
2. Streaming PAN detector on the live transcript: a sliding regex plus Luhn check over digit runs of 13 to 19. On a hit, the transcript segment is replaced with `[REDACTED-PAN]` before persistence, the corresponding audio window is excluded from the stored recording, and the agent emits the refusal string from section 6.7.
3. CVV heuristic: a 3 or 4 digit run within 15 seconds of a PAN hit or of the words cvv, security code, mã bảo mật is redacted on the same path.
4. DTMF is not used for payment. If DTMF is ever introduced, digit suppression at the media layer is a precondition, not a follow-up.
5. Annual SAQ A attestation is a launch-blocking checklist item.

Note that PCI DSS v4.0's future-dated requirements ceased to be best practices on 31 March 2025 and are now validated in every assessment ([PCI SSC guidance](https://blog.pcisecuritystandards.org/coffee-with-the-council-podcast-guidance-for-pci-dss-e-commerce-requirements-effective-after-31-march-2025)), including MFA for all access to the cardholder data environment under Req. 8.4.2 and passwords of at least 12 characters under Req. 8.3.6 ([EIC Secure](https://www.eicsecure.com/blog/pci-dss-v4)).

### 9.6 State privacy law

MODPA is the binding one, because Maryland is home base.

| Item | Value | Source |
|---|---|---|
| Effective | 1 October 2025 (SB 541 (2024), Chapter 455) | [mgaleg SB0541](https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/sb0541?ys=2024RS) |
| Enforcement start | 1 April 2026. MODPA "does not apply to any personal data processing before April 1, 2026" | [OneTrust](https://www.onetrust.com/blog/marylands-online-data-privacy-act-modpa-key-rules-and-requirements/) |
| Threshold | 35,000 Maryland consumers, excluding data processed solely to complete a payment transaction; or 10,000 plus more than 20% of gross revenue from the sale of personal data | [Maryland AG data privacy](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx) |
| Penalties | Up to $10,000 per violation; up to $25,000 for each subsequent violation. No private right of action. | [Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx), [McNees](https://www.mcneeslaw.com/maryland-data-privacy-law/) |
| Cure | AG discretion, 60 days, for violations on or before 1 April 2027, then sunsets | [Cooley](https://www.cooley.com/news/insight/2025/2025-09-09-marylands-unique-state-privacy-law-takes-effect-october-1--what-you-should-know) |
| Sensitive data | May not be sold at all; may be collected, processed or shared only where strictly necessary to provide or maintain a specific product or service requested by the consumer | [Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx) |
| Processors | Service providers that handle data on behalf of covered businesses are also directly subject. Linh's tenants are controllers; Linh is a processor and is directly regulated. | [Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx) |
| No HIPAA entity exemption | No entity-level HIPAA exemption and no general nonprofit exemption | [Cooley](https://www.cooley.com/news/insight/2025/2025-09-09-marylands-unique-state-privacy-law-takes-effect-october-1--what-you-should-know) |
| Consumer health data | Sensitive data; requires a documented data protection assessment that includes an assessment of any algorithm used to assess the data | [Moore and Van Allen](https://www.mvalaw.com/data-points/getting-ready-for-marylands-online-data-privacy-act-a-new-trendsetter) |
| Opt-out signals | Must honor Global Privacy Control | [Moore and Van Allen](https://www.mvalaw.com/data-points/getting-ready-for-marylands-online-data-privacy-act-a-new-trendsetter) |

TDPSA is the sleeper. Tex. Bus. and Com. Code § 541.002(a) applies to a person that conducts business in Texas or produces a product or service consumed by Texas residents, processes or sells personal data, and is not an SBA small business — with no revenue or data-volume threshold at all ([Tex. Bus. and Com. Code § 541.002](https://texas.public.law/statutes/tex._bus._and_com._code_section_541.002), [Texas State Law Library](https://www.sll.texas.gov/spotlight/2024/07/texas-data-privacy-and-security-act/)). Even as an SBA small business, § 541.107(a) still bars selling sensitive personal data without prior consent.

Not applicable at launch: CCPA, whose revenue threshold is CPI-adjusted to $26,625,000 effective 1 January 2025 ([CPPA CPI adjustment](https://cppa.ca.gov/regulations/cpi_adjustment.html)); and VCDPA at 100,000 Virginia consumers ([TDPSA vs VCDPA comparison quoting § 59.1-572](https://www.tab.org/public/upload/files/misc/Texas_Data_Privacy_and_Security_Act_vs._Virginia_.pdf)). Both are threshold monitors, not launch blockers.

### 9.7 Biometrics — a hard architectural prohibition

Linh never enables speaker recognition, voice enrollment, or voiceprint matching. Not as a default, not as an enterprise option, not on a roadmap.

| Law | Coverage and exposure | Source |
|---|---|---|
| Illinois BIPA, 740 ILCS 14 | Regulates biometric identifiers expressly including voiceprints. Private right of action; up to $1,000 per negligent violation and up to $5,000 per reckless or intentional violation, plus fees. SB 2979 (Aug 2024) made repeated collection by the same method a single violation, and the Seventh Circuit held in Clay v. Union Pacific (1 April 2026) that the amendment applies retroactively. | [Sidley Data Matters](https://datamatters.sidley.com/2026/04/08/seventh-circuit-limits-potential-damages-under-bipa-holds-2024-amendment-applies-retroactively/) |
| Texas CUBI, Tex. Bus. and Com. Code § 503.001 | Biometric identifier includes voiceprint. May not capture for a commercial purpose without informing the individual beforehand and receiving consent; must destroy within a reasonable time and not later than the first anniversary of the date the collection purpose expires. Civil penalty not more than $25,000 for each violation, AG-enforced. | [Tex. Bus. and Com. Code § 503.001](https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001) |
| Washington My Health My Data, RCW ch. 19.373 | Consumer health data is defined very broadly and includes bodily functions and biometric information. Violation is a per se Washington Consumer Protection Act violation with a private right of action. | [Washington AG MHMD FAQ](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy), [Goodwin](https://www.goodwinlaw.com/en/insights/publications/2024/03/alerts-technology-hltc-my-health-my-data-act-mhmda) |

Why this bites a nail salon specifically: a caller who says "I need a pedicure but I have toenail fungus" or "I am pregnant so no acrylics" has produced consumer health data. Under MHMD an LLM transcript containing that statement is regulated data with a private right of action attached; under MODPA it is sensitive data processable only where strictly necessary to provide the requested service, which forecloses retaining it for model tuning, analytics or product improvement.

Controls: no voiceprint of any kind; a health-utterance classifier that flags health-adjacent content and excludes it from persistence, analytics and any tuning corpus; a contractual prohibition in the tenant MSA against scripting medical or health intake questions; and a script-review gate before any tenant agent goes live.

### 9.8 Vendor posture

Retell over Vapi, and the reason is material rather than aesthetic.

| Item | Retell | Vapi |
|---|---|---|
| BAA and DPA | Free self-serve signing at [click-agreements.retellai.com](https://click-agreements.retellai.com/), including EU SCCs, no additional fee. HIPAA, GDPR, SOC 2 Type 1 and Type 2 claimed, with audit status in a [Compliance Trust Center](https://app.vanta.com/re-tell.ai/trust/8nfvavp5klt9n4iz32h90) ([Retell compliance](https://docs.retellai.com/general/compliance)) | BAA required before enabling HIPAA mode; contact security@vapi.ai ([Vapi HIPAA docs](https://docs.vapi.ai/security-and-privacy/hipaa)) |
| Default data use | Per-agent retention configurable from 1 day to 2 years, but the **default is "Keep forever"** ([Retell data retention](https://docs.retellai.com/accounts/data-retention)); PII-exclusion mode; signed and secure recording URLs ([Retell compliance](https://docs.retellai.com/general/compliance)) | By default Vapi records calls and stores logs and transcriptions, "aimed at continuously improving the quality of our service" ([Vapi HIPAA docs](https://docs.vapi.ai/security-and-privacy/hipaa)); a third-party assessment reports training on business-tier data unless you opt out ([ModelCharter](https://www.modelcharter.com/tools/vapi)) |
| Model training on customer data | **Yes, by default.** ToS: "If you do not opt-out of recording, you give Retell AI permission to record calls made using the Service and process communication data ('Communications') and User Content for offering AI-powered analytics and the development, training, and improvement of artificial intelligence and machine learning models," subject to de-identification and aggregation ([Retell ToS](https://www.retellai.com/legal/terms-of-service)). Privacy policy repeats it: "to train the artificial intelligence models that support our Services" ([Retell privacy policy](https://www.retellai.com/legal/privacy-policy)). The **only** named opt-out is opting out of recording — which Linh cannot do, because recording is a section 9 P0 | Training on business-tier data unless you opt out ([ModelCharter](https://www.modelcharter.com/tools/vapi)) |
| Cost of turning it off | $0 | HIPAA mode requires an Enterprise subscription or a separately purchased add-on; a third-party comparison reports roughly $1,000 per month, org-level and all-or-nothing, mutually exclusive with Zero Data Retention ([Vapi HIPAA docs](https://docs.vapi.ai/security-and-privacy/hipaa), [Jahanzaib comparison](https://www.jahanzaib.ai/blog/retell-ai-vs-vapi)) |

Vapi's default is inconsistent with MODPA's strict-necessity rule for sensitive data. `build-prompts-customized.md` names Vapi as the tech-stack choice; this document supersedes that specific line and selects Retell, on compliance grounds first and Vietnamese language-support grounds second (section 5.4).

**Correction, 1 August 2026.** An earlier revision of this section carried an ASSUMPTION that Retell's training posture was merely undisclosed. That was wrong. Retell's Terms of Service state affirmatively that it trains on Communications and User Content unless the customer opts out of recording ([Retell ToS](https://www.retellai.com/legal/terms-of-service)). Retell's product documentation exposes no training control of any kind — the Data Storage Settings page offers Everything, Everything except PII, and Basic Attributes Only, none of which mention training ([Retell data storage settings](https://docs.retellai.com/accounts/privacy-disable)), and neither the retention page nor the compliance page mentions it ([Retell data retention](https://docs.retellai.com/accounts/data-retention), [Retell compliance](https://docs.retellai.com/general/compliance)).

This does not by itself reverse the Retell-over-Vapi decision — Vapi trains too, and Retell still wins on free self-serve BAA/DPA/SCCs and on being the only managed platform naming `vi-VN` first-class. But it does mean the choice is now between two vendors that both train by default, decided on other grounds, rather than a clean compliance win. Two consequences follow:

1. The no-training commitment in section 10.3 item 7 is **not supportable on Retell as configured**. It cannot be made to customers until OQ-2 closes affirmatively.
2. R7 (vendor concentration) gains a fifth migration trigger: Retell declining to contractually exclude training.

The written request to Retell is drafted at `retell-training-data-request.md` in this project. The operative question is narrower than "do you train": it is whether training can be disabled **while recording stays on**, since the ToS ties the only opt-out to recording and Linh's consent artifacts require recording.

OpenAI data controls. Data sent to the OpenAI API is not used to train or improve models unless you explicitly opt in, and default abuse-monitoring retention is up to 30 days ([OpenAI data controls](https://platform.openai.com/docs/guides/your-data)). Zero Data Retention is available on approval and is eligible for `/v1/chat/completions`, `/v1/responses`, `/v1/audio/transcriptions`, `/v1/audio/translations`, `/v1/audio/speech`, `/v1/realtime`, `/v1/embeddings`, `/v1/moderations` and `/v1/completions`. It is not eligible for `/v1/conversations`, `/v1/assistants`, `/v1/threads`, `/v1/vector_stores`, `/v1/files`, `/v1/batches` or `/v1/fine_tuning/jobs` — those endpoints are prohibited for call content. Under the OpenAI DPA § 5.1, OpenAI agrees not to sell or share personal data and not to combine customer data with data from other sources ([OpenAI DPA](https://openai.com/policies/data-processing-addendum/)).

Twilio. The DPA forms part of the agreement with no separate signature, and Twilio may update it on at least 30 days' prior written notice; § 6.1 grants general authorization for sub-processors with the current list published, and silence during the objection window is deemed authorization ([Twilio DPA](https://www.twilio.com/en-us/legal/data-protection-addendum), [Twilio sub-processors](https://www.twilio.com/legal/sub-processors)). Operational item: subscribe to sub-processor change notices and diary the 30-day window, or the published subprocessor list goes stale silently.

### 9.9 Retention schedule

| Data class | Retention | Legal basis | Deletion mechanism |
|---|---|---|---|
| Call audio | 30 days, tenant-configurable down to 0 (`no_audio_mode`) | MODPA data minimization and strict necessity for sensitive data ([Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx)); beats the market's only published number, My AI Front Desk at 90 days ([My AI Front Desk retention](https://www.myaifrontdesk.com/trust-center/retention-deletion)) | Nightly job; object-store lifecycle rule as backstop; Retell per-agent retention set to the matching minimum ([Retell compliance](https://docs.retellai.com/general/compliance)) |
| Transcripts | 90 days | Same as above | Nightly job with hard delete, backups purged within 30 days |
| Consent events | 7 years | Evidentiary burden under [Md. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/) and [Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632) | Never auto-deleted inside the window; append-only table |
| Bookings, orders, customers | 24 months from last activity | Business necessity; MODPA minimization | Nightly job; tenant-triggered hard-delete API |
| SMS consent records | Life of consent plus 5 years | CTIA § 5.1.2 record-keeping ([CTIA MPBP](https://api.ctia.org/wp-content/uploads/2019/07/190719-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf)) | Retained with the internal DNC record |
| Internal DNC records | 5 years | [47 CFR 64.1200(d)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) | Never auto-deleted inside the window |
| Sensitive authentication data | Never persisted at all | [PCI SSC FAQ 1574](https://www.pcisecuritystandards.org/faqs/1574/) | Redacted in-flight; nothing to delete |
| Health-flagged utterances | Not persisted | MODPA strict necessity; WA MHMD ([Washington AG](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy)) | Suppressed before write |
| Biometric identifiers | Never collected | BIPA and CUBI, section 9.7 | Not applicable |

### 9.10 Language access

Cal. Civ. Code § 1632 requires a business that negotiates primarily in Spanish, Chinese, Tagalog, Vietnamese or Korean to deliver an unexecuted translation of the contract in that language before execution. Vietnamese is a covered language ([Cal. Civ. Code § 1632](https://california.public.law/codes/ca_civ_code_section_1632)).

It does not reach a nail appointment, a restaurant reservation, or a B2B SaaS subscription, because § 1632's covered contract list is limited to enumerated types: retail installment sales, conditional sale of motor vehicles, vehicle leases, loans or extensions of credit for personal, family or household purposes, residential leases longer than one month, certain B&P and Financial Code loans, reverse mortgages, legal services agreements, and foreclosure consulting contracts.

Trigger condition to watch: if Linh ever adds deposit financing, an installment plan, or a pay-later product, or sells its SaaS subscription under a credit or installment arrangement negotiated primarily in Vietnamese, § 1632 attaches and the remedy is rescission. Straight card deposits via Stripe are not credit extensions. This is tracked as a market-entry gate for California, not a launch blocker.

Independent of the statute: every all-party consent statute requires informed consent, and a Vietnamese-monolingual caller who does not understand an English-only disclosure has not consented. The Vietnamese disclosure, Vietnamese privacy notice, Vietnamese SMS opt-in language and Vietnamese DPA are therefore legal requirements dressed as product features.

---

## 10. Compliance benchmark versus the top 5

### 10.1 The table

| # | Dimension | Slang AI | PolyAI | Smith.ai | Goodcall | My AI Front Desk | Linh (this spec) |
|---|---|---|---|---|---|---|---|
| 1 | AI identity disclosure to caller | None in any published script ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) | Default guardrail actively suppresses it ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)) | Not in terms; no inbound script published ([Smith.ai terms](https://smith.ai/receptionists/terms)) | Advisory only; template says "I'm a smartphone assistant who can think" ([Goodcall greeting KB](https://help.goodcall.com/en/articles/8348837-how-to-create-the-perfect-greeting-for-your-ai-assistant)) | Outbound Sequences only, §32.7 ([Terms](https://www.myaifrontdesk.com/terms-of-service)) | Mandatory, non-disableable, inbound, bilingual, versioned |
| 2 | Recording disclosure script published verbatim | Yes: "Just so you know, we're speaking on a recorded line." ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) | No default; developer-built DTMF opt-out pattern ([PolyAI DTMF docs](https://docs.poly.ai/flows/dtmf)) | No wording published ([Smith.ai blog](https://smith.ai/blog/record-transcribe-your-calls)) | Mandatory whisper, text never published ([Goodcall KB](https://help.goodcall.com/en/articles/8007564-goodcall-s-call-recording-notification)) | Modes published, script text not ([Trust Center](https://www.myaifrontdesk.com/trust-center/call-recording-consent)) | Yes, verbatim, both languages, on a public page (Appendix C) |
| 3 | Disclosure language for non-English callers | English only; Spanish reduced to a nudge ([Slang bilingual KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support)) | Not published | Not published | Not published | Not published | Caller's detected language, always, including in salon English-only mode |
| 4 | State-aware consent | No, fixed nationwide ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) | Build-it-yourself ([PolyAI DTMF docs](https://docs.poly.ai/flows/dtmf)) | No | No, whisper does not vary ([Goodcall KB](https://help.goodcall.com/en/articles/8007564-goodcall-s-call-recording-notification)) | Per-number and per-location, operator-configured ([Trust Center](https://www.myaifrontdesk.com/trust-center/call-recording-consent)) | Derived from caller ANI plus business location; default deny to all-party |
| 5 | Retention, published as numbers | No: "as long as necessary" ([Privacy](https://www.slang.ai/privacy-policy)) | Purpose-bound, no fixed period ([Privacy](https://poly.ai/privacy-policy)); DPA 90-day Retention Period ([DPA](https://poly.ai/dpa)) | No period ([Privacy](https://smith.ai/privacy)) | No period; reserves the right to set one ([ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service)) | Yes: audio 90 days, transcripts 90 days, summaries 1 year ([Trust Center](https://www.myaifrontdesk.com/trust-center/retention-deletion)) | Yes: audio 30 days, transcripts 90 days, plus a no-audio mode |
| 6 | Trains models on customer call data | Yes: "to train our AI over time" ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) | Yes; Raven v3 trained on customer-sourced data ([training data](https://docs.poly.ai/legal/training-data)) | Indirectly, via joint ownership "improving our Services" ([Terms](https://smith.ai/receptionists/terms)) | Yes, with opt-out of manual review only ([Privacy](https://help.goodcall.com/en/articles/8007565-privacy)) | No, on the trust page ([Trust Center](https://www.myaifrontdesk.com/trust-center/security-overview)) | No, in the MSA with a remedy |
| 7 | DPA | Not published | Public ([poly.ai/dpa](https://poly.ai/dpa)) | Not published | Not published | On request ([Trust Center](https://www.myaifrontdesk.com/trust-center/security-overview)) | Public, in English and Vietnamese |
| 8 | Subprocessor list | Not published; only Stripe named ([Privacy](https://www.slang.ai/privacy-policy)) | Vanta-gated, renders blank without JavaScript ([gated URL cited in the DPA](https://app.eu.vanta.com/polyai/trust/m9icyuy0ko2kq0ibijb7t/resources?s=km1mf28r1avpzvdcza4kvv&name=subprocessor-list)) | Not published; AWS and Google Analytics named ([Privacy](https://smith.ai/privacy)) | Not published ([Privacy](https://help.goodcall.com/en/articles/8007565-privacy)) | Published table: Twilio, Deepgram, OpenAI/Anthropic, AWS — no TTS vendor ([Trust Center](https://www.myaifrontdesk.com/trust-center/security-overview)) | Full static table including TTS and data residency |
| 9 | Certifications | SOC 2 and GDPR claimed only in a help article ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) | ISO/IEC 27001, SOC 2 Type II, Cyber Essentials Plus ([compliance docs](https://docs.poly.ai/legal/compliance)) | None published; DPF self-certification ([Privacy](https://smith.ai/privacy)) | None published; homepage markets "HIPAA compliance software" ([goodcall.com](https://www.goodcall.com/)) | None claimed ([Trust Center](https://www.myaifrontdesk.com/trust-center)) | None at launch, stated plainly. SOC 2 Type I targeted post-Phase 3. No unbacked claims. |
| 10 | PCI posture | Not a product feature; Stripe for own billing ([Privacy](https://www.slang.ai/privacy-policy)) | Phone payments via PCI Pal; "PolyAI never stores or has access to card details" ([PCI Pal docs](https://docs.poly.ai/integrations/pci-pal)) | Markets payment collection with no PCI statement anywhere ([medical page](https://smith.ai/industries/medical-wellness-answering-service)) | No phone-payment or PCI statement | "Credit card numbers (PCI) — Not collected. AI redirects to secure channel" ([Trust Center](https://www.myaifrontdesk.com/trust-center/transcript-safety)) | Never collected, plus in-flight PAN and CVV redaction; SAQ A |
| 11 | Data ownership | Slang "agrees not to sell such personal data"; may use Aggregated De-Identified Data freely ([Terms](https://www.slang.ai/terms-of-service)) | Client is controller; joint controllers for some conversation data ([Privacy](https://poly.ai/privacy-policy)) | "All Subscriber Information is jointly owned by Smith and you" ([Terms](https://smith.ai/receptionists/terms)) | "perpetual, and irrevocable license … sublicensable (directly and indirectly through multiple tiers)" over caller recordings ([ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service)) | Broad IP clause: "perpetual, and irrevocable license" over AI-Generated Content ([Terms](https://www.myaifrontdesk.com/terms-of-service)) | Tenant owns caller data. Linh takes a limited, revocable, non-sublicensable license to operate the service only. |
| 12 | Accessibility statement | Not published (404) | Not published (404) | Not published (404) | Not published (404) | Not published (404) | Published WCAG-referenced statement plus documented TTY and relay behavior |
| 13 | Legal documents in a non-English language | None | None | None | None | None | Vietnamese DPA, terms, privacy notice, trust center |
| 14 | Liability cap | Fees paid in the prior 12 months ([Terms](https://www.slang.ai/terms-of-service)) | Not published (poly.ai/terms 404) | Not published in the fetched excerpt | Greater of fees paid in the last 6 months or $100 ([ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service)) | Not published in the fetched excerpt | 12 months of fees, uncapped for our own breach of the no-training and no-voiceprint commitments |

### 10.2 The specific defects we exploit

Slang AI. Its live privacy policy still contains unreplaced template placeholders where the CCPA opt-out link belongs — opt out "by clicking [LINK]" and a preference centre "accessible by [ ]" — and states "Our Services do not support Do Not Track requests at this time", so there is no functioning Do Not Sell or Share mechanism despite the policy admitting it shares device identifiers and analytics data with Advertising Partners, Analytics Partners and Business Partners ([Slang privacy policy](https://www.slang.ai/privacy-policy)). Separately, Slang's own help article is the clearest published admission in the market that a vendor trains on customer call data: "We use this data for quality testing and auditing, to improve the guest experience, and to train our AI over time" ([Slang branded greeting KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)). And there is a live contradiction: the same article tells customers "the legal disclaimer is required. The recording disclaimer covers both parties from a legal standpoint," while the terms simultaneously require the customer to "provide all notices and obtain all consents required under applicable law" ([Slang terms](https://www.slang.ai/terms-of-service)). An announcement is notice, not affirmative consent, and no Slang mechanism captures a caller's refusal.

PolyAI. It is simultaneously the most certified and the most contradictory. It publishes ISO/IEC 27001 and SOC 2 Type II ([PolyAI compliance](https://docs.poly.ai/legal/compliance)) and the single most transparent training-data artifact in the category, naming Raven v3, a November 2024 to August 2025 collection window and "Hundreds of thousands of conversational turns across tens of thousands of conversations" ([PolyAI training data](https://docs.poly.ai/legal/training-data)). It also ships a default-on guardrail that prevents the agent from disclosing what powers it ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)), gates its subprocessor list behind a Vanta URL that renders blank without JavaScript ([gated URL cited in the DPA](https://app.eu.vanta.com/polyai/trust/m9icyuy0ko2kq0ibijb7t/resources?s=km1mf28r1avpzvdcza4kvv&name=subprocessor-list)), publishes no CCPA section and no Do Not Sell link ([PolyAI privacy policy](https://poly.ai/privacy-policy)), and has no public terms of service at all. Its hedges are worth quoting because they will be quoted back at it: HIPAA "designed to meet", PCI-DSS "committed to complying" ([PolyAI compliance](https://docs.poly.ai/legal/compliance)).

Smith.ai. The oldest privacy policy of the five, last updated 16 July 2024, and it does not address call recording, retention periods, model training, certifications, controller and processor roles, or a Do Not Sell link ([Smith.ai privacy](https://smith.ai/privacy)). The terms, last updated 22 July 2025, claim that "All Subscriber Information is jointly owned by Smith and you" and retain that joint ownership partly for "improving our Services" ([Smith.ai terms](https://smith.ai/receptionists/terms)). Most striking for a receptionist product: there is no clause at all on call recording, consent to record, two-party or all-party consent, notice to callers, HIPAA or PCI — while the company markets phone payment collection on its medical page ([Smith.ai medical answering service](https://smith.ai/industries/medical-wellness-answering-service)). Note also that a third-party claim of an F BBB rating is unverified and contradicted by the BBB page itself, which shows "Not Rated" for length of time in business ([BBB Smith.ai profile](https://www.bbb.org/us/ca/los-altos/profile/online-shopping/smithai-1216-1000053964)); do not repeat it.

Goodcall. Its entire legal corpus is three help-center articles dated September 2024 ([Goodcall Privacy and Terms collection](https://help.goodcall.com/en/collections/4196156-privacy-terms)). The only recording-law text is a bullet in a prohibited-conduct list — the user agrees not to violate "laws against recording users without their knowledge or consent" ([Goodcall ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service)) — while the same document takes a "non-exclusive, worldwide, royalty-free, fully paid-up, transferable, sublicensable (directly and indirectly through multiple tiers), perpetual, and irrevocable license" over caller recordings. Liability is capped at the greater of six months of fees or $100. The homepage markets "HIPAA compliance software" with no BAA, no HIPAA page and no security page ([goodcall.com](https://www.goodcall.com/)). Callers exercising privacy rights are bounced back to the business: "please contact the Customer that you interact with directly" ([Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy)).

My AI Front Desk. This is the bar to beat, and it is a real bar. It publishes a named subprocessor table — Twilio for telephony, Deepgram for STT, OpenAI and Anthropic for LLM, AWS for hosting — and states plainly that "Customer call recordings and transcripts are not used to train shared AI models" and "Call data is not shared with LLM providers for model training" ([My AI Front Desk security overview](https://www.myaifrontdesk.com/trust-center/security-overview)). It publishes concrete retention with configurable windows of 30, 60, 90, 180 days, 1 year or custom, and a backup purge SLA of 30 days ([My AI Front Desk retention](https://www.myaifrontdesk.com/trust-center/retention-deletion)). It publishes the most sophisticated consent architecture in the market, with announcement-only and explicit-consent-gating modes and per-call proof metadata ([My AI Front Desk consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent)). Its weaknesses are precise: the exact disclosure script text is not published, no non-English disclosure is mentioned anywhere, the no-training pledge sits on a trust page rather than in the terms while the terms grant a "perpetual, and irrevocable license" over AI-Generated Content ([Terms](https://www.myaifrontdesk.com/terms-of-service)), the DPA is only "available on request", and it claims no third-party certification at all. Note also that the separate domain aifrontdesk.com claims SOC 2 Type II and BAA availability ([aifrontdesk.com](https://aifrontdesk.com/hipaa-compliant-virtual-receptionist)); no link between the two domains was found and those claims must not be attributed to My AI Front Desk.

### 10.3 The 12-point challenger playbook

Each item is a shipped commitment in this specification, not a marketing line.

1. Consent disclosure in the caller's detected language, as the default, delivered in full before recording begins — not a bilingual nudge appended to an English disclosure ([Slang bilingual KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support)). Logged as `disclosure_language`, the one field none of the five can produce.
2. Automatic per-state consent posture derived from the caller's number and the business location, defaulting to all-party whenever either side maps to an all-party state and honoring refusal by continuing the call unrecorded — the behavior My AI Front Desk describes but makes the operator configure ([My AI Front Desk consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent)).
3. Mandatory, published, versioned AI self-identification in both languages, inbound. The opposite of PolyAI's identity-suppression guardrail ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)) and of Goodcall's euphemism ([Goodcall greeting KB](https://help.goodcall.com/en/articles/8348837-how-to-create-the-perfect-greeting-for-your-ai-assistant)).
4. A Vietnamese-language DPA, terms and privacy notice, with the Vietnamese text legally operative for Vietnamese-language customers. No competitor publishes any legal document in any non-English language. This is free and defensible.
5. A caller-facing bilingual rights page and a working self-serve DSAR intake — a "delete my call recording" form the caller can use with a phone number and a call time — plus a live Do Not Sell and Share link. Slang's is an unfilled placeholder ([Slang privacy](https://www.slang.ai/privacy-policy)); Goodcall bounces callers to the business ([Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy)); none of the five runs a portal.
6. Hard retention defaults tighter than the market and published as numbers: audio 30 days against the market's best of 90 ([My AI Front Desk retention](https://www.myaifrontdesk.com/trust-center/retention-deletion)), transcripts 90 days, plus a no-audio mode where only the transcript survives, plus a published backup-purge SLA.
7. A binding no-training commitment in the MSA with a remedy, not on a trust page. **BLOCKED pending OQ-2** — see the correction in section 9.8. Retell's own ToS reserves training rights over Communications and User Content unless the customer opts out of recording ([Retell ToS](https://www.retellai.com/legal/terms-of-service)), and Linh cannot opt out of recording without breaking its consent artifacts. Until Retell confirms a training opt-out that preserves recording, or signs an amendment excluding training, this position cannot be claimed. Do not put it in sales material. The competitive gap it targets is real and unoccupied: Slang trains ([Slang KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)), PolyAI trains ([training data](https://docs.poly.ai/legal/training-data)), Goodcall trains with only a manual-review opt-out ([Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy)), Smith.ai claims joint ownership for service improvement ([Smith.ai terms](https://smith.ai/receptionists/terms)).
8. A full public subprocessor table including the TTS vendor that My AI Front Desk's table omits, with regional data-residency disclosure, and no login wall. For a Vietnamese-American customer base, state explicitly whether any voice data is processed in Vietnam or by a Vietnamese-owned provider — a question none of the five answers, and one that becomes concrete if Option B ever routes audio to Viettel or Zalo.
9. No card data on the phone as a hard product boundary, with automatic in-flight PAN and CVV redaction rather than agent-initiated pause, which the PCI SSC materials treat as insufficient ([Sycurio fact sheet](https://cdn.asp.events/CLIENT_ROAR_Eve_16F4C528_E03F_0401_6D78CA8E12A9EF6E/sites/CCCE-2023/media/libraries/exhibitor-documents/36160-Sycurio-Pause&Resume-Fact-Sheet-UK-May-22.pdf)).
10. An accessibility statement and a documented TTY and relay-service call path. All five 404 on accessibility.
11. Outbound discipline borrowed from the best clause in the market before we ever send an outbound AI call: prior express consent, internal DNC, calling-time guards, caller-ID accuracy, and explicit naming of BIPA and right-of-publicity statutes, following My AI Front Desk's structure ([Terms](https://www.myaifrontdesk.com/terms-of-service)) combined with Smith.ai's TCPA and TSR indemnity language ([Terms](https://smith.ai/receptionists/terms)) — plus the thing neither has, a Vietnamese-language outbound AI disclosure.
12. A trust center that actually loads: static HTML pages for security overview, subprocessors, retention, consent and AI data use, following My AI Front Desk's eight-page structure ([trust center](https://www.myaifrontdesk.com/trust-center)) but ungated, and with a Vietnamese translation of every page.

Point 4 is the single highest-leverage item. It costs a translation budget and it is a first that no incumbent can claim to have missed by accident.

---

## 11. Requirements register

### 11.1 Language and voice pipeline

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| LNG-01 | In `nail_salon` mode the caller-facing conversation is English only after the disclosure. | P0 | Founder policy plus quality: Vietnamese runs on the previous-generation tier of every vendor ([LiveKit TTS catalog](https://docs.livekit.io/agents/models/tts/)) | — |
| LNG-02 | In `restaurant` mode the caller's language is detected from the first utterance and pinned for the call, with an explicit switch path on request. | P0 | No competitor does detected Vietnamese; Serviio's seven auto-detected languages exclude it ([serviio.ai](https://serviio.ai/)) | LNG-05 |
| LNG-03 | The recording and AI disclosure is delivered in the caller's detected language in both modes. | P0 | Informed consent under all-party statutes ([Md. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/)); Slang keeps it English-only ([Slang bilingual KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support)) | CMP-01 |
| LNG-04 | Backend language is per user, from `user_preferences.language`, not per business. | P0 | Founder requirement: Vietnamese owner, English-speaking manager, one tenant | Schema 13 |
| LNG-05 | The transcriber is pinned to Deepgram Nova-3 monolingual `vi` or `en`. `multi` is rejected at config validation. | P0 | Nova-3 `multi` covers ten languages, none Vietnamese ([Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview)) | — |
| LNG-06 | Vietnamese strings are stored, transmitted and rendered as UTF-8 NFC with full diacritics end to end. | P0 | No POS documents Vietnamese ([MenuSifu](https://www.menusifu.com/restaurants/full-service-restaurant-pos-system), [Chowbus](https://www.chowbus.com/blog/the-best-chinese-restaurant-pos-system-in-2026)); the Vietnamese layer is entirely ours | — |
| LNG-07 | Technician, service and dish names are loaded into Deepgram Keyterm Prompting, ranked by 30-day frequency. | P1 | Keyterm prompting is available on Nova-3 and marketed for Vietnamese ([Deepgram keyterm](https://developers.deepgram.com/docs/keyterm), [Deepgram Vietnamese](https://deepgram.com/product/speech-to-text/vietnamese)) | LNG-05 |
| LNG-08 | Southern Vietnamese voice selection via a Vietnamese-native TTS lane. | P2 | No global vendor offers accent choice; only FPT.AI, Viettel and Zalo do ([FPT.AI TTS voices](https://docs.fpt.ai/docs/en/speech/documentation/tts-voice/), [Viettel TTS](https://www.vtcc.vn/api-tts-text-to-speech/), [Zalo TTS](https://github.com/iconclub/zalo-tts)) | Option B |

### 11.2 Module system

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| MOD-01 | The assistant tool list is generated from enabled modules; a disabled module's tools are absent from the payload. | P0 | Capability removal, not prompt discouragement. Section 4.1 | — |
| MOD-02 | Module toggles are validated at save time against the section 4.4 matrix and rejected with a bilingual message. | P0 | A stored-but-invalid flag produces an agent that promises capability it does not have | MOD-01 |
| MOD-03 | Hard compliance constants override tenant configuration unconditionally at resolution time. | P0 | `spoken_card_capture=false` per [PCI SSC](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf); `disclosure_module_enabled=true` per [Md. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/) | MOD-01 |
| MOD-04 | Adapter capabilities narrow the tool set: an adapter with `requiresPrepaidOrder=true` on a pay-at-pickup tenant downgrades `place_order` to fallback mode. | P0 | Square requires fully paid orders to surface in Order Manager ([Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does)); SpotOn accepts only fully paid CLOSED orders ([SpotOn create order](https://developers.spoton.com/central-api/docs/create-order)) | POS-01 |
| MOD-05 | Tenant creation writes the type-appropriate preset from section 4.3 verbatim. | P0 | Deterministic onboarding; prevents a half-configured agent answering a live line | — |
| MOD-06 | Owner-visible module change history with actor and timestamp. | P1 | Support and audit | — |

### 11.3 Salon booking

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| BKG-01 | Availability is the intersection of business hours, technician shift, minus blocks, minus existing bookings with buffers, minus adapter-reported busy intervals. | P0 | Tier A adapters own the calendar ([Square SearchAvailability](https://developer.squareup.com/reference/square/bookings-api/search-availability), [Zenoti Service Booking APIs](https://docs.zenoti.com/docs/service-booking-apis), [Mindbody endpoints](https://developers.mindbodyonline.com/Resources/Endpoints)) | POS-01 |
| BKG-02 | Effective duration uses the per-technician override and the per-customer multiplier, with buffers. | P0 | Client-specific durations exist in the market but in no API ([Mangomint Learning Center](https://www.mangomint.com/learn/)) | — |
| BKG-03 | Rotation selection is deterministic and implements both Zota-style queue types and Vinail-style weighted 0.25/0.5/1 points. | P0 | Zota's "8 types of turn queue management" ([Zota salon POS](https://zotaservices.com/salon-pos/)); Vinail's "Factor 0.25 / 0.5 / 1 by customer and service type" ([vinail.net](https://vinail.net/)); no integrable API exposes rotation | BKG-01 |
| BKG-04 | An explicit technician request always beats rotation. | P0 | Rotation is fairness among staff, not rationing for clients; Bukkii books the named tech ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)) | BKG-03 |
| BKG-05 | A technician with no `technician_services` row for the service is never booked for it. | P0 | Skill routing is table stakes; Phorest exposes "Link qualified staff members to bookable services" ([Phorest US pricing](https://www.phorest.com/us/pricing/)) | BKG-01 |
| BKG-06 | Booking create is idempotent and takes an advisory lock on `(technician_id, date)`. | P0 | Retry safety; Toast requires unique `externalId` ([Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html)) | POS-02 |
| BKG-07 | The agent reads back service, technician, day, time and location before ending the call. | P0 | A misheard booking is a lost slot and an angry customer | — |
| BKG-08 | Modify is implemented as cancel-then-create in one transaction preserving `bookings.id` and appending to a history trail. | P0 | Uniform internal model across adapters that do and do not expose reschedule ([Boulevard appointmentReschedule](https://developers.joinblvd.com/graphql-admin-api/api-reference/mutations/appointmentReschedule)) | BKG-06 |
| BKG-09 | Cancel releases the slot and triggers waitlist backfill; a captured deposit inside the refund window is queued for owner decision, never auto-refunded. | P0 | Linh does not make money decisions for the owner | BKG-12 |
| BKG-10 | Walk-in wait is quoted as a 5-minute-granularity range, and is refused above `max_quotable_wait_minutes`. | P0 | Only Bukkii claims salon wait quoting, and on a tablet ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)); Zenoti prioritizes scheduled over walk-in ([Zenoti queue settings](https://help.zenoti.com/en/queue/onboard-and-set-up/general-settings-for-queue.html)) | BKG-03 |
| BKG-11 | Deposits are collected only by Stripe Payment Link over SMS; the agent never speaks, hears or stores card data. | P0 | [PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf); SAQ A via Stripe-hosted pages ([Stripe PCI guide](https://stripe.com/guides/pci-compliance)) | CMP-07, CMP-09 |
| BKG-12 | Waitlist offers go to at most `max_offers_per_slot` entries, first-accept-wins, and never inside quiet hours. | P0 | [47 CFR 64.1200(c)(1)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) | CMP-11 |
| BKG-13 | Four-layer spam screen; minutes on screened calls are not billed to the tenant. | P0 | Goodcall excludes robocalls from the allowance ([Goodcall pricing](https://www.goodcall.com/pricing)); Bukkii publishes 37K+ filtered ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)) | — |
| BKG-14 | Human transfer carries a bilingual context payload and never drops the caller into an unanswered ring-out. | P0 | Warm transfer with context is table stakes ([Verdict Foodservice on Maple](https://www.verdictfoodservice.com/news/maple-links-voice-ai-with-opentable/), [bitebuddy.ai](https://bitebuddy.ai/)) | LNG-04 |
| BKG-15 | Gap-fill placement of short services into dead slots. | P1 | Phorest markets "Reducing the 'White Space' in your Schedule" ([Phorest AI features](https://www.phorest.com/us/features/ai-features/)) | BKG-01 |
| BKG-16 | Owner-facing rotation ledger UI showing credit points and manual reward/subtract. | P1 | Zota exposes "Reward and subtract turn" ([Zota salon POS](https://zotaservices.com/salon-pos/)) | BKG-03 |
| BKG-17 | Per-completed-booking accounting: count and value every booking Linh creates, so a usage-based model remains buildable later without retrofitting instrumentation. Measurement only — no charging, no rate, no owner-visible amount. | P2 | Serviio charges 2% per completed order ([serviio.ai](https://serviio.ai/)); no nail vendor has copied it. Pricing itself is deferred under NG8, but the counter is cheap now and expensive to backfill | — |

### 11.4 Restaurant ordering

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| ORD-01 | Catalog source precedence is adapter first when `canReadCatalog`, then local `menu_items`. | P0 | Square Catalog with `ITEMS_READ` ([Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does)); Toast `GET /menus` ([Toast menus API](https://doc.toasttab.com/doc/devguide/apiMenusApiRateLimit_V2.html)) | POS-01 |
| ORD-02 | An item known to be 86'd or unverifiable is never confirmed as available. | P0 | Toast's orders API still accepts orders containing out-of-stock items ([Toast stock API](https://doc.toasttab.com/doc/devguide/apiStock.html)) | ORD-01 |
| ORD-03 | Full read-back with quantities and modifiers, and an affirmative yes, before any adapter commit. | P0 | `read_back_required` is a JSON const; a hallucinated order costs the owner food | — |
| ORD-04 | Payment posture gate: pay-at-pickup tenants are never routed to a prepaid-only adapter for commit. | P0 | Square, SpotOn and Olo Rails are prepaid-only ([Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does), [SpotOn create order](https://developers.spoton.com/central-api/docs/create-order), [Olo Rails FAQ](https://olosupport.zendesk.com/hc/en-us/articles/115005665043-Rails-FAQ)) | MOD-04 |
| ORD-05 | The agent never tells a caller the kitchen has the order until the adapter confirms injection. | P0 | "HTTP 200 does not mean the order reached the POS" ([Lightspeed K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial)); Otter exposes `injectionState` ([Otter API reference](https://developer-guides.tryotter.com/api-reference/)) | POS-04 |
| ORD-06 | Pickup time is quoted as a range including queue pressure, and repeated in the SMS. | P0 | Serviio sends pickup estimates ([serviio.ai](https://serviio.ai/)); Kea throttles when tickets back up ([kea.ai](https://kea.ai/)) | CMP-09 |
| ORD-07 | Vietnamese dish names resolve through `name_vi`, `name_en`, `name_pos` and `aliases[]`, with explicit disambiguation of registered confusable pairs. | P0 | No POS supports Vietnamese; tone contours are truncated by 8 kHz μ-law ([Twilio Media Streams](https://www.twilio.com/docs/voice/media-streams/websocket-messages)) | LNG-06, LNG-07 |
| ORD-08 | Large parties, high-value orders and any catering request escalate to the owner and are never committed by the agent. | P0 | Bounded blast radius for model error | BKG-14 |
| ORD-09 | Reservations above `max_party_size_auto` escalate rather than book. | P1 | Crude capacity model in v1; table topology is P2 | ORD-08 |
| ORD-10 | Kitchen ticket renders `name_vi` with diacritics where the POS accepts free text. | P1 | Vietnamese kitchen tickets must come from the item names the restaurant enters ([MenuSifu](https://www.menusifu.com/restaurants/full-service-restaurant-pos-system)) | LNG-06 |

### 11.5 POS adapters

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| POS-01 | Every adapter implements `capabilities`, `getAvailability`, `getCatalog`, `commit` and `healthCheck`, with `capabilities` resolved live per tenant. | P0 | Access is per-tenant: Toast standard access depends on employee status and permission ([Toast API access requirements](https://doc.toasttab.com/doc/devguide/devApiAccessRequirements.html)) | — |
| POS-02 | Every write carries a deterministic idempotency key persisted before the call, with a unique index. | P0 | Toast unique `externalId` ([Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html)); Lightspeed unique `thirdPartyReference` ([K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial)) | — |
| POS-03 | Per-adapter rate limiting per the section 8.7 table, honoring `Retry-After` and vendor headers. | P0 | Zenoti 60 calls per minute ([Zenoti rate limits](https://help.zenoti.com/en/zenoti-apis/api-rate-limits.html)); Otter 32 order creates per minute ([Otter API reference](https://developer-guides.tryotter.com/api-reference/)); Toast 20 req/sec ([Toast rate limiting](https://doc.toasttab.com/doc/devguide/apiRateLimiting.html)) | POS-01 |
| POS-04 | Retry only `failed` results with `retryable=true`; never retry `rejected`. | P0 | Prevents duplicate bookings and duplicate food | POS-02 |
| POS-05 | Conflicts default to `manual_review` with both versions shown side by side. | P0 | An automatic overwrite of a salon calendar is unrecoverable | POS-01 |
| POS-06 | Tier C tenants get a parallel ledger with SMS, print and dashboard push plus structured reconciliation and an unreconciled-item alert. | P0 | Ten salon vendors and four Asian restaurant POS publish no API at all (section 8.4) | — |
| POS-07 | Availability is re-validated within 45 seconds before commit; Phorest-class adapters poll `updated_at` at a 20-second TTL during a live call. | P0 | Phorest has no webhooks ([Phorest getting started](https://developer.phorest.com/docs/getting-started)) | POS-01 |
| POS-08 | Adapter health surfaced in the owner dashboard with a last-successful-sync timestamp. | P1 | Silent adapter failure is worse than a visible one | POS-01 |

### 11.6 Compliance

| ID | Requirement | Priority | Rationale and citation | Dependency |
|---|---|---|---|---|
| CMP-01 | Recording starts before the disclosure plays, so the announcement is captured inside the recording. | P0 | RCW 9.73.030(3) requires the announcement to be recorded ([RCW 9.73.030](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030)) | — |
| CMP-02 | Every recorded call has a complete `consent_events` row with all twelve fields including `disclosure_language` and `disclosure_version`. | P0 | Evidentiary burden ([Md. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/)); My AI Front Desk sets the artifact bar ([Trust Center](https://www.myaifrontdesk.com/trust-center/call-recording-consent)) | CMP-01 |
| CMP-03 | In an all-party posture, the call is not retained as a recording without an affirmative yes. | P0 | [Md. § 10-402(c)(3)](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/); [Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632) with $5,000-per-violation civil exposure and no actual damages required ([§ 637.2](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2)) | CMP-01 |
| CMP-04 | A real no-record path exists: press 0 for voicemail or a human, with recording disabled, logged. | P0 | Consent must be voluntary; a caller with no alternative has not chosen ([Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632)) | CMP-01 |
| CMP-05 | Consent posture is derived from caller ANI and business location, defaulting to all-party when unknown, blocked or non-NANP. | P0 | Four of eight target states are all-party; inference is imperfect so the default must deny | — |
| CMP-06 | Mandatory bilingual AI self-identification, and a truthful immediate answer to "are you a real person?". | P0 | [FCC 24-17](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf); [Cal. BPC § 17943(a)(2)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=7.&title=&part=3.&chapter=6.&article); [Utah SB 226 safe harbor](https://le.utah.gov/Session/2025/bills/enrolled/SB0226.pdf). PolyAI suppresses identity by default ([PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction)) | LNG-03 |
| CMP-07 | In-flight PAN and CVV redaction on transcript and audio, automatic and with no agent action. | P0 | Digital audio recording of card validation codes is prohibited ([PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf)); pause and resume is not compliant ([Sycurio](https://cdn.asp.events/CLIENT_ROAR_Eve_16F4C528_E03F_0401_6D78CA8E12A9EF6E/sites/CCCE-2023/media/libraries/exhibitor-documents/36160-Sycurio-Pause&Resume-Fact-Sheet-UK-May-22.pdf)) | — |
| CMP-08 | No card-collection tool exists in any tool list under any configuration. | P0 | Spoken card data drags the whole stack into PCI scope ([PCI SSC v3.0](https://www.pcisecuritystandards.org/documents/Protecting_Telephone_Based_Payment_Card_Data_v3-0_nov_2018.pdf)) | MOD-03 |
| CMP-09 | No SMS is sent until an approved A2P 10DLC campaign exists and the sending number is in the sender pool. | P0 | Twilio blocks unregistered traffic with error 30034 ([Twilio error 30034](https://www.twilio.com/docs/api/errors/30034)) | MOD-02 |
| CMP-10 | STOP, QUIT, END, REVOKE, OPT OUT, CANCEL, UNSUBSCRIBE plus natural-language variants are honored, revoke-all semantics apply, exactly one confirmation is sent, and no exclusive revocation method is designated. | P0 | [47 CFR 64.1200(a)(10)–(a)(12)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200); [CTIA MPBP § 5.1.3](https://api.ctia.org/wp-content/uploads/2019/07/190719-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf); revoke-all deadline 31 January 2027 ([Burr and Forman](https://www.burr.com/telephone-consumer-protection-act/the-fcc-delays-effective-date-of-tcpa-revoke-all-rule-until-january-31-2027)) | CMP-09 |
| CMP-11 | No outbound SMS or voice before 8:00 a.m. or after 9:00 p.m. in the recipient's local time; deny when the timezone is ambiguous. | P0 | [47 CFR 64.1200(c)(1)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) | CMP-09 |
| CMP-12 | Speaker recognition, voice enrollment and voiceprint matching are absent from the codebase and from every vendor configuration. | P0 | BIPA voiceprints at $1,000/$5,000 per violation with a private right of action ([Sidley](https://datamatters.sidley.com/2026/04/08/seventh-circuit-limits-potential-damages-under-bipa-holds-2024-amendment-applies-retroactively/)); Texas CUBI at $25,000 per violation ([Tex. Bus. and Com. Code § 503.001](https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001)) | — |
| CMP-13 | Health-adjacent utterances are classified and excluded from persistence, analytics and any tuning corpus. | P0 | WA MHMD covers bodily functions with a private right of action ([Washington AG](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy)); MODPA limits sensitive data to strict necessity ([Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx)) | — |
| CMP-14 | Retention jobs enforce the section 9.9 schedule with hard delete and a backup purge SLA. | P0 | MODPA minimization ([Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx)); Retell per-agent retention set to match ([Retell compliance](https://docs.retellai.com/general/compliance)) | — |
| CMP-15 | Call content is routed only through ZDR-eligible OpenAI endpoints; `/v1/conversations`, `/v1/assistants`, `/v1/threads`, `/v1/vector_stores` and `/v1/files` are blocked at the client layer. | P0 | [OpenAI data controls](https://platform.openai.com/docs/guides/your-data) | — |
| CMP-16 | Privacy notice, terms and DPA are published in English and Vietnamese before the first live tenant call. | P0 | No competitor publishes any legal document in a non-English language (section 10); MODPA notice content requirements ([Moore and Van Allen](https://www.mvalaw.com/data-points/getting-ready-for-marylands-online-data-privacy-act-a-new-trendsetter)) | — |
| CMP-17 | Self-serve bilingual DSAR intake for callers, with a working Do Not Sell and Share link. | P1 | Slang's opt-out link is an unfilled placeholder ([Slang privacy](https://www.slang.ai/privacy-policy)); Goodcall bounces callers to the business ([Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy)) | CMP-16 |
| CMP-18 | Internal DNC list per tenant with a written policy, 30-day honor and 5-year retention. | P1 | [47 CFR 64.1200(d)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) | CMP-10 |
| CMP-19 | Global Privacy Control honored on all web properties. | P1 | MODPA opt-out signal requirement ([Moore and Van Allen](https://www.mvalaw.com/data-points/getting-ready-for-marylands-online-data-privacy-act-a-new-trendsetter)) | — |
| CMP-20 | Accessibility statement plus documented TTY and relay-call behavior. | P1 | All five benchmark vendors 404 on accessibility (section 10.1 row 12) | — |
| CMP-21 | MODPA 35,000-consumer threshold monitor and TDPSA SBA size-standard gate before Texas entry. | P2 | [Maryland AG](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx); [Tex. Bus. and Com. Code § 541.002](https://texas.public.law/statutes/tex._bus._and_com._code_section_541.002) | — |

### 11.7 Acceptance criteria for every P0

#### LNG-01 Salon caller-facing English only
- Happy path. Given `business_type = 'nail_salon'` and a caller who speaks English, When the disclosure completes, Then every subsequent agent turn is in English and `calls.language_detected = 'en'`.
- Error. Given the language classifier returns Vietnamese with confidence above 0.8, When the disclosure has played in Vietnamese, Then the agent speaks one Vietnamese sentence offering to continue in English or transfer to a person, and if the caller continues, all further turns are English.
- Edge. Given a caller code-switches into Vietnamese mid-call in salon mode, When three consecutive caller turns are Vietnamese, Then the agent offers human transfer rather than switching, and `calls.outcome` records `transferred_language`.

#### LNG-02 Restaurant language detection
- Happy path. Given `business_type = 'restaurant'` and a caller whose first utterance is Vietnamese, When the classifier resolves, Then the agent continues in Vietnamese and `calls.language_detected = 'vi'`.
- Error. Given the first utterance is under 400 ms or unintelligible, When classification confidence is below 0.6, Then the agent replays a bilingual prompt once and re-classifies; after two failures it defaults to English and logs `language_detection_failed`.
- Edge. Given a caller says "cho tôi order phở, uh, two large", When mixed-language input is detected, Then the pinned language remains the majority-token language for the utterance and dish-name resolution runs against `aliases[]` in both languages.

#### LNG-03 Disclosure in the caller's language
- Happy path. Given a Vietnamese-speaking caller to a Maryland salon, When the call connects, Then the full recording and AI disclosure plays in Vietnamese and `consent_events.disclosure_language = 'vi'`.
- Error. Given the Vietnamese disclosure audio asset is missing or fails to fetch, When playback would fail, Then the call is not recorded, the English disclosure plays, `consent_events.consent_response = 'declined_system'` is written, and an operator alert fires.
- Edge. Given a caller whose language cannot be classified at all, When posture is all-party, Then both disclosures play in sequence, English first, and `disclosure_language = 'en+vi'`.

#### LNG-04 Per-user backend language
- Happy path. Given a tenant with owner language `vi` and manager language `en`, When each logs in, Then every dashboard string, morning brief and alert renders in that user's own language.
- Error. Given `user_preferences.language` is null, When the UI renders, Then it falls back to `businesses.language_default` and prompts the user once to choose.
- Edge. Given a manager is added by the owner and has never logged in, When a VIP alert fires, Then the alert is sent in the inviting owner's language and is re-rendered in the manager's language after first login.

#### LNG-05 Monolingual transcriber pinning
- Happy path. Given an assistant is created, When the transcriber config is built, Then `model = 'nova-3'` and `language` is exactly `vi` or `en`.
- Error. Given a config attempts `language = 'multi'`, When validation runs, Then the save is rejected with "Vietnamese is not supported in Deepgram multi mode" and the assistant is not patched.
- Edge. Given a restaurant needs both languages, When the assistant is provisioned, Then two monolingual language options are registered and the runtime selects one per call; no `multi` path exists.

#### LNG-06 Vietnamese diacritic integrity
- Happy path. Given a dish named "Phở tái nạm", When it is written to `menu_items`, returned by the API, rendered in the dashboard and sent by SMS, Then the byte sequence is identical NFC UTF-8 at every hop.
- Error. Given an adapter's `name_pos` field rejects non-ASCII, When commit runs, Then `name_pos` carries the ASCII string the POS expects while `name_vi` is preserved locally and placed in the free-text note if the adapter accepts one.
- Edge. Given a UI element must truncate "Bún bò Huế đặc biệt", When truncation runs, Then it breaks on a grapheme cluster boundary and never orphans a combining mark.

#### MOD-01 Tool list generated from modules
- Happy path. Given `ordering.enabled = false`, When `resolveTools` runs, Then `place_order` is absent from the emitted tool array and from the assistant payload sent to Retell.
- Error. Given a stale cached tool list after a module change, When a call arrives within 5 seconds of the change, Then the cache key mismatch forces a rebuild before the assistant answers.
- Edge. Given a `both` tenant disables `booking` but keeps `ordering`, When the tool list is built, Then no salon tools are present, restaurant tools are present, and the system prompt fragment for booking is also removed.

#### MOD-02 Save-time validation
- Happy path. Given an owner enables `deposits` with a connected Stripe account and SMS on, When save runs, Then the flag persists and the `send_deposit_link` tool appears.
- Error. Given an owner enables `deposits` with no Stripe account, When save runs, Then the save is rejected with the English and Vietnamese messages from section 4.4 and nothing is written.
- Edge. Given a Stripe account is disconnected after `deposits` was enabled, When the nightly validator runs, Then `deposits.enabled` is set to false, the tool is removed, and the owner is notified in their language.

#### MOD-03 Compliance constants override
- Happy path. Given a tenant config with `call_recording.disclosure_module_enabled` absent, When resolution runs, Then it is forced to true.
- Error. Given a direct database write sets `deposits.spoken_card_capture = true`, When resolution runs, Then the value is overridden to false and a security alert fires naming the actor.
- Edge. Given a tenant in a one-party state sets `consent_mode = 'announcement_only'` and a caller dials in from a California area code, When posture resolves, Then `all_party_gated` is used for that call regardless of tenant configuration.

#### MOD-04 Adapter capability narrowing
- Happy path. Given a Square restaurant tenant with `payment_posture = 'pay_at_pickup'`, When tools resolve, Then `place_order` is emitted in `commit_mode: "fallback"` and the order is delivered by SMS ticket.
- Error. Given `capabilities()` throws, When tools resolve, Then the adapter is treated as having no write capability and the fallback channel is used; a health alert fires.
- Edge. Given a tenant switches from Square to Toast mid-week, When `capabilities()` next resolves, Then `place_order` upgrades to native commit mode on the next call with no manual reconfiguration.

#### MOD-05 Presets on tenant creation
- Happy path. Given a new `nail_salon` tenant, When the record is created, Then `modules` matches the section 4.3 salon preset exactly and `schema_version = 1`.
- Error. Given preset writing fails, When the tenant is created, Then the tenant is marked `is_active = false` and no phone number is provisioned.
- Edge. Given an existing tenant with no `modules` column value, When the migration runs, Then the type-appropriate preset is stamped and a migration log row is written.

#### BKG-01 Availability resolution
- Happy path. Given business hours 09:00 to 19:00, a technician shift 10:00 to 18:00, one booking 13:00 to 14:00, and a Square busy interval 15:00 to 15:30, When availability is computed for a 45-minute service, Then the returned slots exclude 13:00 to 14:00 and 15:00 to 15:30 and lie inside 10:00 to 18:00.
- Error. Given the adapter `getAvailability` call times out, When the resolver runs, Then Linh-local availability is returned with `source = 'linh'`, the slot count is capped at two offers, and a `pos_sync_log` warning row is written.
- Edge. Given a service whose effective duration exceeds the remaining shift, When availability is computed, Then no slot is returned for that day and the agent offers the next day.

#### BKG-02 Effective duration
- Happy path. Given base 45 minutes, technician override 40, customer multiplier 1.00, buffers 5 and 5, When duration resolves, Then 50 minutes is used.
- Error. Given the service has no duration and no override, When duration resolves, Then `default_service_duration_minutes` is used, `duration_estimated = true` is set, and the row appears in the morning brief.
- Edge. Given a customer multiplier of 1.30 on a 90-minute service, When duration resolves, Then 117 minutes plus buffers is used and the agent never mentions the multiplier out loud.

#### BKG-03 Rotation selection
- Happy path. Given three qualified technicians with credit points 2.5, 1.0 and 3.0 under `weighted_points`, When no technician is requested, Then the technician with 1.0 is selected.
- Error. Given a tie on credit points and identical `clock_in_at`, When selection runs twice for the same call, Then the same technician is selected both times, ordered by `technicians.id` ascending.
- Edge. Given a completed 15-minute polish change with `turn_factor = 0.25`, When the booking completes, Then `credit_points` increases by 0.25, not 1.0, and a `turn_events` row records the delta and the source booking.

#### BKG-04 Requested technician beats rotation
- Happy path. Given the caller asks for Tina and Tina is qualified and free, When selection runs, Then Tina is booked with `reason = 'requested'` and rotation is not consulted.
- Error. Given Tina is fully booked, When selection runs, Then no booking is made silently; the agent offers Tina's next opening and the rotation-selected alternative at the requested time, in that order.
- Edge. Given Tina is `locked` in the queue, When the caller requests her explicitly, Then she is still bookable, because locking suppresses rotation selection only.

#### BKG-05 Skill gate
- Happy path. Given Kim has a `technician_services` row for pink and white, When she is selected, Then the booking is written with her `technician_id`.
- Error. Given the caller requests Tina for pink and white and Tina has no matching row, When selection runs, Then the agent states Tina does not do it and offers Kim, and no booking is written against Tina.
- Edge. Given no active technician is qualified for the requested service, When selection runs, Then the agent takes a message and escalates to the owner rather than booking anyone.

#### BKG-06 Idempotent create with lock
- Happy path. Given a `book_appointment` call, When it executes, Then a row is inserted with the idempotency key and an advisory lock on `(technician_id, date)` is held for the duration of the transaction.
- Error. Given a network retry replays the identical tool call, When the second insert runs, Then the unique index short-circuits to the existing row and one booking exists, not two.
- Edge. Given two callers request the same technician-minute within 300 ms, When both transactions run, Then the advisory lock serializes them, the first wins, and the second receives `SLOT_TAKEN` and is offered the next slots.

#### BKG-07 Mandatory read-back
- Happy path. Given a booking is written, When the call approaches close, Then the agent reads service, technician, day, time and location and receives a yes before ending.
- Error. Given the caller says the time is wrong, When the correction is captured, Then the booking is modified via BKG-08 and read back again; the call does not end on an unconfirmed booking.
- Edge. Given the caller hangs up before read-back completes, When the call ends, Then the booking remains at `pending`, no confirmation SMS is sent, and the owner sees it in the unconfirmed queue.

#### BKG-08 Modify
- Happy path. Given a confirmed booking, When the caller reschedules, Then the same `bookings.id` persists, the history array gains an entry, and the old slot is released.
- Error. Given the adapter reschedule fails non-retryably, When the transaction runs, Then the whole modify rolls back, the original booking is intact, and the agent offers to have the owner call back.
- Edge. Given a reschedule moves the booking across a technician boundary, When the transaction commits, Then rotation credit is not double-counted: the original booking's credit is reversed and the new technician's credit applies on completion.

#### BKG-09 Cancel
- Happy path. Given a confirmed booking, When the caller cancels, Then `status = 'cancelled'`, the slot is released, and waitlist backfill fires.
- Error. Given the adapter cancel fails, When the local cancel has already committed, Then a `pos_sync_log` row with `pending_retry` is written and the owner is alerted so the POS calendar can be cleared manually.
- Edge. Given a deposit was paid and cancellation is inside `refund_policy_hours`, When cancel runs, Then no automatic refund is issued and an owner decision task is created.

#### BKG-10 Walk-in wait quote
- Happy path. Given the earliest qualified technician is free in 18 minutes and padding is 5, When a quote is requested, Then the agent says "about 20 to 30 minutes".
- Error. Given the computed wait is 110 minutes and the ceiling is 90 with refusal on, When a quote is requested, Then no number is spoken; the agent offers an appointment or the waitlist.
- Edge. Given a quote is given and `hold_minutes_after_quote = 15`, When 15 minutes pass with no arrival, Then the hold expires, a `turn_events` row records the expiry, and the slot returns to the queue.

#### BKG-11 Deposits by link only
- Happy path. Given `deposits.enabled` and a trigger match, When the booking is created, Then a Stripe Payment Link is generated, an SMS is sent, and the booking sits at `pending_deposit` with the slot held.
- Error. Given the caller starts reading card digits, When the PAN filter fires, Then the transcript segment is redacted, the audio window is excluded, and the agent repeats the refusal string in the caller's language.
- Edge. Given the deposit is paid 40 seconds after `hold_minutes` expired and the slot was released, When the webhook arrives, Then the payment is refunded automatically as an unfulfillable hold and the owner is notified; the caller is not silently charged for a slot they do not have.

#### BKG-12 Waitlist
- Happy path. Given a cancellation at 11:00 with three matching waitlist entries, When backfill runs, Then all three are texted, the first accept wins, and the other two are told the slot went.
- Error. Given none of the three accept within `offer_window_minutes`, When the window closes, Then the slot returns to open availability and all three remain on the list at unchanged priority.
- Edge. Given a slot is released at 21:40 local time, When backfill runs, Then no SMS is sent until 08:00 local time the next day.

#### BKG-13 Spam screening
- Happy path. Given a number on the tenant block list, When it calls, Then the call is terminated before any recording, no minute is billed, and a `calls` row with `intent = 'spam_blocked'` is written.
- Error. Given the vendor-pitch classifier fires on a genuine customer, When the owner marks the call as a false positive, Then the ANI is allow-listed for that tenant and the classifier threshold for that tenant is logged for review.
- Edge. Given the same ANI triggers three classifier hits in 30 days, When the third hit lands, Then the number is auto-added to the block list with an owner-visible undo shown in the morning brief.

#### BKG-14 Human transfer
- Happy path. Given the caller says "let me talk to the owner", When transfer runs, Then `calls.summary` carries both `summary_en` and `summary_vi`, the manager receives an SMS preamble in their own language, and the call is bridged.
- Error. Given the manager does not answer within four rings, When the dial times out, Then the agent returns to the caller, apologizes, takes a message, and SMSes the owner; the caller is never dropped into an unanswered ring-out.
- Edge. Given `manager_phone` is null, When tools resolve, Then `transfer_to_human` is not emitted at all and the agent takes a message instead of promising a transfer.

#### ORD-01 Catalog precedence
- Happy path. Given an adapter with `canReadCatalog = true`, When the menu loads, Then adapter items are authoritative and local overrides apply only to `name_vi` and `aliases[]`.
- Error. Given the catalog fetch fails, When the menu loads, Then the last successful catalog snapshot is used, marked stale, and the agent avoids quoting prices for items changed in the last 24 hours.
- Edge. Given a local `menu_items` row has no adapter match, When an order includes it, Then it is committed as a free-text line item where the adapter allows one and otherwise routed to the fallback ticket.

#### ORD-02 86'd items
- Happy path. Given a stock webhook marks an item out of stock, When a caller orders it, Then the agent says it is unavailable and offers the nearest alternative.
- Error. Given the adapter provides no 86 signal and the owner has not marked availability, When a caller orders the item, Then the agent takes it but says the kitchen will confirm, and the confirmation SMS carries the same caveat.
- Edge. Given an item goes out of stock between read-back and commit, When commit returns `ITEM_UNAVAILABLE`, Then the order is committed without that line, the caller is told before the call ends if still connected, and otherwise is texted within 60 seconds.

#### ORD-03 Order read-back
- Happy path. Given a three-item order with modifiers, When the agent reads it back and the caller says yes, Then commit proceeds.
- Error. Given the caller corrects an item during read-back, When the correction is applied, Then the full order is read back again from the top before commit.
- Edge. Given an order at exactly `max_items_per_order`, When read-back runs, Then it is read in groups of five with a checkpoint after each group, and a caller "no" at any checkpoint restarts that group only.

#### ORD-04 Payment posture gate
- Happy path. Given a Toast tenant with pay-at-pickup, When commit runs, Then the order is created without a `payments` object and lands as an open check.
- Error. Given a SpotOn tenant with pay-at-pickup, When tools resolve, Then `place_order` is downgraded to fallback mode and no attempt is made to submit a DRAFT or OPEN order that would error out.
- Edge. Given a tenant switches to `prepaid_required`, When a caller orders, Then the agent takes the order, sends a Stripe link, and holds the order at `pending` until payment; the kitchen sees nothing before payment.

#### ORD-05 Injection confirmation honesty
- Happy path. Given Otter returns `injectionState = injected` within 3 seconds, When the agent closes, Then it says the restaurant has the order.
- Error. Given the adapter returns HTTP 200 but the confirmation webhook reports an error, When the error arrives, Then `orders.injection_state` moves to `injection_failed` while `orders.status` stays `confirmed`, the fallback ticket fires, and the owner is alerted within 30 seconds.
- Edge. Given no confirmation arrives within 6 seconds, When the agent closes, Then it says the order is placed and the restaurant will see it shortly, never that the kitchen has it, and the fallback channel fires in parallel.

#### ORD-06 Pickup quote
- Happy path. Given a baseline of 12 minutes and low queue pressure, When a quote is requested, Then the agent says "about 15 to 20 minutes" and the same range appears in the SMS.
- Error. Given queue pressure data is unavailable, When a quote is requested, Then the baseline plus a doubled safety pad is used and the quote is framed as a minimum.
- Edge. Given the restaurant is within 20 minutes of closing and the quote would exceed closing time, When a quote is requested, Then the agent declines the order and states the kitchen is closing.

#### ORD-07 Vietnamese dish names
- Happy path. Given a caller says "cho tôi một tô phở tái", When resolution runs, Then the item matching `name_vi = 'Phở tái'` is selected and read back with diacritics.
- Error. Given the utterance matches two registered confusable items, When resolution runs, Then the agent disambiguates explicitly by number and full name, and never guesses.
- Edge. Given a caller says "number fifteen", When resolution runs, Then the numeric alias resolves the item directly and the agent still reads back the full Vietnamese name for confirmation.

#### ORD-08 Escalation
- Happy path. Given a $180 order against a $150 threshold, When the agent computes the total, Then it stops, reads back, takes contact details, and escalates to the owner without committing.
- Error. Given the escalation SMS to the owner fails, When the send fails, Then a dashboard task is created, the failure is retried three times, and the caller is told the owner will call back rather than being promised a confirmed order.
- Edge. Given a caller mentions "đặt tiệc" inside an otherwise normal small order, When the catering trigger fires, Then the small order still commits and only the catering request escalates.

#### POS-01 Adapter conformance
- Happy path. Given a registered adapter, When the conformance suite runs, Then all five methods return schema-valid responses against the sandbox.
- Error. Given `capabilities()` returns a payload missing a required field, When the adapter is registered, Then registration fails and the adapter cannot be assigned to a tenant.
- Edge. Given a tenant's Toast employee permission lapses, When `capabilities()` next resolves, Then `canCommitOrder` flips to false, the tool downgrades to fallback, and the owner is told which permission to restore.

#### POS-02 Idempotency
- Happy path. Given a commit, When the key is computed, Then it is persisted on the row before the outbound call.
- Error. Given the process crashes between persist and call, When the job resumes, Then the same key is reused and the adapter deduplicates or Linh detects the existing external record before re-sending.
- Edge. Given the same caller books two different slots in one call, When keys are computed, Then they differ because `canonical_payload_json` differs, and both bookings are created.

#### POS-03 Rate limiting
- Happy path. Given a Zenoti tenant, When requests are issued, Then the client stays at or below 1 request per second per tenant and no 429 is observed over a 24-hour window.
- Error. Given a 429 with `Retry-After: 30`, When the client receives it, Then it waits exactly 30 seconds before the next attempt for that tenant and does not retry other tenants' requests into the same bucket.
- Edge. Given Otter order volume exceeds 32 per minute across all tenants, When the queue saturates, Then overflow orders route to the fallback ticket immediately rather than queueing behind a rate limit while a caller waits.

#### POS-04 Retry classification
- Happy path. Given `UPSTREAM_5XX` with `retryable = true`, When retry runs, Then it backs off exponentially with jitter for up to four attempts.
- Error. Given `VALIDATION_FAILED` with `retryable = false`, When the result is received, Then no retry occurs, the owner is alerted, and the caller is not told the booking or order succeeded.
- Edge. Given a retry succeeds after the caller has hung up, When success lands, Then the confirmation SMS is sent immediately, subject to quiet hours.

#### POS-05 Conflict reconciliation
- Happy path. Given no conflict, When sync runs, Then Linh and the POS agree and no task is created.
- Error. Given the POS reports a different time for the same booking, When `conflict_policy = 'manual_review'`, Then both versions render side by side in the dashboard with a one-tap resolution and neither is silently overwritten.
- Edge. Given a POS webhook reports a booking Linh never created, When it is ingested, Then it is stored with `source = 'pos'`, participates in availability, and does not accrue rotation credit until the owner links a technician.

#### POS-06 Tier C parallel ledger
- Happy path. Given a Zota salon on tier C, When a booking is created, Then Linh writes the record, sends an SMS ticket to the shop phone in the owner's language, and shows it on the Today board.
- Error. Given the SMS ticket fails to deliver, When delivery fails, Then the dashboard item is flagged undelivered, a push notification fires, and the item is force-listed at the top of the next morning brief.
- Edge. Given more than the configured cap of unreconciled tier C bookings exist for one technician on one day, When a new booking is attempted for that technician, Then the agent offers another technician or a different day, and the owner is alerted that reconciliation is overdue.

#### POS-07 Availability freshness
- Happy path. Given availability was fetched 12 seconds ago, When commit runs, Then the cached result is used.
- Error. Given availability was fetched 90 seconds ago, When commit runs, Then it is re-fetched first; if the slot has gone, the agent offers the next two slots without writing a booking.
- Edge. Given a Phorest tenant with no webhooks, When a call is active, Then `updated_at` polling runs at a 20-second interval for the duration of the call and reverts to the configured interval afterwards.

#### CMP-01 Recording before disclosure
- Happy path. Given any inbound call, When the media stream opens, Then recording starts before the first disclosure frame is emitted and `consent_events.recording_started_at` precedes `disclosure_played_at`.
- Error. Given recording fails to start, When the disclosure would play, Then the call proceeds in no-record mode, the disclosure is adjusted to state that the call is not being recorded, and an operator alert fires.
- Edge. Given a Washington caller, When the recording is later reviewed, Then the announcement is audibly present inside the recording at the start, satisfying RCW 9.73.030(3).

#### CMP-02 Consent artifact completeness
- Happy path. Given a recorded call, When it ends, Then a `consent_events` row exists with all twelve fields non-null.
- Error. Given any field is null at call end, When the nightly audit runs, Then the recording is deleted, the incident is logged, and the alert is treated as a severity-one defect.
- Edge. Given a call is transferred to a human mid-way, When the human leg is recorded, Then a second `consent_events` row is written for the human leg with its own `disclosure_version`.

#### CMP-03 All-party affirmative gate
- Happy path. Given a Maryland caller, When the disclosure completes and the caller says yes, Then `consent_response = 'accepted'` and the recording is retained.
- Error. Given the caller says no, When the response is captured, Then the recording is deleted within 60 seconds, `consent_response = 'declined'` is written, the deletion timestamp is stored, and the call continues unrecorded with the transcript also suppressed.
- Edge. Given the caller says nothing for 8 seconds after the consent question in an all-party posture, When the timeout fires, Then silence is treated as refusal, not as consent, and the recording is deleted.

#### CMP-04 No-record path
- Happy path. Given the caller presses 0 during the disclosure, When the keypress is received, Then the recording is deleted, the caller is routed to voicemail or a human with recording disabled, and the choice is logged.
- Error. Given voicemail is unavailable, When the caller presses 0, Then the call is transferred to `manager_phone` unrecorded, and if that is null the agent takes a text-only message with no audio retention.
- Edge. Given the caller presses 0 after consenting and mid-conversation, When the keypress is received, Then recording stops from that point, the prior consented segment is retained, and a second `consent_events` row records the mid-call withdrawal.

#### CMP-05 State inference
- Happy path. Given ANI area code 703 and a Virginia business, When posture resolves, Then `ONE_PARTY_ANNOUNCEMENT` is selected and the announcement still plays.
- Error. Given the ANI is withheld, non-NANP, or maps to no known state, When posture resolves, Then `ALL_PARTY` is selected.
- Edge. Given a 410 Maryland caller reaching a Virginia salon, When posture resolves, Then `ALL_PARTY` is selected because either side mapping to an all-party state forces the stricter posture.

#### CMP-06 AI identity disclosure
- Happy path. Given any inbound call, When the disclosure plays, Then it states in the caller's language that the caller is speaking with an automated AI assistant, and `disclosure_version` is recorded.
- Error. Given a tenant attempts to disable AI identity disclosure, When save runs, Then the request is rejected with the bilingual error and an audit row names the actor.
- Edge. Given a caller asks "am I talking to a real person?" at minute six, When the question is detected in either language, Then the agent answers immediately and truthfully that it is an automated assistant, before answering anything else.

#### CMP-07 PAN and CVV redaction
- Happy path. Given no card data is spoken, When the call ends, Then the transcript is unmodified and no redaction events are logged.
- Error. Given a caller speaks a 16-digit Luhn-valid number, When the detector fires, Then the transcript segment becomes `[REDACTED-PAN]`, the audio window is excluded from the stored recording, and a redaction event is logged without the value.
- Edge. Given a caller speaks a 16-digit confirmation code that fails Luhn, When the detector evaluates it, Then it is not redacted, and the false-negative and false-positive rates are reported monthly.

#### CMP-08 No card-collection tool
- Happy path. Given any tenant configuration, When the tool list is emitted, Then no tool accepting a card number exists.
- Error. Given a developer adds such a tool, When CI runs, Then a static check fails the build on the presence of card-field names in any tool schema.
- Edge. Given a tenant demands phone card capture as a sales condition, When the request is escalated, Then it is refused as a product boundary and the Stripe link flow is offered instead.

#### CMP-09 A2P gating
- Happy path. Given an approved campaign and a number in the sender pool, When an SMS is queued, Then it sends.
- Error. Given the campaign is pending, When an SMS is queued, Then it is held, not attempted, and the owner sees the pending-registration banner; no message reaches Twilio to be blocked by error 30034.
- Edge. Given a new phone number is added to a tenant after campaign approval, When an SMS is queued from it, Then the send is blocked until the number is confirmed in the sender pool.

#### CMP-10 STOP handling and revoke-all
- Happy path. Given a caller replies STOP, When the reply is received, Then all non-exempt messaging from that tenant to that number ceases immediately and exactly one confirmation is sent within five minutes.
- Error. Given a caller replies "please stop texting me", When the natural-language classifier fires, Then the same suppression applies and a rebuttable-presumption revocation event is logged.
- Edge. Given a caller opts out of reminders and later books again by phone, When the booking completes, Then no confirmation SMS is sent, the agent says so out loud, and the booking details are read back verbally instead.

#### CMP-11 Quiet hours
- Happy path. Given a reminder due at 10:00 recipient local time, When the scheduler runs, Then it sends.
- Error. Given a reminder due at 21:30 recipient local time, When the scheduler runs, Then it defers to 08:00 the next day and logs the deferral.
- Edge. Given the recipient's timezone cannot be derived from area code or tenant, When the scheduler runs, Then the send is deferred to a window that is inside 08:00 to 21:00 in every US timezone, which is 12:00 to 17:00 Eastern.

#### CMP-12 No voiceprint
- Happy path. Given any call, When the pipeline runs, Then no speaker embedding, diarization identity, or voice enrollment is created or stored.
- Error. Given a vendor feature flag that would enable speaker identification, When configuration is applied, Then the flag is explicitly set off and a CI assertion verifies it on every deploy.
- Edge. Given a tenant asks for voice authentication of staff, When the request is escalated, Then it is refused, with BIPA and CUBI cited, and a PIN-based alternative is offered.

#### CMP-13 Health utterance suppression
- Happy path. Given a call with no health content, When the transcript is written, Then it is written in full.
- Error. Given a caller says "I have toenail fungus", When the classifier fires, Then the segment is excluded from the persisted transcript, excluded from analytics, and never enters any tuning corpus; a non-content flag records that suppression occurred.
- Edge. Given the classifier is uncertain, When confidence is between the thresholds, Then the segment is suppressed by default, because a false suppression costs a service note and a false retention costs a private right of action.

#### CMP-14 Retention enforcement
- Happy path. Given audio older than 30 days, When the nightly job runs, Then it is deleted from primary storage and from backups within the published SLA.
- Error. Given the deletion job fails, When the failure is detected, Then it retries, alerts, and blocks the next deploy until resolved.
- Edge. Given a tenant sets `audio_retention_days = 0`, When a call ends, Then no audio is persisted at all and only the transcript and consent artifact survive.

#### CMP-15 ZDR endpoint restriction
- Happy path. Given call content is sent to `/v1/chat/completions`, When the request is issued, Then it succeeds under Zero Data Retention.
- Error. Given code attempts `/v1/files` with call content, When the client layer intercepts, Then the request is blocked and the build-time lint rule flags the call site.
- Edge. Given a new OpenAI endpoint is introduced, When it is used, Then it is denied by default until it is added to the allow list with a documented ZDR eligibility check.

#### CMP-16 Bilingual legal documents
- Happy path. Given the trust center is published, When a Vietnamese-reading owner visits, Then the privacy notice, terms, DPA and subprocessor table all render in Vietnamese at a static URL with no login.
- Error. Given a Vietnamese translation is missing for a section, When the page renders, Then the English text is shown with a visible untranslated marker and a defect is filed; the page is never shown as if it were fully translated.
- Edge. Given the English document is amended, When the change ships, Then the Vietnamese version is updated in the same release or the release is blocked.

---

## 12. User stories

Ordered by priority within each persona. Every story is independent, valuable, estimable, small and testable.

### 12.1 English-speaking salon caller

1. P0. As an English-speaking caller, I want to hear immediately that I am talking to an automated assistant and that the call is recorded, so that I can hang up if I object. Edge: I press 0 and reach voicemail with no recording.
2. P0. As an English-speaking caller, I want to book a specific technician by the name I know her by, so that I get the person who does my nails the way I like. Edge: I say "Tina" and the shop's records say Trinh; the alias table resolves it.
3. P0. As an English-speaking caller, I want to be told a realistic walk-in wait before I drive over, so that I do not sit for an hour. Edge: the shop is slammed and I am told it is too busy to quote rather than being given a number that turns out to be wrong.
4. P0. As an English-speaking caller, I want the agent to read my booking back to me, so that I know the day and time are right before I hang up.
5. P1. As an English-speaking caller, I want a text confirmation with the salon's address, so that I do not have to write anything down.
6. P1. As an English-speaking caller who cannot get the time I want, I want to go on a waitlist and be texted if it opens, so that I do not have to keep calling back.

### 12.2 Vietnamese-speaking restaurant caller

7. P0. As a Vietnamese-speaking caller, I want the recording and AI disclosure in Vietnamese, so that my consent means something. Edge: my first utterance is too short to classify and I hear both languages.
8. P0. As a Vietnamese-speaking caller, I want to order in Vietnamese using the dish names I actually say, so that I do not have to translate my own food. Edge: I say a regional variant the shop does not use and the alias table resolves it.
9. P0. As a Vietnamese-speaking caller, I want to pay when I pick up, so that I do not have to enter a card to get a bowl of phở. Edge: the restaurant's POS is prepaid-only and I get a printed ticket flow instead of a rejection.
10. P0. As a Vietnamese-speaking caller, I want the order read back to me in Vietnamese before it goes to the kitchen, so that a wrong item does not get cooked.
11. P1. As a Vietnamese-speaking caller, I want a realistic pickup time so I do not stand at the counter. Edge: the kitchen is backed up and my quote extends rather than being wrong.
12. P1. As a Vietnamese-speaking caller asking about a party of fifteen, I want to be handed to a person, so that nobody promises me a room that does not exist.

### 12.3 Vietnamese-speaking salon owner

13. P0. As a Vietnamese-speaking owner, I want the whole dashboard in Vietnamese, so that I can run my shop without translating. Note: Vinail is the only competitor with a stated Vietnamese management interface, and it is Europe-focused ([Vinail EN](https://vinail.net/en/nail-salon-software-for-vietnamese)).
14. P0. As a Vietnamese-speaking owner, I want turn rotation to follow my shop's rules with 0.25, 0.5 and 1.0 weights, so that my technicians do not fight about who got the walk-in.
15. P0. As a Vietnamese-speaking owner, I want to reward or subtract a turn manually with a reason, so that I can settle a situation the software cannot see.
16. P0. As a Vietnamese-speaking owner with no POS API, I want every phone booking pushed to me by text and shown on a Today board, so that nothing lives only inside a computer I cannot see.
17. P1. As a Vietnamese-speaking owner, I want a morning brief in Vietnamese at 8 a.m. telling me today's count, the first appointment, and anything unreconciled from yesterday.
18. P1. As a Vietnamese-speaking owner, I want to see how many spam calls were blocked and how many minutes that saved, so that I can tell whether this thing pays for itself.
19. P2. As a Vietnamese-speaking owner, I want to read the contract and privacy terms in Vietnamese, so that I know what I signed. No competitor offers this.

### 12.4 English-speaking salon manager

20. P0. As an English-speaking manager in a Vietnamese-owned shop, I want my dashboard in English while the owner's is in Vietnamese, so that we can both use the same system.
21. P0. As a manager taking a transferred call, I want the context summary in English on my phone before I pick up, so that the customer does not repeat herself.
22. P1. As a manager, I want to resolve a POS conflict with one tap, so that a double-booked chair gets fixed before the customer arrives.

### 12.5 Nail technician

23. P1. As a technician, I want the booking assigned to me to respect the turn order, so that I am not skipped while someone else takes three walk-ins.
24. P1. As a technician, I want my client-specific durations respected, so that my book is not padded with time I do not need.
25. P2. As a technician, I want to see my own day on my phone in Vietnamese or English, so that I know what is coming.

### 12.6 Restaurant kitchen

26. P0. As a kitchen worker, I want the ticket to carry the Vietnamese dish name with diacritics, so that I do not misread a transliteration mid-rush. No POS in the matrix supports Vietnamese natively.
27. P0. As a kitchen worker, I want an order that failed to inject into the POS to still reach me by printer or text, so that a caller who was told the order was placed actually gets food.
28. P1. As a kitchen worker, I want special instructions in Vietnamese preserved word for word, so that "không hành" means no onion and not something approximate.

---

## 13. Data model changes

All DDL is written against the existing Supabase schema defined in `build-prompts-customized.md`. Existing tables are altered, not replaced. Every table carries a one-line purpose comment.

```sql
-- ============================================================================
-- 0. Extensions and enums
-- ============================================================================
create extension if not exists pgcrypto;

create type rotation_mode      as enum ('off','fifo','clock_in','turn_credit','weighted_points');
create type queue_type         as enum ('fifo','clock_in','turn_credit','appointment_exempt',
                                        'appointment_counted','special_tech','locked','flexible_jump');
create type consent_posture    as enum ('all_party','one_party_announcement');
create type consent_response_t as enum ('accepted','declined','declined_system','announcement_only','withdrawn_mid_call');
create type adapter_tier       as enum ('A','B','C');
create type user_lang_or_both  as enum ('en','vi','en+vi');
create type sync_status        as enum ('injected','pending_retry','failed','not_applicable','manual_review');
create type user_lang          as enum ('en','vi');

-- ============================================================================
-- 1. Alterations to existing canonical tables
-- ============================================================================

-- businesses: module flags, assistant provider rename, consent defaults
alter table businesses
  add column if not exists modules jsonb not null default '{}'::jsonb,
  add column if not exists assistant_id text,
  add column if not exists assistant_provider text not null default 'retell',
  add column if not exists state_code char(2),
  add column if not exists default_consent_posture consent_posture not null default 'all_party';

comment on column businesses.modules is
  'Feature-flag document validated against business-modules-v1.json. Drives assistant tool generation.';

-- Backfill assistant_id from the legacy vapi_assistant_id column, then keep both
-- in sync for one release before dropping the old column.
update businesses set assistant_id = vapi_assistant_id where assistant_id is null;

create index if not exists idx_businesses_modules_gin on businesses using gin (modules jsonb_path_ops);

-- bookings: technician linkage, deposits, estimation flags, sync state, history
alter table bookings
  add column if not exists technician_id uuid,
  add column if not exists service_id uuid,
  add column if not exists duration_estimated boolean not null default false,
  add column if not exists idempotency_key text,
  add column if not exists pos_external_id text,
  add column if not exists source text not null default 'linh',      -- 'linh' | 'pos' | 'manual'
  add column if not exists rotation_reason text,                     -- 'requested' | 'rotation' | 'only_qualified'
  add column if not exists history jsonb not null default '[]'::jsonb;

-- The canonical bookings.status set is 'confirmed','cancelled','completed','no_show'.
-- Two transient states are added; no existing value changes meaning.
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check check (
  status in ('pending','pending_deposit','confirmed','cancelled','completed','no_show'));

create unique index if not exists uq_bookings_idempotency
  on bookings (business_id, idempotency_key) where idempotency_key is not null;
create index if not exists idx_bookings_tech_date on bookings (technician_id, appointment_date);

-- orders: idempotency and injection observability
alter table orders
  add column if not exists idempotency_key text,
  add column if not exists fulfillment_type text not null default 'pickup',
  add column if not exists quoted_ready_at timestamptz,
  add column if not exists injection_state text                      -- adapter sub-state; orders.status is unchanged
    check (injection_state is null or injection_state in
           ('accepted','injected','injection_failed','fallback_sent','manual_injection_required')),
  add column if not exists prepaid boolean not null default false;

create unique index if not exists uq_orders_idempotency
  on orders (business_id, idempotency_key) where idempotency_key is not null;

-- calls: consent linkage and screening outcome
alter table calls
  add column if not exists consent_event_id uuid,
  add column if not exists screened_as text,                         -- null | 'spam_blocked' | 'spam_silent' | 'spam_pitch'
  add column if not exists billable boolean not null default true;

-- customers: duration multiplier and marketing consent
alter table customers
  add column if not exists duration_multiplier numeric(4,2) not null default 1.00,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists do_not_contact boolean not null default false;

-- messages: consent and quiet-hours audit
alter table messages
  add column if not exists campaign_id text,
  add column if not exists deferred_for_quiet_hours boolean not null default false,
  add column if not exists revocation_event boolean not null default false;

-- ============================================================================
-- 2. New tables — salon
-- ============================================================================

-- technicians: the people who do the work; the unit of rotation and of booking.
create table technicians (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  display_name       text not null,
  aliases            text[] not null default '{}',
  languages          text[] not null default '{en}',
  is_active          boolean not null default true,
  special_tech       boolean not null default false,
  queue_type_override queue_type,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_technicians_business on technicians (business_id) where is_active;

-- services: what the shop sells, with the duration model the booking engine needs.
create table services (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references businesses(id) on delete cascade,
  name_en                 text not null,
  name_vi                 text,
  category                text,
  price_cents             integer not null default 0,
  base_duration_minutes   integer,
  buffer_before_minutes   integer not null default 0,
  buffer_after_minutes    integer not null default 0,
  turn_factor             numeric(3,2) not null default 1.00 check (turn_factor in (0.25,0.50,1.00)),
  gap_fillable            boolean not null default false,
  requires_skill          boolean not null default true,
  pos_external_id         text,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now()
);
create index idx_services_business on services (business_id) where is_active;

-- technician_services: who can do what, and how fast.
create table technician_services (
  technician_id             uuid not null references technicians(id) on delete cascade,
  service_id                uuid not null references services(id) on delete cascade,
  duration_override_minutes integer,
  proficiency               smallint not null default 3 check (proficiency between 1 and 5),
  primary key (technician_id, service_id)
);

-- turn_queue: current rotation state per technician per business day.
create table turn_queue (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  technician_id      uuid not null references technicians(id) on delete cascade,
  queue_date         date not null,
  queue_type         queue_type not null default 'turn_credit',
  credit_points      numeric(8,2) not null default 0,
  clock_in_at        timestamptz,
  locked             boolean not null default false,
  carry_over_enabled boolean not null default false,
  updated_at         timestamptz not null default now(),
  unique (business_id, technician_id, queue_date)
);
create index idx_turn_queue_lookup on turn_queue (business_id, queue_date, credit_points);

-- turn_events: append-only ledger of every change to rotation state, for disputes.
create table turn_events (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  technician_id uuid not null references technicians(id) on delete cascade,
  booking_id    uuid references bookings(id) on delete set null,
  event_type    text not null,        -- 'earn'|'reward'|'subtract'|'reset'|'carry_over'|'walkin_hold'|'hold_expired'
  points_delta  numeric(6,2) not null default 0,
  reason        text,
  actor_user_id uuid,                 -- null only for system 'earn' events
  created_at    timestamptz not null default now()
);
create index idx_turn_events_tech on turn_events (technician_id, created_at desc);

-- availability_blocks: shifts, breaks, vacations and manual blocks per technician.
create table availability_blocks (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  technician_id uuid references technicians(id) on delete cascade,
  kind          text not null check (kind in ('shift','break','vacation','block')),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  note          text,
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index idx_blocks_tech_window on availability_blocks (technician_id, starts_at, ends_at);

-- waitlist: callers who want a slot that does not exist yet.
create table waitlist (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  customer_id         uuid references customers(id) on delete set null,
  customer_phone      text not null,
  service_id          uuid references services(id) on delete set null,
  technician_pref     text not null default 'any' check (technician_pref in ('any','specific','list')),
  technician_ids      uuid[] not null default '{}',
  window_start        timestamptz not null,
  window_end          timestamptz not null,
  priority            smallint not null default 0,
  status              text not null default 'active'
                        check (status in ('active','offered','accepted','expired','cancelled')),
  last_offered_at     timestamptz,
  created_at          timestamptz not null default now()
);
create index idx_waitlist_active on waitlist (business_id, status, window_start);

-- deposits: Stripe-hosted deposit lifecycle. No card data is ever stored here.
create table deposits (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null references businesses(id) on delete cascade,
  booking_id             uuid not null references bookings(id) on delete cascade,
  amount_cents           integer not null check (amount_cents > 0),
  currency               char(3) not null default 'USD',
  stripe_payment_link_id text,
  stripe_session_id      text,
  status                 text not null default 'link_sent'
                           check (status in ('link_sent','paid','expired','refunded','failed')),
  expires_at             timestamptz not null,
  paid_at                timestamptz,
  created_at             timestamptz not null default now()
);
create index idx_deposits_booking on deposits (booking_id);

-- ============================================================================
-- 3. New tables — restaurant
-- ============================================================================

-- menu_items: the dish catalog, with the four-name model Vietnamese ASR requires.
create table menu_items (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  name_vi         text,
  name_en         text not null,
  name_pos        text,
  aliases         text[] not null default '{}',
  menu_number     text,
  category        text,
  price_cents     integer not null default 0,
  prep_weight_minutes smallint not null default 0,
  available       boolean not null default true,
  pos_external_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_menu_items_business on menu_items (business_id) where available;
create index idx_menu_items_aliases on menu_items using gin (aliases);

-- menu_modifiers: modifier groups and options attached to a menu item.
create table menu_modifiers (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  menu_item_id      uuid not null references menu_items(id) on delete cascade,
  group_name_en     text not null,
  group_name_vi     text,
  option_name_en    text not null,
  option_name_vi    text,
  price_delta_cents integer not null default 0,
  min_selections    smallint not null default 0,
  max_selections    smallint not null default 1,
  pos_external_id   text
);
create index idx_menu_modifiers_item on menu_modifiers (menu_item_id);

-- order_items: normalized line items; the orders.items JSONB stays as the call-time snapshot.
create table order_items (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  order_id          uuid not null references orders(id) on delete cascade,
  menu_item_id      uuid references menu_items(id) on delete set null,
  name_snapshot_vi  text,
  name_snapshot_en  text not null,
  quantity          smallint not null check (quantity > 0),
  unit_price_cents  integer not null,
  modifier_ids      uuid[] not null default '{}',
  note_vi           text,
  note_en           text
);
create index idx_order_items_order on order_items (order_id);

-- ============================================================================
-- 4. New tables — platform
-- ============================================================================

-- pos_adapters: one row per tenant per connected POS, with cached capabilities.
create table pos_adapters (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  adapter_id          text not null,           -- 'square_bookings' | 'toast_orders' | 'otter' | 'tier_c_parallel' ...
  tier                adapter_tier not null,
  vertical            text not null check (vertical in ('salon','restaurant')),
  status              text not null default 'pending'
                        check (status in ('pending','connected','degraded','revoked')),
  external_location_id text,
  credentials_ref     text not null,           -- vault reference. Never the secret itself.
  capabilities_cache  jsonb not null default '{}'::jsonb,
  capabilities_fetched_at timestamptz,
  last_health_at      timestamptz,
  last_sync_cursor    text,                    -- Phorest updated_at, Toast paging cursor, etc.
  created_at          timestamptz not null default now(),
  unique (business_id, adapter_id)
);

-- pos_sync_log: every outbound adapter write and its outcome. The reconciliation spine.
create table pos_sync_log (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  adapter_id     text not null,
  entity_type    text not null check (entity_type in ('booking','order','catalog','availability')),
  entity_id      uuid,
  idempotency_key text,
  direction      text not null check (direction in ('outbound','inbound')),
  status         sync_status not null,
  error_code     text,
  attempt        smallint not null default 1,
  request_digest text,                          -- hash only; never the payload
  external_id    text,
  created_at     timestamptz not null default now()
);
create index idx_pos_sync_pending on pos_sync_log (business_id, status, created_at)
  where status in ('pending_retry','manual_review');

-- consent_events: append-only proof of what each caller was told, in which language.
create table consent_events (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  call_id             uuid references calls(id) on delete set null,
  ani_e164            text,
  inferred_state      char(2),
  posture             consent_posture not null,
  disclosure_version  text not null,
  disclosure_language user_lang_or_both not null,
  disclosure_played_at timestamptz,
  disclosure_completed boolean not null default false,
  consent_response    consent_response_t not null,
  recording_started_at timestamptz,
  recording_deleted_at timestamptz,
  created_at          timestamptz not null default now()
);
create index idx_consent_call on consent_events (call_id);
create index idx_consent_business_time on consent_events (business_id, created_at desc);

-- module_config: versioned history of every module change, for support and audit.
create table module_config (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  modules        jsonb not null,
  changed_by     uuid,
  change_reason  text,
  tools_hash     text not null,
  created_at     timestamptz not null default now()
);
create index idx_module_config_business on module_config (business_id, created_at desc);

-- user_preferences: language is per user, not per business. Owner VI, manager EN, same tenant.
create table user_preferences (
  user_id           uuid primary key,
  business_id       uuid not null references businesses(id) on delete cascade,
  language          user_lang not null default 'en',
  role              text not null default 'staff' check (role in ('owner','manager','staff')),
  notify_sms        boolean not null default true,
  notify_push       boolean not null default true,
  notify_phone_e164 text,
  morning_brief     boolean not null default false,
  created_at        timestamptz not null default now()
);
create index idx_user_prefs_business on user_preferences (business_id);

-- ============================================================================
-- 5. Deferred foreign keys — added after the referenced tables exist
-- ============================================================================
alter table bookings
  add constraint fk_bookings_technician foreign key (technician_id)
    references technicians(id) on delete set null,
  add constraint fk_bookings_service    foreign key (service_id)
    references services(id) on delete set null;

alter table calls
  add constraint fk_calls_consent_event foreign key (consent_event_id)
    references consent_events(id) on delete set null;

alter table pos_sync_log
  add constraint fk_sync_adapter foreign key (business_id, adapter_id)
    references pos_adapters(business_id, adapter_id) on delete cascade;
```

### RLS policy notes

Every new table follows the tenant-isolation pattern already established for the canonical tables:

```sql
alter table technicians          enable row level security;
alter table services             enable row level security;
alter table technician_services  enable row level security;
alter table turn_queue           enable row level security;
alter table turn_events          enable row level security;
alter table availability_blocks  enable row level security;
alter table waitlist             enable row level security;
alter table deposits             enable row level security;
alter table menu_items           enable row level security;
alter table menu_modifiers       enable row level security;
alter table order_items          enable row level security;
alter table pos_adapters         enable row level security;
alter table pos_sync_log         enable row level security;
alter table consent_events       enable row level security;
alter table module_config        enable row level security;
alter table user_preferences     enable row level security;

-- Standard tenant policy, applied to every table above that has business_id.
create policy tenant_isolation on technicians
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- technician_services has no business_id; it inherits through technician_id.
create policy tenant_isolation_ts on technician_services
  using (technician_id in (
    select t.id from technicians t
    join businesses b on b.id = t.business_id
    where b.owner_id = auth.uid()));
```

Four exceptions to the standard pattern:

1. `consent_events` is append-only for every role. No UPDATE or DELETE policy exists for tenant users; only the retention service role may write `recording_deleted_at`. This is the table an audit will ask for.
2. `turn_events` is append-only for the same reason: rotation disputes are settled by the ledger, and a ledger a manager can edit is not a ledger.
3. `pos_adapters.credentials_ref` is never selectable by tenant users; the column is excluded from the tenant-facing view and the secret lives in a vault, not in Postgres.
4. `pos_sync_log.request_digest` stores a hash, never the payload, so a support engineer reading sync history cannot read a customer's order or a caller's phone number.

Additional indexes on the existing canonical tables, per the original schema plus what this document needs: `calls(business_id, created_at)`, `bookings(business_id, appointment_date)`, `bookings(technician_id, appointment_date)`, `customers(business_id, phone)`, `orders(business_id, created_at)`, and the partial index on `pos_sync_log` for the pending-retry and manual-review queues.

---

## 14. Success metrics

### 14.1 Leading indicators

| Metric | Baseline | Target | Method | Evaluate |
|---|---|---|---|---|
| Booking completion rate | To be measured on design partners; no credible industry baseline exists in the research | 85% of `intent = 'appointment'` calls reach `outcome = 'booked'` | `calls` joined to `bookings` | Weekly from Phase 2 |
| Named-technician booking share | 0% across integrable competitors (section 1.2 gap 6) | 60% of salon bookings carry a non-null `technician_id` with `rotation_reason` recorded | `bookings.technician_id` | Weekly |
| Vietnamese booking-field correction rate | Unknown | Below 8% over a rolling 200 Vietnamese calls; breaching this triggers the Option B migration | Owner edits to name, phone or time within 24 hours of creation | Rolling |
| Order injection success | Unknown | 90% reach `pos_sync_log.status = 'injected'` within 20 seconds | `pos_sync_log` | Weekly from Phase 3 |
| Fallback ticket delivery | n/a | 100% of `injection_failed` orders produce a delivered fallback ticket within 60 seconds | `messages` joined to `orders` | Continuous |
| Walk-in quote accuracy | Unknown | Actual seat time inside the quoted range on 75% of honored quotes | `turn_events` walk-in hold versus service start | Monthly |
| Spam calls screened and minutes saved | Bukkii publishes 37K+ filtered ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon)); Smith.ai 20M+ blocked ([Smith.ai](https://smith.ai/ai-receptionist)) — neither per-salon | Report per tenant per month in the morning brief; no target, this is a value-demonstration metric | `calls.screened_as`, `calls.billable` | Monthly |
| Human transfer rate | Unknown | Below 12% of answered calls, excluding intentional escalations | `calls.outcome` | Weekly |
| Time to first value | Kea sets up "in a day, not 8-12 weeks" ([kea.ai](https://kea.ai/)); Serviio "live in under an hour" ([serviio.ai](https://serviio.ai/)); Bite Buddy "live in less than a day" ([bitebuddy.ai](https://bitebuddy.ai/)) | Under 60 minutes from signup to first answered call for a tier C salon | Onboarding funnel timestamps | Per tenant |

### 14.2 Compliance metrics

These are alerts, not dashboard tiles. A miss is an incident.

| Metric | Target | Method |
|---|---|---|
| Disclosure play rate | 100.0% of answered calls | `consent_events.disclosure_completed = true` divided by answered `calls` |
| Consent audit completeness | 100.0% of recorded calls have all twelve `consent_events` fields non-null | Nightly audit job; any miss deletes the recording and raises severity one |
| Disclosure language match | 100.0% of calls where `consent_events.disclosure_language` equals `calls.language_detected`, or `en+vi` | Nightly audit |
| Spoken card data incidents | Zero | Count of PAN detector hits that were not redacted before persistence; target zero, measured by adversarial test suite plus production redaction logs |
| Quiet-hours violations | Zero | Count of `messages` sent outside 08:00 to 21:00 recipient local time |
| Unregistered SMS attempts | Zero | Count of Twilio error 30034 responses ([Twilio error 30034](https://www.twilio.com/docs/api/errors/30034)) |
| Retention overruns | Zero objects past their schedule at the nightly check | Storage lifecycle audit against section 9.9 |
| Voiceprint features enabled | Zero, asserted on every deploy | CI assertion over vendor configuration |

### 14.3 Lagging indicators

| Metric | Baseline | Target | Method | Evaluate |
|---|---|---|---|---|
| Tenant retention, unpriced | Market norm is month-to-month with no contracts ([upmysalon.com](https://upmysalon.com/), [RingBooker pricing](https://ringbooker.com/pricing)); Linh has no price at all during the free rollout (NG8) | 90% of design partners still answering live calls at month three. Retention here measures whether the product is wanted, not whether it is affordable — those two questions cannot be separated once a price exists, which is a second reason to stay unpriced while stability is unknown | Count of tenants with at least one answered call in the trailing 14 days | Quarterly |
| Stability trend | Unknown; no production data | The G6 bar held for four consecutive weeks | Weekly stability rollup | Weekly |
| Blended cost per answered minute | $0.11 modeled ([Retell pricing](https://www.retellai.com/pricing)) | At or below $0.12 actual | Vendor invoices divided by answered minutes | Monthly |
| Recovered bookings per salon per month | Unknown | Report the count and the dollar value using the tenant's own service prices | `bookings` created outside staffed hours or during a busy-signal window | Monthly |
| Owner-reported Vietnamese comprehension complaints | Unknown | Fewer than 1 per tenant per month | Support tickets tagged `vi_quality` | Monthly |

---

## 15. Rollout plan

Sell salons first. Restaurants are crowded — Slang AI at $68M raised and 2,000-plus locations ([PR Newswire on Slang's Series B](https://www.prnewswire.com/news-releases/slang-ai-raises-36m-series-b-to-scale-ai-for-guest-communications-across-every-restaurant-302695306.html)), Hostie at $16M total ([PR Newswire on Hostie's Series A](https://www.prnewswire.com/news-releases/hostie-raises-12m-series-a-to-power-the-future-of-restaurant-hospitality-302820521.html)), Maple at 1,000-plus merchant locations and 1M-plus calls ([Business Wire on Maple and Quantic](https://www.businesswire.com/news/home/20260424097043/en/Maple-and-Quantic-Partner-to-Bring-AI-Phone-Ordering-to-Thousands-of-Restaurants)), Bite Buddy, Kea, Loman, Serviio all shipping. Salons are unserved: the Vietnamese nail niche has no scaled winner, the largest published number is Bukkii's "1,000+ salons" ([bukkii.ai](https://www.bukkii.ai/)), and Tilavon is capped at 50 beta salons ([Tilavon pricing](https://tilavon.com/pricing)).

Keep Lantern House, the Vietnamese restaurant at Reston and Falls Church already running on the existing gateway, as the single restaurant design partner. It is the founder's real customer and the reason the restaurant path exists at all.

| Phase | Duration | Deliverable | Exit criteria |
|---|---|---|---|
| Phase 0 — Month 0, week 1 | 1 week | Compliance front door shipped: recording-before-disclosure, bilingual disclosure, consent artifact, state inference, PAN redaction, no-voiceprint assertion. A2P 10DLC Standard brand submitted. Retell BAA and DPA signed at [click-agreements.retellai.com](https://click-agreements.retellai.com/). Toast, Otter and ItsaCheckmate partner applications all filed the same week, since all three are free to apply and all three have multi-week queues. | Every CMP P0 in section 11.6 passes its acceptance criteria against a staging line. A2P brand submitted. Three partner applications acknowledged. |
| Phase 1 — Month 0 to 1 | 4 weeks | Salon booking on the tier C parallel ledger. Two Eden Center design-partner salons live on closed Vietnamese stacks (Zota or Tilavon or SICUS installs). Vietnamese owner dashboard, per-user language, morning brief, spam screen, waitlist. | Two salons answering live calls. 50 bookings created. Disclosure play rate 100.0%. Unreconciled tier C items under 5% at 24 hours. |
| Phase 2 — Month 1 to 3 | 8 weeks | Square Appointments native adapter. Zenoti and Mindbody adapters behind a flag. Rotation engine with both Zota queue types and Vinail weighted points, plus the owner rotation ledger UI. Deposits via Stripe Payment Link. | Named-technician booking share above 60%. One Square salon live natively. Zero double-books attributable to Linh. |
| Phase 3 — Month 2 to 4, overlapping | 8 weeks | Restaurant ordering. Square native for Square restaurants. Otter Orders integration built and in its 1-location pilot with Lantern House, since Otter is the only documented route to MenuSifu ([Otter x MenuSifu](https://www.tryotter.com/integrations/menusifu)) and MenuSifu is the largest Asian POS at 15,000-plus restaurants ([MenuSifu About](https://www.menusifu.com/about-us)). Vietnamese dish-name layer with alias and confusable-pair handling. | Lantern House taking Vietnamese phone orders end to end. Otter pilot at two clean consecutive weeks. Order injection success above 90%. |
| Phase 4 — Month 4 to 6 | 8 weeks | Toast certification completed through alpha at one restaurant for one week and beta at three to five locations ([Toast integration dev process](https://doc.toasttab.com/doc/devguide/integrationDevProcess.html)). ItsaCheckmate adapter for the long tail at a published $85 to $100 per location per month ([Checkmate pricing](https://support.itsacheckmate.com/hc/en-us/articles/8105450179867-Checkmate-Pricing)). Otter to Early Adoption at five more locations. | Toast general availability. Ten active tenants. Blended cost per minute at or below $0.12. Stability bar (G6) held for four consecutive weeks. |
| Phase 5 — Month 6 to 12 | 24 weeks | Clover App Market listing for the 70% developer royalty and in-market billing ([Clover developers](https://www.clover.com/developers)). Deliverect evaluated only if enough Chowbus restaurants are in the pipeline to justify an opaque-priced eight-component certification ([Deliverect channel integration](https://developers.deliverect.com/docs/building-a-channel-integration-overview)). SOC 2 Type I. Vietnamese trust center complete. | Thirty active tenants. SOC 2 Type I report issued. Vietnamese DPA and terms published. Pricing decision (OQ-10) taken, or explicitly deferred again with a reason. |

Sequencing rationale in one line: Square is the only self-serve path in either matrix and costs nothing but engineering time ([Square OAuth API](https://developer.squareup.com/docs/oauth-api/overview)); everything else has a queue, so the queues start on day one and the product ships against tier C in parallel.

### 15.1 Free rollout terms

Linh rolls out free. No price is listed, no rate is quoted, no card is collected, and no end date is shown or stored. This is not a growth tactic borrowed from the category — Smith.ai runs a conventional free tier of 5 calls per month ([Smith.ai pricing](https://smith.ai/pricing)) and Goodcall runs a 14-day trial ([Goodcall pricing](https://www.goodcall.com/pricing)) — it is a consequence of not yet knowing how stable the system is. A trial countdown implies the product will be worth paying for when the clock runs out. That claim is not yet supportable.

What the owner is told, verbatim:

> English: "Linh is free while we're getting her right in your shop. There's no card, no contract, and no end date. If she's not helping, turn her off and we'll take the number back the same day. When she's solid and you want to keep her, we'll talk about what that looks like then."
>
> Vietnamese: "Linh miễn phí trong lúc tụi em chỉnh cho hợp với tiệm mình. Không cần thẻ, không hợp đồng, không có ngày hết hạn. Nếu thấy không giúp được gì, mình tắt đi là tụi em trả số lại ngay trong ngày. Khi nào Linh chạy ổn và anh chị muốn giữ, lúc đó mình nói chuyện sau."

Operating rules during the free rollout:

1. No `free_test_ends_at`, `trial_ends_at`, `plan_id`, or `price_cents` column on `businesses`. Absence is enforced by a schema assertion in CI, so a countdown cannot be added casually.
2. Two to four weeks per shop is the internal working estimate for how long a design partner needs to form a real opinion. It lives in this document and in the founder's outreach notes. It is never surfaced to the owner and never enforced in code.
3. Same-day off-ramp is a hard commitment: if an owner asks to stop, forwarding is reverted and the number released that day, and the retention schedule in section 9.9 continues to run on whatever was already captured.
4. Concurrency, not calendar, is the real constraint. At the G4 blended cost of $0.12 per answered minute against the $5,000 monthly ceiling, roughly 45,000 conversation minutes per month exist in total. Onboarding is gated on measured minutes-per-tenant, not on a target tenant count.
5. Free does not soften any obligation in section 9. Consent, disclosure, quiet hours, A2P registration, PCI boundary and retention apply identically to an unpriced tenant. Nothing in TCPA, Md. Cts. & Jud. Proc. § 10-402, or MODPA turns on whether money changed hands.
6. Pricing reopens only when the G6 stability bar has held four consecutive weeks (OQ-10). Until then the honest answer to "how much will it cost" is that we do not know yet, and saying so is better positioning than a number we would have to walk back.

---

## 16. Risks and open questions

### 16.1 Risks

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Bukkii AI (AIVA) is already shipping the exact salon feature set: per-technician booking by skill, walk-in wait times, deposit handling on its top tier, a published "37K+ Spam calls filtered", a full Vietnamese site at /vi, and a claim of "1,000+ salons" ([Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon), [bukkii.ai/vi](https://www.bukkii.ai/vi), [bukkii.ai](https://www.bukkii.ai/)). | High | High | Attack the two published weaknesses: an independent review reports it books into its own site and Reserve with Google rather than Vagaro or Boulevard and does not capture deposits itself ([stork.ai](https://www.stork.ai/en/bukkii-ai-aiva)), and it publishes nothing on state-aware consent, retention or a Vietnamese legal document. Sell the compliance surface and real third-party calendar writes. | Tim Do |
| R2 | Tilavon bundles POS plus full Vietnamese UI plus AI receptionist across four languages with deposits, at $69 to $199 per month with $0.30 per minute overage, and is capped at 50 beta salons ([Tilavon pricing](https://tilavon.com/pricing), [Tilavon features](https://tilavon.com/features)). | Medium | High | It is a closed stack — "All SMS features are built into the platform — no separate Twilio account needed" ([Tilavon integrations](https://tilavon.com/integrations)) — so it requires the salon to switch POS. Linh does not. Target the 5,000-plus Zota installs and the 2,500-plus SICUS installs that will not rip out their POS. | Tim Do |
| R3 | Zenoti, GlossGenius and Fresha ship first-party AI receptionists, so integration partnerships with them are structurally unavailable ([Zenoti AI Receptionist](https://www.zenoti.com/ai-workforce/ai-receptionist), [GlossGenius Reception](https://glossgenius.com/reception), [Fresha AI Concierge](https://www.fresha.com/help-center/knowledge-base/calendar/101702-ai-concierge-overview)). | High | Medium | Treat Zenoti as tactical: the salon mints its own API key with a "Bot" source-app type, so no vendor consent is required ([Zenoti API key setup](https://help.zenoti.com/en/zenoti-apis/create-the-backend-app-and-generate-a-new-api-key.html)). Do not build a Fresha or GlossGenius path at all. | Tim Do |
| R4 | Otter certification slips and MenuSifu remains unreachable. Certification is six steps with a 1-location pilot and a 5-location early-adoption phase, each needing two clean consecutive weeks ([Otter integrated partner process](https://helpdesk.tryotter.com/hc/en-us/articles/22695702216979-Integrated-Partner-Process)). | Medium | High | Apply in Phase 0. Ship the fallback ticket channel first so MenuSifu restaurants are serviceable without any API. ItsaCheckmate is the hedge for the long tail. | Tim Do |
| R5 | A recording-consent claim in Maryland or California. Maryland is felony-grade at up to 5 years and $10,000 plus a mandatory $500 civil fine ([Md. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/)); California allows the greater of $5,000 per violation or 3x damages with no actual damages required ([Cal. Penal Code § 637.2](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2)). | Low if CMP-01 through CMP-05 hold | Existential | The consent front door is non-bypassable, the artifact is complete, and refusal deletes the recording. The 100.0% disclosure play rate is an alert, not a KPI. | Tim Do |
| R6 | A caller reads a card number aloud despite the refusal, and it lands in a transcript or an LLM provider's logs. | Medium | High | In-flight PAN and CVV redaction (CMP-07), ZDR-only OpenAI endpoints (CMP-15), and Retell PII exclusion with minimum retention ([Retell compliance](https://docs.retellai.com/general/compliance)). | Tim Do |
| R7 | Retell changes Vietnamese support, pricing, or its data terms. Vendor concentration risk on the one platform that names `vi-VN` first-class ([Retell language support](https://docs.retellai.com/build/language-support)). | Low | High | Option B (Pipecat self-hosted) is specified, not aspirational, with four explicit migration triggers in section 5.4 plus a fifth added 1 August 2026: Retell declining to contractually exclude model training while recording remains enabled (OQ-2). The adapter and tool layers are provider-agnostic. | Tim Do |
| R8 | Deepgram deprecates Nova-3 Vietnamese in favor of Flux, which has no Vietnamese at all ([Deepgram Flux multilingual](https://deepgram.com/learn/introducing-flux-multilingual)). | Medium | Medium | Monitor the Deepgram model lifecycle. ElevenLabs Scribe v2 Realtime is the drop-in alternative and is the only ASR found that natively ingests μ-law 8 kHz ([ElevenLabs models](https://elevenlabs.io/docs/models)). | Tim Do |
| R9 | Tier C reconciliation debt: owners stop marking items and the parallel ledger drifts. | High | Medium | Cap concurrent unreconciled bookings per technician per day, force unreconciled items to the top of the morning brief, and make reconciliation a one-tap SMS reply. | Tim Do |
| R10 | A2P 10DLC campaign review takes the full 10 business days and blocks SMS at launch ([Twilio: What is A2P 10DLC](https://help.twilio.com/articles/1260800720410-What-is-A2P-10DLC-)). | High | Medium | Submit in Phase 0 week 1. Ship the voice product without SMS if necessary; the validation matrix already blocks `sms_reminders` until the campaign is approved. | Tim Do |
| R11 | Deliverect has partnered with SoundHound on automated restaurant voice ordering ([PR via Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/deliverect-soundhound-ai-partner-turn-123000067.html)), which means a direct competitor is already inside the Chowbus channel. | Medium | Low at launch | Deliverect is Phase 5 and conditional. Chowbus does not list Vietnamese among its five languages anyway ([Chowbus](https://www.chowbus.com/blog/the-best-chinese-restaurant-pos-system-in-2026)). | Tim Do |
| R12 | Budget overrun above $5,000 per month. | Low at launch volume | Medium | At $0.11 per minute the ceiling is roughly 45,000 minutes ([Retell pricing](https://www.retellai.com/pricing)). Alert at 60% of budget; the premium LLM tier is the main escalation path and is capped by configuration. | Tim Do |
| R13 | Unpriced rollout with unknown stability: cost is uncapped per tenant while revenue is zero, and one heavy-volume salon can consume a disproportionate share of the 45,000-minute ceiling. This is R12 with the revenue side removed, which is what makes it materially worse. | High | Medium | Per-tenant monthly minute alerting at 50%, 75% and 90% of an assigned allocation; onboarding gated on measured minutes-per-tenant rather than on a tenant count; screened spam minutes excluded from tenant load per BKG-13; hard stop on new onboarding at 80% of the ceiling. | Tim Do |
| R14 | Free with no end date is read as "free forever," making the eventual pricing conversation feel like a bait and switch. | Medium | High | The owner script in section 15.1 states plainly that a conversation happens later, and it is repeated at the first monthly value recap. No language anywhere implies permanence. Because pricing only reopens after the stability bar holds, the conversation arrives attached to demonstrated reliability rather than to a calendar. | Tim Do |
| R15 | Design partners tolerate instability because the product is free, so the G6 bar is met on paper while owners quietly stop routing real calls to Linh. | Medium | High | G6 is measured across live tenants only, and the retention metric in section 14.3 counts tenants with at least one answered call in the trailing 14 days. A tenant that goes quiet drops out of both, so silent abandonment surfaces as a failed bar rather than a passed one. | Tim Do |

### 16.2 Open questions

| # | Question | Blocking? | Owner | Decision deadline |
|---|---|---|---|---|
| OQ-1 | Did any 2026 Maryland session bill amend Md. Cts. and Jud. Proc. § 10-402? Only the November 2025 committee briefing was found ([WYPR](https://www.wypr.org/wypr-news/2025-11-20/maryland-considers-altering-its-recording-consent-and-evidence-laws)). | Blocking for the consent-posture table only; the all-party default is safe either way | Tim Do | Before Phase 1 |
| OQ-2 | **Partly answered, 1 August 2026 — answer is unfavourable.** Retell's ToS states it trains on Communications and User Content unless the customer opts out of recording ([Retell ToS](https://www.retellai.com/legal/terms-of-service)); the privacy policy confirms training as a purpose ([Retell privacy policy](https://www.retellai.com/legal/privacy-policy)); no training control exists in the product ([Retell data storage settings](https://docs.retellai.com/accounts/privacy-disable)). **Remaining question:** can training be disabled while recording stays enabled, or will Retell sign an amendment excluding training? Written request drafted at `retell-training-data-request.md`, awaiting send and reply. | Blocking for the no-training MSA commitment (section 10.3 item 7, now marked BLOCKED). Not blocking for platform selection — see the correction in section 9.8. | Tim Do | Before Phase 0 exit |
| OQ-3 | What are Toast's actual partner economics? Nothing is published; the only figure in circulation is a secondary blog citing a 2019 report of 30% revenue share plus $500 per referred lead ([DirectOrders](https://www.directorders.com/blog/toast-partner-api-restaurant-guide)). | Non-blocking; ask in Discovery | Tim Do | Phase 4 |
| OQ-4 | Do more than 15% of nail salon callers prefer Vietnamese at the design partners? This is the trigger to revisit the salon English-only decision (section 5.2). | Non-blocking | Tim Do | End of Phase 2 |
| OQ-5 | What are Square's actual API rate limits? Not published; the canonical page returned a client error and Square staff decline to disclose ([Square developer forum](https://developer.squareup.com/forums/t/current-square-api-rate-limit/449)). | Non-blocking; adaptive throttling handles it | Tim Do | Phase 2 |
| OQ-6 | Can Mangomint be classified? A webhooks help article exists but no developer docs, pricing or access process ([Mangomint integrations help](https://www.mangomint.com/learn/help-articles/integrations/)). | Non-blocking | Tim Do | Phase 3 |
| OQ-7 | Does Phorest's `createbooking` endpoint actually support writes? The reference page returned no extractable content ([Phorest createbooking](https://developer.phorest.com/reference/createbooking)). | Non-blocking | Tim Do | Phase 4 |
| OQ-8 | Is a newer CTIA Messaging Principles revision than July 2019 in force? Only the July 2019 PDF was retrievable ([CTIA MPBP](https://api.ctia.org/wp-content/uploads/2019/07/190719-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf)). | Non-blocking | Tim Do | Before Phase 1 |
| OQ-9 | What are Anthropic, Deepgram and ElevenLabs data-processing terms? Not fetched in the research. Required before routing call audio or transcripts to them. | Blocking for any vendor added beyond Retell, OpenAI, Twilio and Stripe | Tim Do | Before that vendor's first production call |
| OQ-10 | Pricing, deliberately deferred. Founder decision 1 August 2026: roll out free, no price listed, no end date, because stability is unknown (G6, NG8). The market clusters at $49 to $149 for salons and $149 to $599 for restaurants (section 1.2), and Serviio's 2% per completed order is unreplicated in the salon vertical ([serviio.ai](https://serviio.ai/)) — but none of that can be answered without our own cost and retention data. Reopen only after the G6 stability bar has held four consecutive weeks. | Non-blocking for build; deferred for GTM | Tim Do | Reassess when G6 is met, not on a date |
| OQ-11 | Do Viettel or Zalo publish per-character TTS rates, and what is the trans-Pacific RTT from a US-hosted agent? Neither publishes a rate ([Viettel AI](https://viettelai.vn/en/chuyen-giong-noi)). | Non-blocking; only relevant on the Option B path | Tim Do | If an Option B trigger fires |
| OQ-12 | Which Eden Center salons run which POS? The tier mix determines how much of Phase 2 is native versus parallel ledger. | Non-blocking; parallel ledger works either way | Tim Do | During Phase 1 |

---

## 17. Appendices

### Appendix A — Salon POS tiering

| Vendor | Tier | Booking API READ / WRITE | Access | Webhooks | Own AI receptionist | Source |
|---|---|---|---|---|---|---|
| Square Appointments | A | Read and write | Self-serve, per-seller OAuth | Yes, 24-hour retry | No first-party; a third-party "AI Receptionist" is in the marketplace | [Square Bookings API](https://developer.squareup.com/reference/square/bookings-api), [Onboard to the API](https://developer.squareup.com/docs/bookings-api/onboard-to-the-api), [Square App Marketplace](https://squareup.com/us/en/app-marketplace/app/ai-receptionist) |
| Zenoti | A | Read and write | Tenant-issued key, "Bot" app type | Yes | Yes | [Zenoti Service Booking APIs](https://docs.zenoti.com/docs/service-booking-apis), [Zenoti AI Receptionist](https://www.zenoti.com/ai-workforce/ai-receptionist) |
| Mindbody | A | Read and write | Self-serve sandbox, review to go live | Yes, signed | Text and webchat only | [Mindbody endpoints](https://developers.mindbodyonline.com/Resources/Endpoints), [Mindbody AI Concierge](https://www.mindbodyonline.com/business/ai-concierge) |
| Clover | A for payments, C for booking | No appointments API found | Self-serve sandbox, 4-part review | Yes for orders | No | [Clover dev home](https://docs.clover.com/dev/docs/home), [Clover personal services pricing](https://www.clover.com/pricing/personal-services) |
| Boulevard | B | Read and write, GraphQL | Enterprise tier only | Yes | No | [Boulevard Developer Portal](https://developers.joinblvd.com/), [Boulevard AI](https://www.joinblvd.com/features/boulevard-ai) |
| Booksy | B | Read confirmed, write unconfirmed | partner_uuid plus signed JWT, alpha docs | n.a. | No | [Booksy Public API](https://alpha.docs.booksy.net/v02.html) |
| Phorest | B | Write path exists but undocumented | Support ticket from a business-associated email | No, poll `updated_at` | Partial, no voice channel | [Phorest getting started](https://developer.phorest.com/docs/getting-started), [Phorest AI features](https://www.phorest.com/us/features/ai-features/) |
| Meevo | B | Write surface indicated | Request form, $49/mo plus $199 startup | Events listed, mechanics undocumented | No, staff-facing voice search only | [Meevo API docs](https://docs.meevoapi.com/), [Convobar](https://www.meevo.com/features/convobar) |
| Vagaro | B, read only | Read only | Enterprise sales, CC processing required | Yes, $10/mo for 5,000 calls | Text chatbot that cannot schedule | [Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro), [Vagaro AI KB](https://support.vagaro.com/hc/en-us/articles/31806231306779-Set-Up-A-Chatbot-for-Your-Business-with-Vagaro-AI) |
| Mangomint | B, unverified | Neither documented | No public program | Existence only | No, human-operated phone product | [Mangomint integrations help](https://www.mangomint.com/learn/help-articles/integrations/), [Mangomint call/text/chat](https://www.mangomint.com/features/call-text-chat/) |
| Zota POS | C | None | No developer surface | No | No | [Zota salon POS](https://zotaservices.com/salon-pos/), [Zota POS](https://zota.us/pos/) |
| Tilavon | C, competitor | None | Custom integrations on Elite only | No | Yes | [Tilavon integrations](https://tilavon.com/integrations) |
| SICUS Booking | C, competitor | None of its own | Consumes others' APIs | No | Yes | [SICUS AI Receptionist](https://sicusmedia.com/products/ai-receptionist.html) |
| Vinail | C, competitor | None | No developer surface | No | Yes | [Vinail EN](https://vinail.net/en/nail-salon-software-for-vietnamese) |
| iNailPOS / ATSoft | C | None | Phone and email only | No | No | [iNailPOS on the App Store](https://apps.apple.com/us/app/inailpos/id693051128), [ATSoft About](http://www.atsoft123.com/home/about) |
| SalonTouch Studio | C | None | No developer surface | No | No | [SalonTouch software](https://www.salontouchstudio.com/software.html) |
| GlossGenius | C, competitor | None | No API | No | Yes | [GlossGenius Reception](https://glossgenius.com/reception) |
| Fresha | C, competitor | Analytics read only, $295/location/mo | Add-on toggle | n.a. | Yes | [Fresha Data Connector KB](https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools), [Fresha AI Concierge](https://www.fresha.com/help-center/knowledge-base/calendar/101702-ai-concierge-overview) |
| DaySmart Salon | C | None | No developer program | No | No, support and marketing tooling | [DaySmart AI](https://www.daysmart.com/daysmart-ai/), [DaySmart pricing](https://www.daysmart.com/salon/pricing/) |
| Rosy Salon Software | C | None | No API | No | No | [Rosy pricing](https://rosysalonsoftware.com/pricing/) |

### Appendix B — Restaurant POS and middleware tiering

| Entity | Tier | Order injection | Unpaid orders? | Access | Source |
|---|---|---|---|---|---|
| Square for Restaurants | A | Yes, Orders API | No, fully paid plus fulfillment required | Self-serve OAuth | [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does), [Square OAuth API](https://developer.squareup.com/docs/oauth-api/overview) |
| Clover | A | Yes, atomic order then payment record then Print API | Yes | Self-serve sandbox, 4-part review, ~9-plus weeks reported | [Clover orders FAQ](https://docs.clover.com/dev/docs/orders-faqs), [Clover community](https://community.clover.com/questions/27693/why-does-it-take-so-long-to-get-approved-to-get-an.html) |
| Toast | B | Yes, `POST /orders` | Yes, payments optional | 8-stage certification | [Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html), [Toast integration dev process](https://doc.toasttab.com/doc/devguide/integrationDevProcess.html) |
| SpotOn | B | Yes, explicit injection | No, fully paid CLOSED only | Merchant self-serve OAuth | [SpotOn create order](https://developers.spoton.com/central-api/docs/create-order) |
| Lightspeed K-Series | B | Yes | Yes, land in the Orders tab | Partner with webhook registration | [Lightspeed K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial) |
| Lightspeed U-Series | B | Yes | No, `payment_info` required | Select partners, partner supplies an iPad, 100 rps | [Upserve/U-Series API docs](https://api-docs.upserve.com/olo/) |
| Otter | B | Yes, `POST /v1/orders`, 32 per minute | Adapter-dependent | 6-step certification | [Otter API reference](https://developer-guides.tryotter.com/api-reference/), [Otter partner process](https://helpdesk.tryotter.com/hc/en-us/articles/22695702216979-Integrated-Partner-Process) |
| Deliverect | B | Yes, Channel and Commerce API | Yes, `isPrepaid=false` | Certified partner, 8 components | [Deliverect Commerce channel API](https://developers.deliverect.com/reference/commerce-channel-api), [Deliverect channel integration](https://developers.deliverect.com/docs/building-a-channel-integration-overview) |
| ItsaCheckmate | B | Yes, `POST /api/v2/orders/:order_source` | Adapter-dependent | Marketplace onboarding then sandbox | [ItsaCheckmate API collection](https://raw.githubusercontent.com/api-evangelist/itsacheckmate/main/collections/itsacheckmate-marketplace-api.opencollection.json) |
| Cuboh | B | Yes, Direct API | Adapter-dependent | Informal, shared Slack channel | [Cuboh Direct API](https://docs.cuboh.com/direct), [Cuboh pricing](https://www.cuboh.com/pricing) |
| Chowly | B | Yes, partner-gated | n.a. | No public portal | [Chowly 3rd-party integration](https://chowly.com/solutions/3rd-party-marketplace-integration/) |
| Olo Rails | B | Yes, prepaid only | No | Certified partner | [Olo Rails FAQ](https://olosupport.zendesk.com/hc/en-us/articles/115005665043-Rails-FAQ) |
| Revel | B | Likely, gated | n.a. | Partner record, 72-hour one-time link | [Revel authentication](https://developer.revelsystems.com/revelsystems/docs/api-platform-authentication) |
| Aloha / NCR Voyix | B, enterprise | Yes, requires an interface server terminal | n.a. | Contact NCR Digital Ordering product team | [Aloha integrations config](https://docs.ncrvoyix.com/restaurant/aloha-pos/implementing/field_definitions/integrations) |
| MenuSifu | C, reachable via Otter | None public | n.a. | No developer program | [MenuSifu About](https://www.menusifu.com/about-us), [Otter x MenuSifu](https://www.tryotter.com/integrations/menusifu) |
| Chowbus POS | C, reachable via Deliverect | None public | n.a. | Contact form | [Chowbus pricing](https://www.chowbus.com/pos-plans/pricing), [Deliverect x Chowbus](https://www.deliverect.com/en-us/integrations/chowbus-pos) |
| Mealkeyway | C | None; MenuSifu's ordering arm | n.a. | None | [MealKeyway About](https://www.mealkeyway.online/form) |
| 39 Miles POS | C | None public | n.a. | None; a competing voice vendor claims a direct integration | [39 Miles](https://www.menupo.com/html/index-sc.html), [serviio.ai](https://serviio.ai/) |
| HungerRush | C, reachable via ItsaCheckmate | No public order API | n.a. | Vendor-brokered | [HungerRush integrations](https://www.hungerrush.com/products/integrations/) |
| TouchBistro | C | None public | n.a. | Invitation only, keys "intensely monitored" | [Reforming Retail](https://reformingretail.com/index.php/2019/01/23/why-do-some-cloud-pos-companies-still-lack-apis/) |

### Appendix C — Consent disclosure scripts, verbatim

Version identifier: `disclosure_v1.0.0`. Every string below is versioned, published on the public trust center, and recorded in `consent_events.disclosure_version`. No competitor publishes a non-English consent script; Slang publishes only its English sentence ([Slang branded greeting KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting)) and Goodcall never publishes its whisper text ([Goodcall recording notification KB](https://help.goodcall.com/en/articles/8007564-goodcall-s-call-recording-notification)).

C.1 All-party posture — Maryland, California, Florida, Washington, and every unknown-state default.

English:

> "Thanks for calling [Business Name]. Before we start: this call is answered by an automated AI assistant, not a person, and the call is being recorded and transcribed so we can take your booking. If you would rather not be recorded, press zero now to leave a message for a staff member, or you can hang up. If that is okay, say yes and I will help you."

Vietnamese:

> "Cảm ơn quý khách đã gọi [Tên Tiệm]. Trước khi bắt đầu: cuộc gọi này do trợ lý tự động bằng trí tuệ nhân tạo trả lời, không phải người thật, và cuộc gọi đang được ghi âm và chuyển thành văn bản để em ghi lịch hẹn cho quý khách. Nếu quý khách không muốn bị ghi âm, xin bấm số không ngay bây giờ để lại lời nhắn cho nhân viên, hoặc quý khách có thể cúp máy. Nếu quý khách đồng ý, xin nói 'đồng ý' để em giúp ạ."

C.2 One-party announcement posture — Virginia, District of Columbia, Texas, Georgia.

English:

> "Thanks for calling [Business Name]. Just so you know, you are speaking with an automated AI assistant, not a person, and this call is recorded and transcribed. Press zero at any time for a person. How can I help?"

Vietnamese:

> "Cảm ơn quý khách đã gọi [Tên Tiệm]. Xin thưa, quý khách đang nói chuyện với trợ lý tự động bằng trí tuệ nhân tạo, không phải người thật, và cuộc gọi này được ghi âm và chuyển thành văn bản. Quý khách có thể bấm số không bất cứ lúc nào để gặp nhân viên. Em có thể giúp gì cho quý khách ạ?"

C.3 Consent declined — the caller says no in an all-party posture.

English:

> "No problem. I have stopped the recording and deleted it. I can still help you, or I can take a message for a staff member."

Vietnamese:

> "Dạ không sao. Em đã ngừng ghi âm và đã xóa rồi. Em vẫn có thể giúp quý khách, hoặc em ghi lời nhắn cho nhân viên ạ."

C.4 Language undetermined — both scripts play in sequence, English first, and `disclosure_language` is recorded as `en+vi`. The Vietnamese script used is C.1 or C.2 according to posture.

C.5 Mid-call AI identity question, either posture, either language.

English:

> "No, I am not a person. I am an automated assistant for [Business Name]. I can book you in, or I can put you through to someone."

Vietnamese:

> "Dạ không, em không phải người thật. Em là trợ lý tự động của [Tên Tiệm]. Em có thể đặt lịch cho quý khách, hoặc em chuyển máy cho nhân viên ạ."

C.6 No-record path confirmation after pressing zero.

English:

> "The recording is off. Please leave your name, your number, and what you need after the tone."

Vietnamese:

> "Đã tắt ghi âm. Xin quý khách để lại tên, số điện thoại, và điều quý khách cần sau tiếng bíp ạ."

C.7 Card-refusal string, used by the automatic PAN filter.

English:

> "I cannot take card numbers on this line. Please use the secure link I texted you."

Vietnamese:

> "Em không nhận số thẻ qua điện thoại được ạ. Xin quý khách dùng đường dẫn an toàn em vừa nhắn tin."

### Appendix D — Source index by topic

Salon POS and booking APIs: [Square Bookings API](https://developer.squareup.com/reference/square/bookings-api), [Square SearchAvailability](https://developer.squareup.com/reference/square/bookings-api/search-availability), [Square onboarding](https://developer.squareup.com/docs/bookings-api/onboard-to-the-api), [Square webhooks](https://developer.squareup.com/docs/webhooks/overview), [Zenoti Service Booking APIs](https://docs.zenoti.com/docs/service-booking-apis), [Zenoti API keys](https://help.zenoti.com/en/zenoti-apis/create-the-backend-app-and-generate-a-new-api-key.html), [Zenoti rate limits](https://help.zenoti.com/en/zenoti-apis/api-rate-limits.html), [Zenoti queue settings](https://help.zenoti.com/en/queue/onboard-and-set-up/general-settings-for-queue.html), [Mindbody endpoints](https://developers.mindbodyonline.com/Resources/Endpoints), [Mindbody webhooks](https://developers.mindbodyonline.com/WebhooksDocumentation), [Mindbody FAQs](https://developers.mindbodyonline.com/resources/faqs), [Boulevard booking guide](https://developers.joinblvd.com/2020-01/client-api/guides/booking-an-appointment/), [Boulevard API tier](https://www.joinblvd.com/features/api), [Booksy Public API](https://alpha.docs.booksy.net/v02.html), [Phorest getting started](https://developer.phorest.com/docs/getting-started), [Meevo API docs](https://docs.meevoapi.com/), [Vagaro webhooks KB](https://support.vagaro.com/hc/en-us/articles/29521637950875-Set-Up-Webhooks-From-Vagaro), [Clover dev home](https://docs.clover.com/dev/docs/home), [Clover rate limits](https://docs.clover.com/dev/docs/api-usage-rate-limits).

Vietnamese-focused salon vendors: [Zota salon POS](https://zotaservices.com/salon-pos/), [Zota POS](https://zota.us/pos/), [Zota Check-in](https://zotaservices.com/zota-check-in/), [Tilavon](https://tilavon.com/), [Tilavon pricing](https://tilavon.com/pricing), [Tilavon integrations](https://tilavon.com/integrations), [SICUS AI Receptionist](https://sicusmedia.com/products/ai-receptionist.html), [SICUS Vietnamese salon software](https://www.sicusmedia.com/vietnamese-salon-software.html), [Vinail](https://vinail.net/), [Vinail EN](https://vinail.net/en/nail-salon-software-for-vietnamese), [iNailPOS](https://apps.apple.com/us/app/inailpos/id693051128), [GlossGenius Reception](https://glossgenius.com/reception), [Fresha Data Connector KB](https://www.fresha.com/help-center/knowledge-base/reports/479-available-data-connector-tools).

Restaurant POS and middleware: [Toast creating orders](https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html), [Toast integration dev process](https://doc.toasttab.com/doc/devguide/integrationDevProcess.html), [Toast rate limiting](https://doc.toasttab.com/doc/devguide/apiRateLimiting.html), [Toast stock API](https://doc.toasttab.com/doc/devguide/apiStock.html), [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does), [Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does), [Clover orders FAQ](https://docs.clover.com/dev/docs/orders-faqs), [SpotOn create order](https://developers.spoton.com/central-api/docs/create-order), [Lightspeed K-Series tutorial](https://api-portal.lsk.lightspeed.app/guides/integration-guides/online-ordering/online-ordering-tutorial), [Otter API reference](https://developer-guides.tryotter.com/api-reference/), [Otter x MenuSifu](https://www.tryotter.com/integrations/menusifu), [Deliverect Commerce channel API](https://developers.deliverect.com/reference/commerce-channel-api), [Deliverect x Chowbus](https://www.deliverect.com/en-us/integrations/chowbus-pos), [ItsaCheckmate Marketplace launch](https://www.globenewswire.com/news-release/2022/11/15/2556195/0/en/ItsaCheckmate-launches-Marketplace-a-next-generation-open-API-platform.html), [Olo Rails FAQ](https://olosupport.zendesk.com/hc/en-us/articles/115005665043-Rails-FAQ), [MenuSifu About](https://www.menusifu.com/about-us), [Chowbus POS comparison](https://www.chowbus.com/blog/the-best-chinese-restaurant-pos-system-in-2026).

Voice AI competitors: [Bukkii nail salon](https://www.bukkii.ai/industries/nail-salon), [bukkii.ai/vi](https://www.bukkii.ai/vi), [stork.ai on Bukkii AIVA](https://www.stork.ai/en/bukkii-ai-aiva), [RingBooker pricing](https://ringbooker.com/pricing), [heymai.ai](https://heymai.ai/en/), [sensalon.ai](https://sensalon.ai/), [NailMaxx MAXX AI](https://nailmaxx.com/pages/maxx-ai), [upmysalon.com](https://upmysalon.com/), [Slang AI pricing](https://www.slang.ai/pricing), [kea.ai](https://kea.ai/), [serviio.ai](https://serviio.ai/), [loman.ai](https://www.loman.ai/), [bitebuddy.ai](https://bitebuddy.ai/), [Maple and Quantic](https://www.businesswire.com/news/home/20260424097043/en/Maple-and-Quantic-Partner-to-Bring-AI-Phone-Ordering-to-Thousands-of-Restaurants), [Goodcall pricing](https://www.goodcall.com/pricing), [Smith.ai AI receptionist](https://smith.ai/ai-receptionist), [My AI Front Desk pricing](https://www.myaifrontdesk.com/pricing), [PolyAI language coverage](https://docs.poly.ai/agent-settings/language-coverage).

Vietnamese voice stack: [Twilio Media Streams](https://www.twilio.com/docs/voice/media-streams/websocket-messages), [Retell language support](https://docs.retellai.com/build/language-support), [Retell pricing](https://www.retellai.com/pricing), [Vapi multilingual](https://docs.vapi.ai/customization/multilingual), [Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview), [Deepgram keyterm](https://developers.deepgram.com/docs/keyterm), [Deepgram Vietnamese](https://deepgram.com/product/speech-to-text/vietnamese), [ElevenLabs models](https://elevenlabs.io/docs/models), [ElevenLabs STT capabilities](https://elevenlabs.io/docs/capabilities/speech-to-text), [Cartesia TTS bytes API](https://docs.cartesia.ai/api-reference/tts/bytes), [Cartesia Vietnamese](https://www.cartesia.ai/languages/vietnamese), [PhoWhisper](https://github.com/VinAIResearch/PhoWhisper), [FPT.AI TTS voices](https://docs.fpt.ai/docs/en/speech/documentation/tts-voice/), [Viettel TTS API](https://www.vtcc.vn/api-tts-text-to-speech/), [Zalo TTS](https://github.com/iconclub/zalo-tts), [Google STT v2 supported languages](https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages), [Pipecat supported services](https://docs.pipecat.ai/server/services/supported-services), [LiveKit TTS models](https://docs.livekit.io/agents/models/tts/).

Recording consent: [Md. Cts. and Jud. Proc. § 10-402](https://law.justia.com/codes/maryland/courts-and-judicial-proceedings/title-10/subtitle-4/section-10-402/), [Va. Code § 19.2-62](https://law.lis.virginia.gov/vacode/title19.2/chapter6/section19.2-62/), [D.C. Code § 23-542](https://code.dccouncil.gov/us/dc/council/code/sections/23-542), [Cal. Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632), [Cal. Penal Code § 637.2](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2), [Tex. Penal Code § 16.02](https://law.justia.com/codes/texas/penal-code/title-4/chapter-16/section-16-02/), [O.C.G.A. § 16-11-66](https://law.justia.com/codes/georgia/title-16/chapter-11/article-3/part-1/section-16-11-66/), [Fla. Stat. § 934.03](https://law.justia.com/codes/florida/title-xlvii/chapter-934/section-934-03/), [RCW 9.73.030](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030), [RCW 9.73.060](https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.060).

AI disclosure, TCPA and SMS: [FCC-24-17A1](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf), [FCC-24-84A1](https://docs.fcc.gov/public/attachments/FCC-24-84A1.pdf), [47 U.S.C. § 227](https://www.law.cornell.edu/uscode/text/47/227), [47 CFR 64.1200](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200), [Eleventh Circuit IMC v. FCC](https://media.ca11.uscourts.gov/opinions/pub/files/202410277.pdf), [Burr and Forman on revoke-all](https://www.burr.com/telephone-consumer-protection-act/the-fcc-delays-effective-date-of-tcpa-revoke-all-rule-until-january-31-2027), [Cal. BPC Ch. 6](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=7.&title=&part=3.&chapter=6.&article), [Utah SB 226 enrolled](https://le.utah.gov/Session/2025/bills/enrolled/SB0226.pdf), [Colorado AG AI page](https://coag.gov/ai/), [Twilio A2P 10DLC fees](https://help.twilio.com/articles/1260803225669-A2P-10DLC-Fees-on-Twilio), [Twilio error 30034](https://www.twilio.com/docs/api/errors/30034), [CTIA MPBP](https://api.ctia.org/wp-content/uploads/2019/07/190719-CTIA-Messaging-Principles-and-Best-Practices-FINAL.pdf).

PCI and payments: [PCI SSC Protecting Telephone-Based Payment Card Data v3.0](https://www.pcisecuritystandards.org/documents/Protecting_Telephone_Based_Payment_Card_Data_v3-0_nov_2018.pdf), [PCI SSC telephone supplement](https://www.pcisecuritystandards.org/documents/protecting_telephone-based_payment_card_data.pdf), [PCI SSC FAQ 1574](https://www.pcisecuritystandards.org/faqs/1574/), [Stripe PCI compliance guide](https://stripe.com/guides/pci-compliance), [Stripe integration security guide](https://docs.stripe.com/security/guide).

Privacy and biometrics: [Maryland AG data privacy](https://oag.maryland.gov/resources-info/Pages/data-privacy.aspx), [Cooley on MODPA](https://www.cooley.com/news/insight/2025/2025-09-09-marylands-unique-state-privacy-law-takes-effect-october-1--what-you-should-know), [Moore and Van Allen on MODPA](https://www.mvalaw.com/data-points/getting-ready-for-marylands-online-data-privacy-act-a-new-trendsetter), [Tex. Bus. and Com. Code § 541.002](https://texas.public.law/statutes/tex._bus._and_com._code_section_541.002), [Tex. Bus. and Com. Code § 503.001](https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001), [Sidley on BIPA](https://datamatters.sidley.com/2026/04/08/seventh-circuit-limits-potential-damages-under-bipa-holds-2024-amendment-applies-retroactively/), [Washington AG MHMD FAQ](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy), [Cal. Civ. Code § 1632](https://california.public.law/codes/ca_civ_code_section_1632), [CPPA CPI adjustment](https://cppa.ca.gov/regulations/cpi_adjustment.html).

Vendor data posture: [Retell compliance](https://docs.retellai.com/general/compliance), [click-agreements.retellai.com](https://click-agreements.retellai.com/), [Vapi HIPAA docs](https://docs.vapi.ai/security-and-privacy/hipaa), [OpenAI data controls](https://platform.openai.com/docs/guides/your-data), [OpenAI DPA](https://openai.com/policies/data-processing-addendum/), [Twilio DPA](https://www.twilio.com/en-us/legal/data-protection-addendum), [Twilio sub-processors](https://www.twilio.com/legal/sub-processors).

Top-5 compliance benchmark: [Slang privacy policy](https://www.slang.ai/privacy-policy), [Slang terms](https://www.slang.ai/terms-of-service), [Slang branded greeting KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting), [Slang bilingual support KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/3267629049-bilingual-support), [PolyAI privacy policy](https://poly.ai/privacy-policy), [PolyAI DPA](https://poly.ai/dpa), [PolyAI compliance](https://docs.poly.ai/legal/compliance), [PolyAI training data](https://docs.poly.ai/legal/training-data), [PolyAI guardrails](https://docs.poly.ai/behavior/guardrails/introduction), [PolyAI DTMF docs](https://docs.poly.ai/flows/dtmf), [Smith.ai privacy](https://smith.ai/privacy), [Smith.ai terms](https://smith.ai/receptionists/terms), [Smith.ai recording blog](https://smith.ai/blog/record-transcribe-your-calls), [Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy), [Goodcall ToS](https://help.goodcall.com/en/articles/8007566-terms-of-service), [Goodcall recording notification KB](https://help.goodcall.com/en/articles/8007564-goodcall-s-call-recording-notification), [My AI Front Desk trust center](https://www.myaifrontdesk.com/trust-center), [My AI Front Desk security overview](https://www.myaifrontdesk.com/trust-center/security-overview), [My AI Front Desk retention](https://www.myaifrontdesk.com/trust-center/retention-deletion), [My AI Front Desk consent](https://www.myaifrontdesk.com/trust-center/call-recording-consent), [My AI Front Desk transcript safety](https://www.myaifrontdesk.com/trust-center/transcript-safety), [My AI Front Desk terms](https://www.myaifrontdesk.com/terms-of-service).

---

End of document. Version 1.0, 2026-08-01, Tim Do.
