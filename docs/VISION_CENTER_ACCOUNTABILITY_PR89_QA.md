# Vision Center — Leadership Accountability & Reminders (PR #89)

## Scope

- **Post-approval discussion:** assigned ministry leaders and Senior Pastor can continue asking questions and proposing implementation adjustments, but an approved plan's pastoral text remains read-only.
- **Annual accountability tasks:** generated once (idempotently) when a submitted leader's plan is approved; an authenticated daily cron backfills already-approved plans.
- **Men of Legacy 2027:** 12 monthly prayer checkpoints, 6 bimonthly breakfast checkpoints, 12 monthly Sunday attendance outreach checkpoints, 12 general monthly planning checkpoints, 4 quarterly reviews and 1 Father's Day flagship planning milestone (47 assigned tasks). Dates on prayer/breakfast checkpoints are MONTH-END ACCOUNTABILITY DEADLINES, not scheduled event times.
- **Other ministries:** 12 monthly leadership checkpoints and 4 quarterly performance reviews for every assigned leader.
- **Pastoral custom deadlines:** owner can assign a confirmed planning date after approval; it is not a public ChurchEvent.
- **Reminders:** Vercel daily cron at 15:00 UTC; calculations use America/Denver date. On the 25th preview the upcoming month, on the 1st summarize responsibilities, 7 days/1 day before a *confirmed custom or quarterly deadline*, and Father's Day 90/60/30-day advance notices. One generic push per assignment/plan/period/delivery key. No private document text in push.
- **Private UI:** leader's upcoming work in Vision Center directory, month-by-month checklist on own plan, Senior Pastor's cross-ministry status dashboard.
- **Reuse:** existing monthly ministry reports and authorized report summaries, existing Groups and Calendar, existing notification preferences.

## Access acceptance

| Scenario | Expected |
| --- | --- |
| Senior Pastor | All plans, task counts, progress, monthly report status (known ministry group mapping), custom milestones |
| Assigned ministry leader | Own plan/tasks only, questions/suggestions after approval, complete own tasks |
| Other ministry leader | Cannot fetch another plan's tasks or mark them complete (403/404) |
| Member without assignment | Cannot read plan/task or see pastor overview |
| Anonymous | 401 |
| Invalid cron Authorization | Reject; never run reminder delivery |
| Duplicate cron delivery | Unique `VisionReminderDelivery` claim prevents duplicate push |
| Push disabled/unregistered | Tasks still visible in app; push is best effort |

## Database

Additive migration `20261115083000_vision_leadership_milestones`, two new tables: `VisionMilestone` and `VisionReminderDelivery`. No existing VisionPlan/assignments/comments modified.

**Isolated Neon staging project**: `late-moon-18456188` main branch applied and verified, `_prisma_migrations` recorded; both new tables present.

**Production Neon project**: `red-surf-98807264` main branch: **NOT migrated**; both new tables absent as verified. Do not merge production until production migration and live deployment are explicitly authorized.

## Verification

Static source/code contract checks passed. `npm run test:vision:phase1` now includes `scripts/vision-leadership-accountability.test.ts` but has **not yet been executed in an authenticated build environment**. GitHub Vercel staging check remains pending; Vercel staging project was not accessible to this connected team for a hosted end-to-end walkthrough.

Before production:
1. Execute `npm run test:vision:phase1`, `npx prisma validate`, `npx prisma generate`, `npm run build` with an isolated staging DATABASE_URL.
2. Staging pastor→assigned leader→acknowledge→submit→approve→generated tasks→post-approval questions→custom deadline→task completion; verify cross-ministry 403.
3. Check responsive mobile page layout and no Calendar/event changes.
4. Verify cron with a fake date on isolated staging, idempotency on rerun, no unauthorized delivery, no sensitive text in push.
5. Only after QA + owner release approval: migrate production before merge/deploy, record Prisma migration, observe Vercel READY.

## Current limitations
- Exact prayer/breakfast event dates are NOT inferred. Configure them in Calendar; create a custom dated leadership milestone only when an actual preparation date is confirmed.
- Reminders use push subscriptions/preferences; task list persists without push.
- Vision Center doesn't create a second monthly report form or maintain duplicate attendance counts.
