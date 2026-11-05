# Marriage Prep Stage 2 — Module 6 pastoral approval review

**Module:** `s2-mod-06-intimacy` — Sex, intimacy & affection
**Audience:** Adult participants in premarital and marriage enrichment tracks
**Decision:** **Approval pending**. This document does not approve or activate Module 6.
**Production flag:** `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` must remain unset/off until explicit pastoral authorization and staging QA.

## What the participant sees

Seven lessons, approximately **80 prompts** total:

| Lesson | Topic | Examples to review |
|---|---|---|
| 1 | Consent & scope | Adult self-attestation and voluntary Yes / Not now choice |
| 2 | Emotional connection | Emotional safety, prayer together, conflict, grief, affirmation |
| 3 | Affection & touch | Verbal consent, physical affection, postpartum seasons, personal preferences |
| 4 | Communication & consent | Private boundaries; optional phrase shared only with explicit consent; counselor conversation request |
| 5 | Differences in desire | Rejection, fatigue, porn/media, grief, health, relationship expectations |
| 6 | Family planning & seasons | Parenthood, fatigue, coercion, boundaries, changes in life |
| 7 | Agreements & review | Shared nonsexual affection goal, ten mutual-principle agreements |

The source of truth for every actual prompt is
[`src/lib/marriage-stage2-content/mod-06-intimacy.ts`](../src/lib/marriage-stage2-content/mod-06-intimacy.ts).
Read the complete prompt bank, not only these examples, before sign-off.

## Consent behavior proposed in the safeguard PR

1. Before consent, the assessment API sends only the introduction lesson and opt-in question.
2. A participant selects **Yes — I am an adult and choose to proceed** or **Not now**.
3. The Yes choice must be **saved in the participant's own draft** before the server accepts sensitive answers. Sending Yes and sensitive data in the same PATCH is rejected.
4. Not now prevents sensitive lessons from appearing, prevents Module 6 submission, and does not prevent using unrelated Stage 2 content or completing the separate eight-session curriculum.
5. Changing from Yes to Not now before submission nulls sensitive draft answers and revokes existing explicit partner-sharing consents.
6. Private reflections remain private; partner-specific sharing is permission-based; counselor-with-consent questions require a separate permission.
7. After submission, the existing submitted/read-only safeguards still apply. This change does not add a new withdrawal feature for already-submitted records; existing privacy/deletion processes continue to apply.

## Pastoral decisions to verify explicitly

- **Theology and vocabulary:** Do the questions communicate mutual respect and noncoercion without stereotyping men or women?
- **Scope:** Is this curriculum appropriate for adult couples preparing for marriage *and* married couples? Decide whether the content needs track-specific wording.
- **Privacy:** Confirm that sensitive reflections stay private, that consent to share is voluntary, and that assigned pastoral counselors see only properly authorized material.
- **Support:** Pastoral counselors are unlicensed church counselors. Discuss medical/mental-health concerns only within pastoral scope and refer health concerns, pain, trauma, or abuse to appropriate qualified services.
- **Question count:** Around 80 questions is lengthy. Decide whether to make some optional questions collapsed or grouped without forcing disclosure.
- **Opt-out:** Ensure declining Module 6 never blocks other lessons or a premarital completion certificate.
- **Adult participation:** The current confirmation is **self-attestation**, not independent identity/age verification.
- **Submitted records:** Review and, if needed, separately enhance withdrawal/removal mechanisms for submissions already finalized.

## Required verification

- Unit/integration security test for no opt-in, declined opt-in, Yes-first, direct API bypass, draft withdrawal, and re-opt-in
- Confirm partner compare does not expose private, counselor-only, or explicitly shared fields without separate consent
- Two synthetic partner accounts: one declines, the other proceeds; then both proceed and submit
- Counselor permissions/consent test; unassigned counselors cannot inspect sensitive answers
- iPhone/Android view; direct links with `?lesson=m06-l04` cannot bypass intro
- Keep the approval feature flag OFF until explicit signed-off release step

## Approval record (not yet signed)

- Senior Pastor / authorized reviewer: **Pending**
- Content scope and wording accepted: **Pending**
- Security / privacy QA: **Pending**
- Production intimacy enable: **NOT AUTHORIZED**
