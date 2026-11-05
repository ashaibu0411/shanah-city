# Marriage Prep Stage 2 — integration report

**Integration branch:** `feature/marriage-stage2-integration`  
**Base:** `main` (includes PRs #25–#27)  
**Source branch merged:** `feature/marriage-self-paced-stage2` (selective merge, conflicts resolved)  
**Production Stage 2 flags:** remain **OFF** until staging QA and pastoral sign-off.

---

## Features already completed (on main before merge)

| Area | Status |
|------|--------|
| Stage 1 assessments, hub, partner compare, consent | Production |
| Submission status fix (`submittedAt` + draft patch guard) | PR #25 |
| Counselor/couple responsive UI | PRs #26–#27 |
| Stage 2 module registry, learning center API, temperament scoring v2 | Behind flags |
| Modules 1–6 rich content (temperament, family, communication, conflict, financial, intimacy) | Content complete; intimacy **gated** |
| Partner sharing consent, private reflections, counselor-with-consent | Implemented |
| `/marriage/learn`, `/api/marriage/stage2` | Flag-gated |

---

## Features newly integrated from `feature/marriage-self-paced-stage2`

| Area | Status |
|------|--------|
| Counseling delivery modes (`IN_PERSON`, `VIRTUAL`, `SELF_PACED`, `HYBRID`) | Journey field + audit log |
| Couple hub: delivery mode selection (`MarriageCoupleCounselingModePanel`) | After consent |
| Self-paced session review workflow (assign → both submit → review → publish → approve) | Counselor + couple APIs |
| Counselor review workspace `/marriage/counselor/review/[journeyId]/[sessionKey]` | Mobile-friendly |
| Couple feedback center `/marriage/feedback` | Published feedback only |
| Homework review lifecycle (`reviewStatus`, revision notes, resubmit path) | Store + server |
| Stage 2 enrichment reviews (separate session keys; no premarital session auto-complete) | Tested |
| Modules 7–12 growth content (learn / reflect / agree + likert banks) | Usable lessons (shorter than 1–6) |
| Prisma migration `20261027190000_marriage_self_paced_counseling` | **Not applied on production** |

---

## Remaining gaps (post-integration)

| Gap | Notes |
|-----|--------|
| Stage 2 + self-paced deep linking | Enrichment uses dedicated session keys; premarital eight-session keys unchanged |
| Dedicated Playwright self-paced approve E2E | Covered by unit/integration scripts; optional staging spec |
| Production enablement | Requires env flags + migration + Neon backup (see release doc) |
| Intimacy module | Requires `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` **and** pastoral authorization |

---

## Modules 7–12 review

Each module includes three lessons (learn, reflect, agree), six-item likert bank, private counselor reflection, shared discussion prompts, growth step, and agreement question. Content is **pastoral-ready for self-paced use**, not placeholder stubs. Modules 1–6 remain the primary depth track; 7–12 are structured enrichment units.

---

## Database migration requirements

**Migration:** `prisma/migrations/20261027190000_marriage_self_paced_counseling/migration.sql`

Adds:

- `MarriageCounselingJourney.counselingDeliveryMode`
- `MarriageSelfPacedSessionReview`, clarification messages, audit tables
- Homework response columns: `reviewStatus`, `revisionNote`, `reviewedAt`

**Before production migrate:** manual Neon snapshot of production `main` branch.  
**Validate on staging** with synthetic couples only; do not alter live counseling answer payloads.

---

## Approvals still required

1. Pastoral content sign-off for Stage 2 hub enable (`MARRIAGE_HUB_STAGE2_ENABLED`, `NEXT_PUBLIC_MARRIAGE_STAGE2`)
2. Separate intimacy approval (`MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED`) — **do not enable without explicit authorization**
3. Staging acceptance checklist in `docs/MARRIAGE_SELF_PACED_AND_STAGE2_RELEASE.md`
4. Production migration + deploy authorization

---

## Deployment readiness

| Environment | Ready? |
|-------------|--------|
| **Staging** (flags on, intimacy gate off) | Yes — after PR merge + migrate on staging Neon |
| **Production Stage 2** | **No** — pending migration backup, staging QA, pastoral sign-off |
| **Production self-paced mode** | Per-journey only; no global flag; safe to ship schema when migration authorized |

---

## Tests (integration branch)

Run before merge:

```bash
npm run test:marriage:curriculum
npm run test:marriage:all
npm run test:marriage:stage2
npm run test:marriage:phase2a
npm run test:marriage:phase2b
npm run test:marriage:stage2-modules
npm run test:marriage:self-paced
npm run test:marriage:homework-review
npm run test:marriage:counseling-mode
npm run test:marriage:couple-feedback
npm run test:marriage:stage2-enrichment
npm run build
npm run test:marriage:playwright   # optional; requires Chromium
```

See PR checklist for pass/fail at merge time.

**Integration branch CI (local):** all listed scripts **passed**; `npm run build` **passed** after `prisma generate`. Playwright two-partner specs were not run in this session (run `npm run test:marriage:playwright` on staging).
