# Ask Shepherd Phase 1 — Consolidated Staging Acceptance

**Review date:** November 6, 2026
**Repository:** ashaibu0411/shanah-city
**PR:** #31 (feature/ask-shepherd-phase1 → main), open and unmerged
**Deployed source commit:** 7d0dfaa4867f85b09807f7d3db397989bbb54456
**Staging deployment:** dpl_7FWdHFmfpkohnjrFDSiGXr4zNcXJ (READY)
**Staging URL:** https://shanah-city-staging.vercel.app/leadership/ask-shepherd
**Production:** unchanged. This report is not authorization to merge, migrate, or enable the feature in production.

## Release verdict

**STAGING BUILD AND AUTOMATED ACCEPTANCE: PASS.**
**FULL END-TO-END ROLE AND PRIVACY ACCEPTANCE: PARTIAL / NOT YET CERTIFIED.**
**PRODUCTION RELEASE: HOLD** until authenticated staging role tests, explicit-save/delete, consent withdrawal, and the release checklist below are completed.

## Verified evidence

| Area | Verdict | Evidence |
| --- | --- | --- |
| Staging deployment | PASS | Deployment dpl_7FWdHFmfpkohnjrFDSiGXr4zNcXJ READY and live staging alias mapped to it |
| Independent CI | PASS | GitHub Actions Ask Shepherd security and UI checks, run 42330761917, all test steps successful |
| Vercel staging build | PASS | Isolated staging run with ASK_SHEPHERD_STAGING_ACCEPTANCE=1; executes test:ask-shepherd, test:app:nav, test:temperament:shepherding before Next.js build |
| Safe AI Markdown | PASS (automated) | Headings, ordered/unordered lists, emphasis, quoting, HTML escaping and no executable generated links tested with React server rendering |
| Leadership UI accessibility/readability | PASS (implementation); browser visual pending | Increased response typography/spacing, compact empty state, chat log labeling |
| Privacy receipt enforcement | PASS (automated) | Missing, forged, expired, wrong-user cookies; clear+replay; signed transcript hashes; and consented team-context save blocking |
| Critical safeguarding response | PASS (live, prior source) | User browser screenshot showed immediate static guidance without requiring AI |
| Critical safeguarding save restriction | PASS (server and UI code); updated browser check pending | Signed receipt kind crit cannot be saved; UI hides Save to library after static critical response |
| Real AI response | PASS (live, prior source) | User browser screenshot showed actual AI-generated pastoral guidance and Scripture on isolated staging |
| Staging privacy secret / AI credential | PRESENT | Both set in isolated staging Vercel project; actual secret values not displayed |
| AI spend cap | USER-CONFIRMED; NOT INDEPENDENTLY VERIFIED | User configured a $5 monthly key budget; Gateway budget settings not readable through connected deployment tools |
| No automatic chat persistence | PASS (database observation) | Staging has 0 AskShepherdConversation rows and 0 AskShepherdMessage rows following user's AI test |
| Production isolation | PASS | PR #31 not merged; live production deployment unchanged |

## Role-authorization evidence

Automated tests cover Senior Pastor, Associate Pastor, non-pastoral worship leader and assistant, regular worship member, unrelated leader, and explicit grant. Backend access remains deny-by-default and every route has session authentication checks.

Staging pastoral-role slots exist but belong to synthetic QA identities. One real staging reviewer received an explicit worship-department grant and successfully opened the feature. The staging worship group currently has 3 members, 0 designated leaders, and 0 designated assistants. Therefore, we **cannot claim a signed-in non-pastoral leader or assistant E2E PASS** from this environment. Production choir-group metadata shows 1 leader and 1 assistant, both on the membership roster, but production was not tested or modified.

## Outstanding end-to-end checks before production

1. Use isolated synthetic staging accounts to verify Senior/Associate Pastor, actual non-pastoral worship leader, worship assistant, ordinary member, unrelated department leader, and generic site admin authorization at both UI and API layers. Do not change real production roles.
2. From an authorized synthetic user, verify a context-free conversation is not automatically stored, then explicitly save, reopen, and delete it. Confirm rows are created only by explicit Save.
3. Verify a consented member temperament summary is scoped to the authorized department, withdrawal blocks subsequent retrieval, and a contextual conversation cannot be saved.
4. Confirm the updated Markdown answer renders properly in an authenticated browser, and a critical safeguarding response does not display the Save button.
5. Confirm the $5 monthly AI Gateway key quota is effective (without deliberately exhausting or raising it), automatic top-ups are disabled, and provider logs contain no private questions or answer text.
6. Triage dependency advisories separately. The isolated CI npm installation surfaced dependency audit warnings; they have not been attributed to this feature or classified for production risk in this acceptance.

## Privacy and safeguarding implementation

- Browser-based ephemeral chat stores no ordinary transcript to the database unless Save is chosen.
- Signed HttpOnly ephemeral privacy receipt cookie binds the session, user, department, per-turn text hashes, and consented team-context usage; no chat message text is stored in the cookie.
- Missing/forged/expired receipts fail closed; stale transcript replay after New chat is rejected.
- Contextual temperament conversations and critical safeguarding conversations are blocked from saved guidance.
- Critical safeguarding requests receive static, human-led safety guidance without needing a working AI provider.
- AI provider errors are sanitized rather than returning raw upstream response bodies.
- The Markdown renderer uses React text escaping and never renders raw HTML from AI messages.

## Production release plan — not yet executed

After outstanding E2E checks receive sign-off: review the PR and provider budget, take a fresh Neon production snapshot, apply the additive Prisma migration, verify least-privilege roles and feature flags, deploy the approved merge SHA, and perform post-release smoke and monitoring checks. No release should automatically send invitations or notify members.

## Commands in the staging acceptance suite

- npm run test:ask-shepherd
- npm run test:app:nav
- npm run test:temperament:shepherding
- npm run build

The temporary ASK_SHEPHERD_STAGING_ACCEPTANCE flag is present on the isolated staging Vercel project to ensure its builds execute the offline test suite. It is not set on the production Shanah City app.
