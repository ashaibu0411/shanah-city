# Marriage Prep platform — implementation audit (milestone)

Branch: `feature/marriage-prep-platform` (development; not merged to main).  
Status: **development in progress** — full eight-session multi-role acceptance **not started** per product direction.

Classification key: **IMPLEMENTED** | **IMPLEMENTED — AWAITING APPROVAL** | **BLOCKED — EXTERNAL DEPENDENCY** | **NOT IMPLEMENTED**

---

## 1. Feature inventory (summary)

| Area | Status |
|------|--------|
| Stage 1 curriculum (20 modules) | **IMPLEMENTED** |
| Stage 1 modules 16–20 enrichment | **IMPLEMENTED** (4 counseling-purpose questions each) |
| Eight-session premarital program + guides | **IMPLEMENTED** |
| Explicit per-partner consent | **IMPLEMENTED** |
| Partner invite / join | **IMPLEMENTED** |
| Counselor assignment + SP approval | **IMPLEMENTED** |
| Premarital scheduling / attendance / clinical notes | **IMPLEMENTED** |
| Session homework (MarriageSessionHomework) | **IMPLEMENTED** |
| Legacy assignments unified in couple homework list | **IMPLEMENTED** (this milestone) |
| In-app notifications + push dedupe | **IMPLEMENTED** (invite/consent/both-consent/readiness wired this milestone) |
| Stage 2 modules 1–5, 7–12 content | **IMPLEMENTED** (flag-gated) |
| Stage 2 intimacy module | **IMPLEMENTED — AWAITING APPROVAL** |
| Production deploy / Neon migrate | **BLOCKED — EXTERNAL DEPENDENCY** (no prod without approval) |
| Comprehensive staging E2E campaign | **NOT IMPLEMENTED** (deferred until dev complete) |

---

## 2. Eight-session content coverage

**IMPLEMENTED** — `marriage-premarital-eight-session-program.ts`, session guides, homework templates, counselor ops panel.

---

## 3. Stage 1 and Stage 2 module coverage

- **Stage 1:** 20 modules in `marriage-counseling-curriculum.ts`; validation via `test:marriage:curriculum`.
- **Stage 2:** Registry + content files; intimacy gated separately. See `docs/MARRIAGE_STAGE2_PASTORAL_REVIEW.md`.

---

## 4–6. Role workflows

- **Couple:** Hub, consent, join, modules, comparisons, homework list, premarital tracker (when partner joined + consent). **IMPLEMENTED** with known dependency on staging QA for edge cases.
- **Counselor:** Command center, journey ops, homework release/review, attendance. **IMPLEMENTED**.
- **Senior Pastor:** Assignment approval, readiness review, certificate issue. **IMPLEMENTED**.

---

## 7. Homework integration status

**IMPLEMENTED** — Single couple list via `listUnifiedCoupleHomeworkForParticipant`; legacy rows use `legacy-assignment:{id}` and route to module assessments; session API rejects legacy IDs to prevent duplicate submission paths.

---

## 8. Notification trigger matrix

| Event | In-app | Push | Notes |
|-------|--------|------|-------|
| Partner invite (intended member) | `partner_invite_active` | yes | `pending_invitee` audience |
| Partner joined | `partner_joined` | yes | Host notified |
| Individual consent | `partner_consent_recorded` | yes | Other partner |
| Both consented | `couple_both_consented` | yes | Both partners + counselor if assigned |
| Assignment pending/approved | SP/admin/couple/counselor kinds | yes | Existing |
| Appointments | couple + counselor kinds | yes | Existing |
| Homework released / feedback | yes | yes | Existing |
| Session completed | yes | yes | Existing |
| Readiness ready-to-proceed | `pastoral_readiness_ready` | yes | Wired on SP save |
| Certificate issued | `final_certificate_issued` | yes | Existing |

Dedupe: `tryCreateMarriagePrepUserNotification` + push delivery records.

---

## 9. Consent and privacy

**IMPLEMENTED** — No auto-consent on invite; loose participant access for consent recording; private/counselor visibility on sensitive items; notification copy avoids answer payloads.

---

## 10. Certificate authorization

**IMPLEMENTED** — Blockers in `marriage-certificate-eligibility`; SP issue flow; notifications on issue/revoke/replace.

---

## 11. Database and migration changes (this milestone)

No new Prisma migrations in this milestone batch (notification + homework merge are application-layer).

---

## 12. Remaining product decisions

- Pastoral sign-off for Stage 2 intimacy and optional Stage 2 master enable in production.
- Whether couple link (non-invite) path should mirror all new in-app notifications (partially still push-only for partner joined).
- Coordinator vs default counselor assignment policy in production config.

---

## 13. Build and targeted tests

Run locally (Windows):

```bat
npm.cmd run test:marriage:curriculum
npm.cmd run test:marriage:couple-homework-hub
npm.cmd run test:marriage:explicit-consent
npm.cmd run test:marriage:homework-waiting-partner
npm.cmd run test:marriage:notifications
npm.cmd run build
```

Agent environment shell was unresponsive during this milestone; **re-run before merge**.

---

## 14. Comprehensive staging acceptance plan (when dev complete)

1. Two test members: invite → join → consent (order both ways) → assessments → comparison unlock.
2. Counselor assignment request → SP approve → couple sees counselor.
3. Schedule/reschedule/cancel appointment — notifications and hub notices.
4. Complete 8 sessions with homework release, individual/joint submit, counselor feedback.
5. Attendance + clinical completion → readiness → SP ready_to_proceed → certificate issue.
6. Stage 2 off on staging default; optional branch with flags for modules 7–12 only.
7. Regression: waiting partner can do individual homework; hub no 500 before partner join.

---

*Last updated: development milestone on `feature/marriage-prep-platform`.*
