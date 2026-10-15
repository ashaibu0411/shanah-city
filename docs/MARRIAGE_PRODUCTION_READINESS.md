# Marriage Counseling Hub — Production Readiness

Last updated: production release pass (curriculum admin, counselor dashboard, DB persistence, automated journey tests).

## Completed features (end-to-end in code + integration tests)

| Area | Feature | Verification |
|------|---------|--------------|
| **Curriculum** | Visual editor: modules/questions add, edit, remove, reorder | `/marriage/admin/curriculum` + `MarriageCurriculumEditor.tsx` |
| **Curriculum** | Question types (choice, Likert, written, scenario, ranking, etc.) | Editor type picker + seed catalog |
| **Curriculum** | Draft save, publish, archived versions | `POST /api/marriage/admin/curriculum` |
| **Curriculum** | Version history; submissions keep `contentVersion` | `test:marriage:e2e` immutability + publish |
| **Curriculum** | Option id + label editing (ranking/priorities/multiple choice) | Editor options panel |
| **Couple journey** | Invite codes, two-partner journey, assessments | Hub + invite APIs + store |
| **Privacy** | Partner drafts hidden until submit; comparison after both + unlock | Server `getAssessmentForViewer` + integration test |
| **Counselor** | Dashboard, couple detail, attention areas, comparisons | `/marriage/counselor`, `/marriage/counselor/journey/[id]` |
| **Counselor** | Sessions, homework, private notes, revision approve/deny | APIs + UI |
| **Counselor** | Counselor-only answers (consent visibility) | `getCounselorJourneyDetail` |
| **Privacy** | Export (own data), deletion request, counselor revoke | `POST /api/marriage/privacy` |
| **Persistence** | `marriageStore()` + `marriageCurriculumStore()` → Prisma when `DATABASE_URL` | `src/lib/stores/*-store.ts` |
| **Programs** | Premarital / enrichment / guided tracks, 20-module seed | `test:marriage` |

## Automated tests

| Command | What it verifies |
|---------|------------------|
| `npm run test:marriage` | Static config (20 modules, program tracks) |
| `npm run test:marriage:security` | Marriage API session auth static checks |
| `npm run test:marriage:e2e` | Full store journey (see `STAGE_1_VERIFICATION.md`) |
| `npm run test:marriage:playwright` | Browser two-partner journey (`.e2e-isolated/` only) |

Run before release:

```bash
npm run test:marriage:all
npx playwright install chromium
npm run test:marriage:playwright
npx prisma generate
npm run build
```

Stage 1 sign-off: **`docs/STAGE_1_VERIFICATION.md`**

## Manual QA still required (not run in CI here)

- [ ] Two real member accounts in browser: invite → accept → assess → compare → discuss
- [ ] Logout / login persistence with **production** `DATABASE_URL`
- [ ] Counselor flow on staging with real pastoral role or `MARRIAGE_COUNSELOR_USER_IDS`
- [ ] Mobile layout 320–430px and Android APK (`npm run mobile:sync` + device)
- [ ] Intimate/financial modules: confirm private + counselor-consent questions never appear in couple compare UI

## Deployment requirements

1. Set `DATABASE_URL` on the host (JSON fallback is dev-only; production should use Postgres).
2. Run `npx prisma migrate deploy` — includes `20261015120000_marriage_counseling_hub`.
3. Optional env:
   - `MARRIAGE_COUNSELOR_USER_IDS` — comma-separated user ids
   - `MARRIAGE_CURRICULUM_ADMIN_USER_IDS` — comma-separated user ids
4. No Firestore for counseling data (session auth + Prisma/JSON only).
5. If migrating from file-only `data/marriage-*.json`, run one-time import strategy before cutover (see `npm run db:seed` / project migration scripts).

## Security notes

- Partner answer bodies are not returned in assessment API until submitted (partner sees status only).
- Comparison and shared discuss payloads exclude `private_reflection` and `counselor_with_consent` from couple views.
- Counselor routes call `assertCounselorForJourney` / `counselorCanViewJourney` on the server.
- Audit log records actions (export, note saved, session created), not answer text.

## Outstanding / non-blocking

| Item | Notes |
|------|--------|
| Playwright | Run locally after `npx playwright install chromium` |
| Staging smoke with real accounts | Recommended once per release |
| Android device pass | Capacitor shell; verify marriage routes in WebView on device. |

## Removed / obsolete

- `MarriageCurriculumAdmin.tsx` — replaced by `MarriageCurriculumEditor.tsx`.
