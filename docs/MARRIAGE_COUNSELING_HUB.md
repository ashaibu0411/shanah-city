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

- Counselor: `MARRIAGE_COUNSELOR_USER_IDS`, senior/associate pastor, admin
- Curriculum admin: `MARRIAGE_CURRICULUM_ADMIN_USER_IDS`, admin, counselors

## Testing

```bash
npm run test:marriage
```

Two-account manual QA and Android APK navigation were **not** run in CI. Run on devices before release.

## Migration

Existing journeys with `coupleLinkId` unchanged. Responses keep `contentVersion`. New fields optional on journey records.
