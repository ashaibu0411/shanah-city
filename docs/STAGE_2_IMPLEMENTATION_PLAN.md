# Stage 2 Implementation Plan — Marriage Counseling Hub

## Stage 1 audit (reuse, do not rebuild)

| Capability | Primary location | Stage 2 use |
|------------|------------------|-------------|
| Program tracks | `marriage-counseling-program-tracks.ts`, curriculum service | Add tracks in Phase 2E |
| Invites / journey | `marriage-counseling-invite-server.ts` | Unchanged |
| Assessments | `MarriageAssessmentRunner`, `marriage-counseling-server.ts` | Activity engine wraps same API |
| Privacy / unlock | `getAssessmentForViewer`, `maybeUnlockComparison` | + per-question sharing consent |
| Comparisons | `buildSharedComparisonItems`, `MarriageComparisonView` | Engine filters by visibility + consent |
| Curriculum + versions | `MarriageCurriculumEditor`, `marriage-curriculum-service` | Phase 2E extensions |
| Counselor | `MarriageCounselorWorkspace`, counselor-server | Phase 2E session prep |
| Persistence | `marriageStore()`, Prisma Marriage* | Additive migrations only |
| Tests | `test:marriage:*`, Playwright E2E | Extend per phase |
| Feature flag | `marriage-stage2-feature.ts` | Required for all Stage 2 UI/API |

## Gap analysis vs master prompt

| Master area | Current | Phase |
|-------------|---------|-------|
| Couples Learning Center (§3) | Basic `/marriage/learn` | **2A** dashboard sections A–G |
| Modules 1–12 content (§4–§15) | 4 Stage 2 modules + Stage 1 mod-01…20 | **2B–2C** content |
| Activity engine (§16) | Question types in curriculum | **2A** engine + consent |
| Real-time sessions (§17) | None | **2A** polling fallback; **2D** optional WS |
| Counselor prep summary (§18) | Partial journey detail | **2E** |
| Admin Stage 2 (§19) | Editor + visibility | **2E** duration/scripture/tracks |
| Recommendations (§21) | None | **2D** rule-based |
| Notifications (§22) | Existing notify helpers | **2D** neutral copy |
| Full test matrix (§26) | Subset | **2F** + ongoing |

## Schema changes (additive)

| Migration | Models / fields |
|-----------|-----------------|
| `20261015120000_marriage_counseling_hub` | Stage 1 Marriage* (deploy if missing) |
| `20261015140000_marriage_stage2` | ActionPlan, SharedGoal |
| `20261015160000_marriage_stage2_phase2a` | SharingConsent, ActivitySyncSession |

## Phase 2A deliverables (this milestone)

1. `marriage-stage2-activity-engine.ts` — comparison eligibility, activity kinds.
2. Per-question sharing consent store + API.
3. Activity sync status API (polling, no answer leakage).
4. Twelve-module registry (scaffold + links to existing s2-* modules).
5. Couples Learning Center UI (sections A–G).
6. Integration tests for consent filtering.
7. Stage 1 routes unchanged when flag off.

## Manual / credentials (not automatable)

- Production `DATABASE_URL`, `prisma migrate deploy`
- Enable flags on staging only after QA
- Pastoral review of intimacy module copy before public enable
- No production data in E2E (`.e2e-isolated/` only)

## Test commands (Windows)

```powershell
npm.cmd run test:marriage:all
npm.cmd run test:marriage:stage2
npm.cmd run test:marriage:phase2a
npm.cmd run test:marriage:playwright
```

Production readiness for Stage 2 public launch: **not claimed** until Phase 2F checklist is signed off.
