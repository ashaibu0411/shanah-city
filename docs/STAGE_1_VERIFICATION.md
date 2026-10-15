# Stage 1 Verification — Marriage Counseling Hub

## Automated verification (run locally)

| Command | Purpose |
|---------|---------|
| `npm run test:marriage` | Curriculum + program track config |
| `npm run test:marriage:security` | Marriage API routes require session; no raw `answersJson` in routes |
| `npm run test:marriage:e2e` | Store-level two-partner journey, counselor, export ACL, curriculum versioning |
| `npm install` then `npx playwright install chromium` | Browser binaries (first time) |
| `npm run test:marriage:playwright` | Browser/API two-partner journey (isolated `.e2e-isolated/` data only) |
| `npm run test:marriage:all` | Static + security + store integration (not Playwright) |

Playwright uses **synthetic test accounts** (`*@test.local`) and **never reads or writes** `data/users.json` or production Postgres.

## PostgreSQL configuration

| Requirement | Detail |
|-------------|--------|
| Enable DB | Set `DATABASE_URL` (and `DIRECT_URL` / non-pooler URL for migrations if using Neon/Supabase pooler) |
| Detection | `useDatabase()` in `src/lib/use-database.ts` when `DATABASE_URL` is non-empty |
| Marriage persistence | `marriageStore()` / `marriageCurriculumStore()` merge Prisma adapters over JSON helpers |
| Migration | **`20261015120000_marriage_counseling_hub`** — creates Marriage* tables only (additive) |
| Deploy | `npx prisma migrate deploy` (also run during `npm run build` when `DATABASE_URL` is set) |
| Existing JSON data | **Not auto-imported.** Production cutover: keep JSON files as backup; plan a one-time import before unsetting file paths. E2E and dev can use JSON via env file overrides. |
| Data safety | Migrations do not drop or alter non-marriage tables. Playwright wipes only `.e2e-isolated/`. |

## Server-side authorization & privacy (verified in code + tests)

| Surface | Enforcement |
|---------|-------------|
| Assessments | Session required; `getAssessmentForViewer` returns **partner progress only**, not partner draft/submitted answers |
| Comparisons | `assertJourneyParticipant`; both submitted + unlock record; `buildSharedComparisonItems` filters `shared_after_both_submit` only |
| Counselor journey | `counselorCanViewJourney` / `assertCounselorForJourney`; revoked access honored |
| Counselor notes | `saveCounselorPrivateNote` + counselor-only API POST |
| Export | `exportJourneyData` + participant check; strangers receive 403 |
| Curriculum admin | `isMarriageCurriculumAdmin` on admin curriculum API |

Private / counselor-consent questions are excluded from couple comparison payloads by visibility rules in `marriage-counseling-comparison-utils.ts`.

## Stage 2 readiness

**Playwright (local):** `marriage-two-partner-journey.spec.ts` — 2 tests × `chromium` + `mobile-android` (invite/consent/privacy/comparison/counselor/export + join UI). All passing as of Stage 1 sign-off.

**Safe to begin Stage 2** when:

1. `npm run test:marriage:all` passes on your machine.
2. ~~`npm run test:marriage:playwright`~~ — **verified** (4/4 passed).
3. Production/staging: `prisma migrate deploy` applied successfully against your Postgres instance.
4. Manual smoke (optional but recommended): one staging couple journey with real accounts.

Stage 2 work should **extend** marriage modules/APIs without removing `contentVersion` on responses or changing unlock semantics unless explicitly versioned.

## Deployment tasks requiring **your** action

| Task | Why you |
|------|---------|
| Set `DATABASE_URL` / `DIRECT_URL` on Vercel (or host) | Credentials |
| Run `npx prisma migrate deploy` on production DB | DB access |
| Set `MARRIAGE_COUNSELOR_USER_IDS` / `MARRIAGE_CURRICULUM_ADMIN_USER_IDS` | Your staff user ids |
| Staging smoke with two test member accounts | Real auth + pastoral roles |
| Android `cap sync` + device check for `/marriage` | Device + signing |
| One-time JSON → Postgres import (if you have live data in `data/marriage-*.json`) | Data migration decision |
| CI: add `test:marriage:all` and optional Playwright job | GitHub/Vercel settings |

## Preserve existing records

- Do **not** delete `data/marriage-counseling.json` or `data/marriage-curriculum.json` when enabling Postgres until import is verified.
- Published curriculum versions in DB/JSON remain authoritative; new publishes archive prior published row, not historical submission snapshots (`contentVersion` on each response).
