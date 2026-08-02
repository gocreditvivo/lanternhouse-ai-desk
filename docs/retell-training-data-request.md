# Written request to Retell AI — model training on customer data (OQ-2)

Status: drafted 1 August 2026, not yet sent
Owner: Tim Do
Resolves: OQ-2 in `linh-booking-ordering-spec.md`
Send to: `support@retellai.com` (the address Retell directs compliance questions to on its [security and compliance page](https://docs.retellai.com/general/compliance))
Copy to: any named legal or privacy contact returned in the reply

---

## Why this needs to be in writing

Retell's published documents do not agree with each other, and the gap sits exactly where our own customer commitment sits.

**The terms say training happens by default.** Retell's Terms of Service, last updated 1 June 2026, state: "If you do not opt-out of recording, you give Retell AI permission to record calls made using the Service and process communication data ('Communications') and User Content for offering AI-powered analytics and the development, training, and improvement of artificial intelligence and machine learning models that are included in the Service. However, before being used for these purposes, the data will be de-identified and aggregated using commercially reasonable industry-standard technologies." ([Retell Terms of Service](https://www.retellai.com/legal/terms-of-service))

The same document also grants a broad content license: "By submitting User Content, you grant Retell AI a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such User Content in connection with the Service." ([Retell Terms of Service](https://www.retellai.com/legal/terms-of-service))

**The privacy policy says the same thing in its own words.** Last updated 20 July 2026, it lists as a purpose "to train the artificial intelligence models that support our Services or that support our business and administrative functions" and "improve, train, and enhance our AI models and related technologies," and states "Retell AI may also record or monitor calls for quality assurance, safety, security, and service improvement purposes." ([Retell Privacy Policy](https://www.retellai.com/legal/privacy-policy))

**The product documentation offers no training control.** The Data Storage Settings page documents three modes — Everything, Everything except PII, and Basic Attributes Only — and says nothing about model training ([Retell data storage settings](https://docs.retellai.com/accounts/privacy-disable)). The Data Retention Policy page documents per-agent retention from 1 day to 2 years, with a default of "Keep forever," and likewise says nothing about training ([Retell data retention](https://docs.retellai.com/accounts/data-retention)). The security and compliance page covers BAA, DPA and SCCs but never mentions training at all ([Retell security and compliance](https://docs.retellai.com/general/compliance)).

**The conflict.** The only opt-out named in the terms is an opt-out of recording. We cannot opt out of recording: an all-party-consent recording with a complete consent artifact is a core compliance feature of our product, and recordings are what our tenants' own legal exposure is documented against. So the contractual opt-out and our compliance design are mutually exclusive as written, unless a separate training opt-out exists.

Note also that "de-identified and aggregated" is doing heavy lifting here. Our calls are conducted in Vietnamese and English by a small number of speakers in a small geographic market. De-identification claims that hold for a national English corpus do not obviously hold for a Vietnamese-language corpus drawn from a few dozen salons in one metropolitan area.

---

## The email

**Subject:** Written confirmation requested — model training on customer call data, and a training opt-out that preserves recording

Hello,

I am evaluating Retell as the voice platform for a bilingual English/Vietnamese AI receptionist serving nail salons and restaurants in the Maryland, Virginia and DC area. Your security and compliance page directs vendor and compliance questions to this address.

I am preparing a written commitment to my own customers that their call recordings and transcripts will not be used to train shared AI models. Before I can make that commitment, I need Retell's position in writing. I have read the published documents and they conflict, so I would rather ask than assume.

What I have read:

- Your Terms of Service (last updated 1 June 2026) state that if the customer does not opt out of recording, Retell has permission to process Communications and User Content "for offering AI-powered analytics and the development, training, and improvement of artificial intelligence and machine learning models that are included in the Service," after de-identification and aggregation.
- Your Privacy Policy (last updated 20 July 2026) lists as a purpose "to train the artificial intelligence models that support our Services" and "improve, train, and enhance our AI models and related technologies."
- Your Data Storage Settings and Data Retention Policy documentation describes storage modes, PII scrubbing and retention windows, but describes no control over model training.
- Your security and compliance page does not mention model training.

My questions, each of which I am asking for a yes or no plus any necessary qualification:

1. Does Retell today use customer call audio, transcripts, or derived data to train, fine-tune, or evaluate any model — whether a Retell-developed model, a shared model serving multiple customers, or a model operated by a subprocessor?

2. The Terms name only an opt-out of recording. Is there a way to opt out of model training while continuing to record calls and retain recordings and transcripts? If yes, how is it set — account setting, agent setting, API field, or contractual amendment — and does it apply retroactively to data already processed?

3. If no such control exists in the product, will Retell execute a written amendment or side letter stating that Customer Content is not used for model training or model improvement? If so, what is the process and is it available at our size, without an enterprise minimum?

4. What exactly does "de-identified and aggregated using commercially reasonable industry-standard technologies" mean operationally for voice? Specifically: is the raw audio waveform used in training, or only text derived from it? Voice audio carries speaker identity independently of transcript content, and our call population is a small number of Vietnamese-speaking speakers in one metropolitan area, so a de-identification method adequate for a large English corpus may not be adequate here.

5. Do the same training practices apply to your subprocessors — the ASR, TTS, and LLM providers in the path? Please confirm whether customer audio or transcripts reach any subprocessor under terms that permit that subprocessor to train on them, and please send the current subprocessor list. Your compliance page says subprocessor lists are available on request, so I am requesting one.

6. Does executing your self-serve DPA at click-agreements.retellai.com change the training answer in any way? If the DPA overrides the training clause in the Terms of Service, please point me to the operative language. If it does not override it, please confirm that as well.

7. Does signing the BAA change the training answer for data covered by it, and does that change extend to non-PHI accounts?

8. Setting "Basic Attributes Only," or "Everything except PII," changes what Retell stores. Does either setting change what Retell trains on? I am treating storage and training as separate questions unless you tell me they are linked.

9. Your Data Retention Policy documents a default of "Keep forever." When a per-agent retention period expires and data is "automatically and permanently deleted," is anything derived from that data — embeddings, model weights, aggregated training sets, evaluation corpora — retained after deletion?

To be direct about why this matters commercially: my customers are small Vietnamese-owned businesses, my differentiator against the incumbents in this category is a straightforward promise that I do not train on their callers' voices, and I would like to be able to name Retell as the platform behind that promise. A clear yes on question 2 or question 3 lets me do that. A clear no is also useful, and I would rather have it now than after launch.

A written reply to this email is sufficient; I do not need a call. If any of this is better answered by your legal team, please forward it and let me know who has it.

Thank you,

Tim Do
Founder, Linh
North Laurel, Maryland
gotimdo@gmail.com

---

## How to log the answer

When the reply arrives, record in `linh-booking-ordering-spec.md`:

1. Update OQ-2 in section 16.2 with the answer, the date, and the name and title of who answered.
2. Update section 9.8 (vendor posture) so the Retell-versus-Vapi comparison reflects the confirmed position rather than the published ambiguity.
3. Update challenger playbook item 7 in section 10.3. If Retell will not contractually exclude training, the no-training promise must either be narrowed to what we control, or the platform decision reopens.
4. File the reply itself in the project as evidence. A vendor's email is the artifact that supports a customer-facing claim; a trust page is not.

## If Retell says no

Then the no-training commitment cannot be made on Retell as-is, and there are three paths, in order of cost:

1. Negotiate the side letter in question 3. Cheapest if they will do it.
2. Move to Option B in section 5.4 — self-hosted Pipecat with directly contracted ASR and TTS vendors, where the training terms are negotiated per vendor rather than inherited. This is already specified in the document and has four named migration triggers; a refusal here would be a fifth.
3. Narrow the public promise to what we actually control, and say so plainly rather than implying more. This is still ahead of Slang AI, PolyAI and Goodcall, all three of which train on customer data ([Slang branded greeting KB](https://slang-ai-knowledge-base.help.usepylon.com/articles/8839327046-branded-greeting), [PolyAI training data](https://docs.poly.ai/legal/training-data), [Goodcall privacy](https://help.goodcall.com/en/articles/8007565-privacy)) — but it is behind My AI Front Desk, which states plainly that "Customer call recordings and transcripts are not used to train shared AI models" ([My AI Front Desk security overview](https://www.myaifrontdesk.com/trust-center/security-overview)). Worth noting that My AI Front Desk's pledge sits on a trust page, not in its terms, while its terms grant a "perpetual, and irrevocable license" over AI-Generated Content ([My AI Front Desk terms](https://www.myaifrontdesk.com/terms-of-service)) — so the gap is narrower than it looks, and a contractual commitment remains unoccupied even if we cannot claim a technical one.
