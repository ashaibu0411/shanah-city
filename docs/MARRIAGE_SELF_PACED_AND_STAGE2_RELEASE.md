# Marriage Prep — Self-Paced Counseling + Stage 2 release preparation

**Branch:** `feature/marriage-self-paced-stage2` (isolated; **not** merged to `main`)  
**Baseline production main:** `2ea02c535f78aef240c4f9f9e3a576ebf391acc0`  
**Production:** do not deploy from this branch until authorized.

---

## Part 1 — Implementation inventory (existing + extended)

| Area | Location | Notes |
|------|----------|--------|
| Journeys, assessments, compare, privacy | `marriage-counseling-server.ts`, `marriage-counseling-access.ts` | Reused; submit hooks self-paced sync |
| Premarital 8-session program | `marriage-premarital-eight-session-program.ts`, `marriage-premarital-program-server.ts` | Certificate blockers unchanged |
| Appointments / clinical | `marriage-premarital-operations-server.ts` | IN_PERSON / VIRTUAL / HYBRID paths preserved |
| Homework | `marriage-homework-server.ts`, session homework models | Reused for counselor assignments |
| Counselor command center | `MarriageCounselorCommandCenter.tsx` | + Self-paced review center panel |
| Stage 2 modules | `src/lib/marriage-stage2-content/`, `/marriage/learn`, `/api/marriage/stage2` | Feature-flagged |
| Intimacy gate | `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` | Unchanged; pastoral sign-off required |
| Private Blob (Path B) | `marriage-private-storage.ts`, `marriage-blob.ts` | Unchanged |
| Certificates | `marriage-certificate-server.ts` | Senior Pastor issuance unchanged |
| **New:** Delivery modes | `marriage-counseling-delivery-mode.ts`, journey field `counselingDeliveryMode` | IN_PERSON, VIRTUAL, SELF_PACED, HYBRID |
| **New:** Self-paced workflow | `marriage-self-paced-server.ts` | Assign → both submit → review → publish → approve |
| **New:** APIs | `/api/marriage/counselor/self-paced`, `/api/marriage/self-paced` | Counselor + couple clarification/feedback read |
| **New:** UI | `/marriage/counselor/review/[journeyId]/[sessionKey]` | Mobile-friendly review + structured feedback |
| **New:** Migration | `20261027190000_marriage_self_paced_counseling` | Staging/dev only until release |

---

## Part 7 — Stage 2 readiness (no production enable)

| Item | Ready for staging | Production enable |
|------|-------------------|-------------------|
| Modules 1–6 content | Yes (Phase 2B) | Requires `MARRIAGE_HUB_STAGE2_ENABLED=1` + `NEXT_PUBLIC_MARRIAGE_STAGE2=1` on **staging** first |
| Modules 7–12 scaffold | Partial (`mod-07-12-growth.ts`) | Content review |
| Intimacy module `s2-mod-06-intimacy` | Gated in code | Requires **`MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1`** + pastoral sign-off ([MARRIAGE_STAGE2_PASTORAL_REVIEW.md](./MARRIAGE_STAGE2_PASTORAL_REVIEW.md)) |
| Learning center `/marriage/learn` | Yes when flags on | Same flags |
| Self-paced + Stage 2 | Self-paced uses premarital session keys; Stage 2 uses separate lesson hub | Enable flags together on staging after QA |

**Do not** set intimacy approval or production Stage 2 flags without explicit authorization.

---

## Part 10 — Staging acceptance (required before release)

1. Apply migration on **shanah-city-staging** Neon branch only: `npx prisma migrate deploy`
2. Set staging env: Stage 2 flags ON; intimacy approval OFF unless testing gate
3. Set `MARRIAGE_COUNSELOR_USER_IDS` for synthetic counselors
4. Run:
   - `npm run test:marriage:self-paced`
   - `npm run test:marriage:private-storage`
   - `npm run test:marriage:certificates`
   - `npm run test:marriage:verify`
   - `npm run build`
   - Staging Playwright / Phase C harness (existing scripts)
5. Manual: self-paced couple → both submit → counselor review → publish → approve → session counts once toward 8-session requirement

---

## Part 11 — Production release checklist (when authorized)

1. **Git:** merge `feature/marriage-self-paced-stage2` via PR; record SHA.
2. **Neon backup:** manual snapshot of production `main` branch before migrate.
3. **Migration:** one new migration (`20261027190000_marriage_self_paced_counseling`); verify 0 pending after deploy.
4. **Env (production):**
   - Keep Stage 2 **off** until pastoral + QA sign-off.
   - No change to Stripe, media Blob, or marriage private Blob credentials.
   - Optional: document default delivery mode policy for new couples (field defaults null = legacy meeting-based).
5. **Enable together (later authorization):**
   - Self-paced: no global flag — per-journey `counselingDeliveryMode` via counselor API.
   - Stage 2: `MARRIAGE_HUB_STAGE2_ENABLED=0` → `1` and `NEXT_PUBLIC_MARRIAGE_STAGE2=0` → `1` only after staging acceptance.
   - Intimacy: separate `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` after content approval.
6. **Rollback:** Vercel promote previous deployment; DB: do not auto-restore; use pre-migrate snapshot if schema rollback required.
7. **Monitor:** counselor review notifications, homework, private Blob errors, giving (unchanged).

---

## Security / privacy (Part 8)

- All counselor actions use existing `assertClinicalCounselorForJourney` / participant loose checks.
- Published feedback strips `counselorInternalNotes`; partner-specific map keyed by user id.
- Async disclaimer: `SELF_PACED_ASYNC_DISCLAIMER` in couple feedback view.
- No AI-generated counseling content.

---

## Known gaps (follow-up)

- Onboarding UI to pick delivery mode at couple start (API `set_delivery_mode` exists).
- Deep integration of Stage 2 lesson completion into self-paced session assignment (premarital session keys today).
- Staging E2E spec dedicated to self-paced approve path (unit test added).
- Homework revision loop wired to `homework_review` status (reuse existing homework APIs).
