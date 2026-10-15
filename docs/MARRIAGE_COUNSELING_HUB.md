# Marriage & Relationship Counseling Hub

## Routes

| Route | Purpose |
|-------|---------|
| `/marriage` | Hub |
| `/marriage/join` | Accept journey invitation code |
| `/marriage/about` | Consent & limits of care |
| `/marriage/journal` | Shared / private journal |
| `/marriage/counselor` | Counselor workspace (sessions, homework, authorized answers) |
| `/marriage/admin/curriculum` | Curriculum administration |
| `/marriage/module/[moduleId]` | Assessment |
| `/marriage/module/[moduleId]/compare` | Comparison |
| `/marriage/module/[moduleId]/discuss` | Discussion exercises |

## APIs

| Endpoint | Notes |
|----------|--------|
| `GET /api/marriage/hub` | Progress, homework, invite code, sessions |
| `POST /api/marriage/journey` | Spouse-link journey start, consent |
| `POST /api/marriage/invite` | `create`, `accept`, `revoke` |
| `GET\|POST /api/marriage/admin/curriculum` | Draft, publish, archive, preview |
| `POST /api/marriage/counselor/sessions` | Create / update sessions + homework |
| `GET /api/marriage/counselor/journey/[id]` | Counselor detail |
| `POST /api/marriage/counselor/revision` | Request / approve revision after submit |
| `GET /api/marriage/privacy?journeyId=` | Export own data |
| `POST /api/marriage/privacy` | Deletion request, revoke counselor, admin archive |
| `POST /api/marriage/assignments` | Mark homework complete |

## Data stores

- `data/marriage-counseling.json` — journeys, responses, invites, sessions, assignments, audit (no answer text in audit meta)
- `data/marriage-curriculum.json` — published curriculum versions & program tracks
- Prisma models extended for production (`MarriageCounselingJourney` participant fields, invites, revisions, audit, assignments)

**Firebase:** not used for counseling data. No Firestore rule changes.

## Program tracks

- **Premarital:** 12 required core modules + optional 13, 14, 18, 19 (20-module ready)
- **Enrichment:** different subset/order (see `marriage-counseling-program-tracks.ts`)
- **Guided:** `guidedModuleIds` on journey set by counselor

## Roles

### Who can counsel (view workspace, sessions, authorized answers)

Any signed-in member who matches **one** of:

1. **`MARRIAGE_COUNSELOR_USER_IDS`** — comma-separated user ids on Vercel (for lay or additional counselors).
2. **Pastoral role** — `senior_pastor` or `associate_pastor` in church pastoral role assignments.
3. **Church admin** — users who can manage the admin portal.

Counselors open **`/marriage/counselor`** (also linked from the marriage hub when the hub API marks `isCounselor`).

### Which couples a counselor sees

- Each journey may store **`counselorUserId`** (optional). When set, that counselor “owns” the case; other counselors are blocked unless they are church admins.
- When **`counselorUserId` is empty** (typical for couples who start on their own with an invite code), **any** marriage counselor can open the journey.
- The counselor dashboard lists journeys assigned to you; if none are assigned, it falls back to **all active journeys** (so the senior pastor can see self-started couples).

There is **no in-app UI yet** to reassign a journey to another counselor after it starts. To delegate today: add their user id to **`MARRIAGE_COUNSELOR_USER_IDS`**, or set their pastoral role. A future release can add “assign counselor” on the journey record.

### Follow-up “assignments” (homework)

These are **tasks for the couple** (readings, activities), not assigning a different pastor as counselor. Created from the counselor journey detail / workspace APIs.

### Curriculum admin

- **`MARRIAGE_CURRICULUM_ADMIN_USER_IDS`**, or church admin, or anyone who qualifies as a marriage counselor.

## Testing

```bash
npm run test:marriage
```

Two-account manual QA and Android APK navigation were **not** run in CI. Run on devices before release.

## Migration

Existing journeys with `coupleLinkId` unchanged. Responses keep `contentVersion`. New fields optional on journey records.
