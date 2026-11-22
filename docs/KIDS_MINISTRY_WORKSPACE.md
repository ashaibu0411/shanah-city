# Shanah Kids Ministry workspace (Issue #158)

## Phases delivered

1. **Teacher workspace** — Home tab with today’s assignment, lesson preview, room counts; mobile check-in with first-letter search and registered-child prefill; roster, pickup, incidents (existing flows preserved).
2. **Curriculum** — Extended `KidsLesson` (memory verse, curriculum JSON, materials URL); leader publish; teachers mark lesson complete per service date.
3. **Volunteers** — `KidsTeacherAssignment` (assign, confirm, request substitute); volunteer profiles and safeguarding completion.
4. **Leader dashboard** — Coverage, headcount, attention items, upcoming assignments.
5. **Communication & training** — Team announcements, safeguarding training link, existing parent/lead push alerts.

## Deferred (per spec)

SMS delivery, guardian acknowledgment tracking, automatic emergency escalation timers, dedicated emergency-response dashboard.

## Deploy

Apply migration `20261121120000_kids_ministry_workspace` before enabling DB-backed assignments in production.

## Tests

`npm run test:kids:workspace`