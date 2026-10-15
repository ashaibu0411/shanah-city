# Stage 2 — Staging acceptance checklist

Use this on a **staging** environment with PostgreSQL and real (non-production) test accounts. This document does not substitute for automated CI; it is the manual sign-off path before Phase 2C.

## Environment

| Variable | Staging value |
|----------|----------------|
| `DATABASE_URL` | Staging Postgres connection string |
| `MARRIAGE_HUB_STAGE2_ENABLED` | `1` |
| `NEXT_PUBLIC_MARRIAGE_STAGE2` | `1` |
| `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` | **unset** until pastoral review |

### Database

```bash
npm.cmd run db:deploy
```

Confirm migrations include `20261015120000_marriage_counseling_hub`, `20261015140000_marriage_stage2`, `20261015160000_marriage_stage2_phase2a` (and any newer marriage migrations).

### Curriculum publish (recommended once per staging cut)

1. Sign in as a curriculum admin.
2. Open Marriage curriculum admin → create draft from seed (includes Stage 2 modules when flags are on).
3. Publish draft — **publish now freezes full Stage 2 module banks** into the version snapshot.
4. Note the published `version` label; new journeys should use it via hub `contentVersion`.

## Two test accounts — invitation flow

1. **Partner A:** Sign in → Marriage hub → start premarital journey → create invite → accept consent on device.
2. **Partner B:** Sign in → `/marriage/join` → enter invite code → accept consent.
3. Confirm both see the same journey on `/marriage` and `/marriage/learn`.

## Modules 1 & 2 (minimum)

| Step | Partner A | Partner B |
|------|-----------|-----------|
| Open module | `/marriage/module/s2-temperament-discovery` | Same |
| Complete required items | Use lesson list; submit via **Review and submit** | Same |
| Private item | Answer a private reflection; confirm partner cannot see text in API/UI | — |
| Module 2 | `/marriage/module/s2-mod-02-family-background` | Same |

## Save / resume / re-login

1. Start a lesson, answer one item, leave.
2. Refresh — progress count on lesson card should increase.
3. Sign out (clear session) → sign in → reopen module — progress persists.

## Comparison & consent

1. Both submit Module 1.
2. Open **Compare** — shared likert/scenarios appear; private items do not.
3. For an explicit-consent or high-sensitivity shared item, leave consent **off** — confirm it is omitted from compare until both grant consent.

## Temperament summary

After both submit Module 1, open compare — **Temperament snapshot** section visible (dimension labels, non-diagnostic disclaimer).

## Financial budget

1. Open `/marriage/module/s2-financial-workshop`.
2. Complete hypothetical budget (expenses ≤ income) → submit succeeds.
3. Attempt submit with expenses > income — server rejects.

## Counselor

1. Counselor account opens journey detail for the test couple.
2. **Lesson progress (Stage 2)** shows counts only — no private answer text.
3. Assign a follow-up activity; couple sees it on hub/learn.

## Mobile

- Browser: 390px width — learning center and lesson cards usable.
- Capacitor WebView: same flows as above on Android build with staging API base URL.

## Intimacy module (must stay off)

- Learning center must **not** list `s2-mod-06-intimacy`.
- `GET /api/marriage/assessment/s2-mod-06-intimacy` returns error when approval flag is off.

## Sign-off

- [ ] Postgres migrations applied
- [ ] Curriculum published with Stage 2 snapshot
- [ ] Two-partner journey + Modules 1–2
- [ ] Compare, consent, temperament, budget, counselor progress
- [ ] Intimacy gated
- [ ] Mobile spot-check

Pastoral lead: _________________ Date: _________
