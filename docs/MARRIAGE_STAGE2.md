# Marriage Hub — Stage 2 (feature-flagged)

Stage 2 extends Stage 1 without replacing assessments, curriculum versioning, or privacy rules.

## Feature flag

| Env | Purpose |
|-----|---------|
| `MARRIAGE_HUB_STAGE2_ENABLED=1` | Server: Stage 2 modules, APIs, learning center |
| `NEXT_PUBLIC_MARRIAGE_STAGE2=1` | Client: hub promo + navigation |

**Default:** off — Stage 1 behavior unchanged.

## Phase 2B (modules 1–6)

Content lives in `src/lib/marriage-stage2-content/` (version `stage2-2026.2b`). Each module has lessons, 55–80+ items, save/resume via lesson hub (`MarriageStage2ModuleRunner`).

| Module ID | Title |
|-----------|--------|
| `s2-temperament-discovery` | Personality & temperament |
| `s2-mod-02-family-background` | Family background |
| `s2-mod-03-communication` | Communication & emotional connection |
| `s2-mod-04-conflict-lab` | Conflict resolution lab |
| `s2-financial-workshop` | Financial workshop + hypothetical budget grid |
| `s2-mod-06-intimacy` | Sex, intimacy & affection (gated — see below) |

**Intimacy gate:** set `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` after pastoral content review. Without it, the module is hidden from the learning center and assessment APIs reject access.

**New question types:** `partner_prediction`, `budget_worksheet` (server validates totals ≤ income).

```bash
npm run test:marriage:phase2b
```

## Feature inventory

| Area | Delivered |
|------|-----------|
| Learning center | `/marriage/learn`, progress bar, resume, activity list |
| Temperament | Module `s2-temperament-discovery`, lesson UX, dimension snapshot on compare |
| Financial workshop | Module `s2-financial-workshop`, budget worksheet UI, private financial fields |
| Conflict lab | Module `s2-mod-04-conflict-lab`, repair worksheet prompts |
| Family / communication | Modules `s2-mod-02-*`, `s2-mod-03-*` |
| Scenario simulator | Module `s2-scenario-library` (legacy 11-topic pack) |
| Shared reflection | Module `s2-learning-reflection` |
| Action plans | Store + API (`create` / `propose` / `agree`) |
| Shared goals | Store + API (`create` / `acknowledge`) |
| Counselor assignments | `POST /api/marriage/counselor/assignments` |
| Hub integration | `stage2` block on `/api/marriage/hub` when flag on |

## Database (additive migrations)

- `20261015140000_marriage_stage2` — `MarriageActionPlan`, `MarriageSharedGoal`

Run: `npx prisma migrate deploy`

## Tests

```bash
npm run test:marriage:stage2
npm run test:marriage:playwright   # includes financial privacy + stage2 dashboard when E2E server flags on
npm run test:marriage:all
```

## Manual acceptance (staging with flags on)

- [ ] Two test accounts complete one Stage 2 activity end-to-end
- [ ] Partner cannot see private financial fields in network tab
- [ ] Temperament insights after both submit
- [ ] Counselor assigns activity; couple marks homework complete
- [ ] Mobile: learning center at 390px width
- [ ] Stage 1 journeys still work with flags **off**

## Curriculum versioning (Stage 2)

- **Publish** merges a full Stage 2 snapshot via `freezeStage2ModulesIntoSnapshot` (see `marriage-curriculum-stage2-merge.ts`).
- **Live catalog** adds missing Stage 2 module ids via `mergeMissingStage2Modules` without overwriting frozen published copies.
- **Historical compare** uses the module copy stored in the published version when present.

## Phase 2B completion (testing & UX)

- Playwright: `e2e/marriage-stage2-phase2b.spec.ts` (learning center, lesson resume, compare, temperament snapshot, budget validation, intimacy gate)
- Lesson UI: sharing labels + consent toggles (`MarriageAnswerSharingConsent`)
- Submit flow: required vs optional summary + `/marriage/module/[id]/submit` review screen
- Counselor journey: `stage2LessonProgress` block (counts only, no private answer bodies)

## Unresolved / follow-up

- Mobile Playwright project (`mobile-android`) may need longer timeouts for Phase 2B spec
- Publish curriculum snapshots that include Stage 2 modules for strict version pinning
- JSON → Postgres import for existing `actionPlans` / `sharedGoals` arrays if any (new fields default empty)

## Production readiness

**Not claimed** until you run tests above on staging and validate with pastoral staff.
