# Temperament & Shepherding Hub — Shanah Worship Pilot Report

**Branch:** `feature/temperament-shepherding-worship-pilot`  
**Content / scoring version:** `tsw-2026.1` (see `src/lib/temperament-shepherding-content.ts`)  
**Report date:** 2026-11-06  

---

## Executive recommendation

**Technical build / automated checks:** **PASS** (local `npm run build`, `npm run test:temperament:shepherding`).  

**Staging pastoral acceptance:** **NOT EXECUTED** in this environment — no staging URL or isolated Neon credentials were available to the implementer; see “Staging” below.

---

## Implemented features (pilot scope)

- **Member assessment** (~40 five-point Likert items) plus **10 leader-only** items on the leader path; save/resume (draft), progress, submission with explicit **data-use consent** timestamp.
- **Deterministic scoring:** classical tendency weights normalized to a 0–100 scale; dimension scores mapped to 0–100 from answered items only; **mixed profile** secondary tendency when top scores are close; **unanswered items** excluded from averages.
- **Private results** stored as `TemperamentAssessmentSnapshot` (scores JSON + highlights JSON + shepherding guidance JSON); **raw answers** returned only for **draft** state in `/api/.../me`; withheld after submit.
- **Opt-in leader sharing:** checkbox after member submit updates `shareSnapshotWithLeader` + `leaderShareConsentAt`; leaders see **highlights only** via `/api/.../members/[userId]/shared` (audit logged).
- **Leader dashboard** (authorized worship leaders / assistants or pastoral oversight): roster participation status, shared-profile list, coarse **team dimension averages** (consenting, submitted members only), leadership reflection snippets for submitted leader assessments, static **communication / conflict guidance** blocks, suggested discussion topics.
- **Invitations:** `POST /api/temperament-shepherding/worship/invitations` records/resets invitation row; optional **production-only** push when `TEMPERAMENT_SHEPHERDING_SEND_INVITE_PUSH=1` and `notify: true` (default test path uses `notify: false`).
- **Audit:** `TemperamentShepherdingAudit` for draft save, submit, consent changes, dashboard view, shared-profile view, invitations.
- **UI:** `/worship/shepherding` (client hub) + link from worship planner hero when `canAccessTemperamentShepherdingHub` is true.
- **Feature gating:** `TEMPERAMENT_SHEPHERDING_HUB_ENABLED=1` **and** `NEXT_PUBLIC_TEMPERAMENT_SHEPHERDING_HUB=1` required for nav entry; APIs also require server flag + `DATABASE_URL`.

---

## Screens and navigation

| Area | Path / entry |
|------|----------------|
| Hub (member + leader sections) | `/worship/shepherding` |
| Worship planner entry | Banner link on `/worship` (when hub permissions + public flag on) |
| APIs | `/api/temperament-shepherding/worship/me`, `.../me/consent`, `.../leader/dashboard`, `.../members/[userId]/shared`, `.../invitations` |

Sections in the hub client: Overview, My temperament, Leadership profile (if authorized), My team, Shepherding insights, Invitations (leader/pastoral).

---

## Data model and migrations

**Prisma models** (see `prisma/schema.prisma`):

- `TemperamentAssessmentResponse` — per user / department / `contentVersion` / `assessmentKind` (`member` \| `leader`); `answersJson`, consent fields, `submittedAt`.
- `TemperamentAssessmentSnapshot` — one-to-one with response; `scoresJson`, `highlightsJson`, `guidanceJson`, `disclaimer`.
- `TemperamentAssessmentInvitation` — `departmentKey`, inviter, invitee, `status`.
- `TemperamentShepherdingAudit` — append-only audit trail.

**Migrations:**

- `prisma/migrations/20261106120000_temperament_shepherding_hub/migration.sql` — creates tables.
- `prisma/migrations/20261106131000_temperament_shepherding_hub_fks/migration.sql` — adds FKs to `User` / cascade behavior.

**Versioning:** `contentVersion` on each response rows; new curriculum bumps `TEMPERAMENT_SHEPHERDING_CONTENT_VERSION` while preserving historical rows.

---

## Role and permission matrix

