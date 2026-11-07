# Ask Shepherd Phase 1 — acceptance report (privacy + staging)

**Branch:** `feature/ask-shepherd-phase1`  
**PR:** [#31](https://github.com/ashaibu0411/shanah-city/pull/31)  
**Latest commit (this handoff):** `a83408b`  
**Staging URL:** `https://shanah-city-staging.vercel.app`

---

## Final PASS/FAIL matrix

| Item | Status | Evidence / note |
| --- | --- | --- |
| Server-verifiable save (no client trust) | **PASS** | HttpOnly signed cookie `ask_shepherd_ephemeral_priv` + `validateEphemeralSaveMessages` |
| Fail closed: missing / invalid / expired / user-dept mismatch | **PASS** | `privacy_session_invalid` **400**; unconfigured secret **503** `privacy_verification_unconfigured` |
| Team-context thread cannot be saved | **PASS** | Receipt `tc=1` → `team_context_save_blocked` **400** |
| Clear cookie cannot unlock paste / replay | **PASS** | Save: fresh cookie → `save_provenance_mismatch` **400**; chat with stale history → `ephemeral_session_mismatch` **409** (`validateEphemeralHistoryAgainstCookie`) |
| Each assistant line has provenance (hash receipts) | **PASS** | Only successful ephemeral chat turns append receipts; save matches every pair |
| Forged / tampered transcript | **PASS** | `save_tampered_transcript` **400** |
| Regression tests | **PASS** | `npm run test:ask-shepherd` (includes `scripts/ask-shepherd-team-context-privacy.test.ts`) |
| `test:app:nav`, `test:temperament:shepherding`, `npm run build` | **PASS** | Run in workspace |
| Non-pastoral worship leader auth | **PASS** | `scripts/ask-shepherd-access.test.ts` (`worship_leader_or_assistant`) |
| Critical safeguarding without AI (code path) | **PASS** | Receipt `kind: crit` + static `assistantMessage` in tests |
| No AI configured (chat error path) | **COVERED in code** | `runAskShepherdChatTurn` returns 503 when AI missing; failed turns **do not** mint save receipts |
| **Staging deploy** (Vercel deployment id) | **BLOCKED** | No Vercel token / project linkage from this workspace |
| **Synthetic staging users** (pastoral, leader, member, unauthorized) | **BLOCKED** | No credentials / browser session here |
| **Real AI provider E2E** | **BLOCKED** | Per policy — not PASS |

**Overall:** **FAIL** for **staging deploy + synthetic acceptance + real AI**. **PASS** for **privacy implementation + automated tests + build** in this repo.

---

## Privacy mechanism (PR #31)

1. **Cookie name:** `ask_shepherd_ephemeral_priv` (HttpOnly, signed, rolling expiry).
2. **Payload:** `userId`, `departmentKey`, opaque **`sid`**, **`receipts[]`** with **SHA-256 first 16 hex** of user + assistant text (`hu`, `ha`), **`tc`** team-context flag, **`k`** = `ai` \| `crit`.
3. **`POST …/chat` (ephemeral, success only):** appends one receipt with exact server `userMessage` + `assistantMessage` (critical safeguarding uses static text).
4. **`POST …/save`:** `validateEphemeralSaveMessages` — fails unless alternating user/assistant pairs match **every** receipt hash; any **`tc=1`** blocks; missing cookie / mismatch → **400**; no **`ASK_SHEPHERD_PRIVACY_SECRET`** in production/staging → **503** (fail closed). `CRON_SECRET` fallback **only in development**.
5. **`POST …/session/clear-ephemeral-team-context`:** clears cookie → **new `sid`**, empty receipts → pasted old transcript cannot match.

**Environment:** set **`ASK_SHEPHERD_PRIVACY_SECRET`** on isolated staging (generate locally; **never commit**). See `.env.example`.

---

## Security test evidence (local)

```text
npm run test:ask-shepherd
# → ask-shepherd-access.test.ts OK
# → ask-shepherd-security.test.mjs: OK (8 routes)
# → ask-shepherd-ai-mock.test.ts OK
# → ask-shepherd-team-context-privacy.test.ts OK
npm run test:app:nav        # OK
npm run test:temperament:shepherding  # OK
npm run build               # OK
```

---

## Deployment

**Vercel deployment ID:** **N/A (BLOCKED)** — not available from this environment.

**Required:** deploy branch `feature/ask-shepherd-phase1` to the existing isolated staging project with **`ASK_SHEPHERD_PRIVACY_SECRET`** set; do **not** merge `origin/staging` or production.

---

## Production release

Unchanged — **do not merge PR #31 to `main`** until staging sign-off.