| Role | Member assessment | Leader assessment + dashboard | Pastoral oversight (Senior / Associate pastor) | Site admin (no pastoral slot) | Cross-department |
|------|-------------------|------------------------------|--------------------------------------------------|--------------------------------|------------------|
| Worship group member | Yes | No | Yes (complete + dashboard) | **Blocked** from temperament APIs (`assertNotAdminPeekingAtTemperament`) | N/A (pilot: worship only) |
| Worship leader / assistant | Yes | Yes | Yes | Blocked | Other group leaders: **no** access to worship hub APIs |

Pastoral users in `pastoral-roles` assignments bypass the generic admin block for temperament APIs.

---

## Consent and privacy behavior

- **Submit:** requires `dataUseConsent: true` → `dataUseConsentAt` set.
- **Leader visibility:** only `TemperamentLeaderSharedHighlights`-style summary when `shareSnapshotWithLeader` and `leaderShareConsentAt` are set.
- **Withdrawal:** unchecking share clears `leaderShareConsentAt` and sets `shareSnapshotWithLeader` false (audit logged).
- **Marriage Hub:** temperament code paths do **not** read marriage counseling stores.

---

## Assessment scoring (summary)

1. **Classical:** For each answered item, use `(likert - 3) * classicalHint[temperament]`; clip negatives to zero; normalize the four weights to sum to 100.
2. **Dimensions:** Per dimension, average answered items (1–5), map to 0–100.
3. **Profile text:** Derived from dominant classical + dimension labels; formative language only (no diagnosis, no superiority).

---

## Tests executed

| Test | Result |
|------|--------|
| `npm run test:temperament:shepherding` (scoring + static API security) | **PASS** |
| `npm run build` (Next.js production compile) | **PASS** |
| Full `npx tsc --noEmit` over `scripts/` | **NOT EXECUTED** (repo has pre-existing script TS errors unrelated to this hub) |

---

## Tests not executed (or partial)

- Staging E2E with synthetic Senior Pastor / Worship Leader / members / unauthorized leader accounts.
- Manual mobile / accessibility audit beyond responsive layout assumptions.
- Penetration / auth fuzzing beyond static route checks.
- Production deploy.

---

## Staging deployment

**Staging URL:** not set by this implementation (no Vercel project linkage or Neon staging URL in session).  

**Required env (staging):** `DATABASE_URL`, `TEMPERAMENT_SHEPHERDING_HUB_ENABLED=1`, `NEXT_PUBLIC_TEMPERAMENT_SHEPHERDING_HUB=1`; run `npx prisma migrate deploy` against the **staging** database only.

---

## Known limitations

- **Group roster source:** Dashboard participation pulls `memberIds` from the configured worship group JSON/DB — if roster is incomplete, counts skew.
- **Leader “View shared summary” UI:** uses a simple JSON panel for the pilot (audit still logs server-side).
- **Invitation UX:** “Record invite” does not list search — uses roster from dashboard participation.
- **Pilot UI gate:** Planner link requires both server and `NEXT_PUBLIC_*` flags so the feature stays dark by default.

---

## Security considerations

- Session required on all temperament routes; **answers JSON never** included in JSON responses after submit.
- **Admin isolation:** generic admins blocked unless they hold Senior/Associate pastor assignment used by `getPastoralRoleAssignments`.
- **Audit** on sensitive reads and consent changes.

---

## Production release checklist (for a future release)

1. Apply migrations to production Neon **only after** pastoral approval and change window.
2. Set `TEMPERAMENT_SHEPHERDING_HUB_ENABLED=1` and `NEXT_PUBLIC_TEMPERAMENT_SHEPHERDING_HUB=1`.
3. Train worship leaders on **consent-only** viewing and pastoral escalation for sensitive cases.
4. Optionally enable `TEMPERAMENT_SHEPHERDING_SEND_INVITE_PUSH=1` if product wants invite pushes (still optional per call).

---

## Final PASS/FAIL

| Criterion | Status |
|-----------|--------|
| Integrated pilot code + migrations | **PASS** |
| Automated tests + production build | **PASS** |
| Staging deployment + pastoral sign-off | **FAIL** (not performed here — blocked on environment) |
