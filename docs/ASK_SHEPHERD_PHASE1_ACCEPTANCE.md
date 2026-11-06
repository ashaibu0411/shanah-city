# Ask Shepherd Phase 1 — acceptance report (privacy + staging)

**Branch:** `feature/ask-shepherd-phase1`  
**PR:** [#31](https://github.com/ashaibu0411/shanah-city/pull/31)  
**Date:** 2026-11-06  
**Staging URL:** `https://shanah-city-staging.vercel.app`

---

## Final verdict (PASS/FAIL matrix)

| Area | Status |
| --- | --- |
| **Team-context save enforcement** (server-verifiable; not `hadTeamContextInSession` body) | **PASS** (signed HttpOnly cookie + `POST …/save` verifies; `POST …/session/clear-ephemeral-team-context` on New chat) |
| **Regression: forged save bypass** | **PASS** (`scripts/ask-shepherd-team-context-privacy.test.ts` in `npm run test:ask-shepherd`) |
| Local: `npm run test:ask-shepherd`, `npm run build` | **PASS** (this workspace) |
| Local: `npm run test:app:nav`, `npm run test:temperament:shepherding` | **PASS** (re-run after cookie change) |
| **Synthetic staging acceptance** (pastoral, worship leader, member, unauthorized) | **FAIL / BLOCKED** — no staging test accounts or browser session from this workspace; cannot execute consolidated role matrix here |
| **Critical safeguarding without AI key** | **FAIL / BLOCKED** for live staging — design + code path verified locally; not exercised against deployed staging in this run |
| **Unsaved non-persistence + save + delete** on staging | **FAIL / BLOCKED** — same as above (needs authenticated staging users + DB visibility optional) |
| **Real AI provider E2E** | **BLOCKED** — credentials not used from this workspace; do not report as PASS |
| Merge `staging` branch / production / migrations | **N/A** — not performed (per instructions) |

**Overall:** **FAIL** for **full staging + synthetic acceptance + real AI** (blocked). **PASS** for **implemented server enforcement + automated tests + build** in this workspace.

---

## 1. Privacy and persistence (FIX 1)

**Requirement:** Unsaved conversations stay temporary; no automatic persistence of questions, titles, responses, or sensitive case detail; follow-up context for unsaved chats without permanent server storage; persist only on explicit **Save**; users can delete saved items; consented temperament summaries are **not** copied into stored chat records.

**Implementation:**

- **Ephemeral turns:** `POST …/chat` accepts `ephemeralHistory` (client-held prior user/assistant turns). For unsaved chats the server **does not** write `AskShepherdMessage` or create/update `AskShepherdConversation` rows except where audit/usage already applies.
- **Explicit save only:** `POST …/save` creates the conversation and messages in one step with `savedToLibrary: true` (`saveEphemeralConversationToLibrary`). The UI uses **Save to library** → this endpoint (not silent PATCH).
- **Team / temperament context:** Highlights are resolved per request via `buildLeaderHighlightsForUser` and fed into the **system prompt only** — they are **not** persisted in conversation rows or messages. After any ephemeral turn that successfully used consented team context, the server sets a **signed HttpOnly** cookie (`ask_shepherd_ephemeral_team`, keyed by `ASK_SHEPHERD_PRIVACY_SECRET` or `CRON_SECRET`). **`POST …/save` reads that cookie** — the client cannot forge **`hadTeamContextInSession`** (field removed). **Save is rejected** when the cookie marks team context used. **New chat** calls **`POST …/session/clear-ephemeral-team-context`** to clear the cookie so a fresh ephemeral session can be saved. If neither secret is set, **save returns 503** `privacy_cookie_unconfigured` (fail closed).
- **Listing / loading:** `GET …/conversations` lists **saved** threads only (`savedToLibrary: true`). `GET …/conversations/[id]` loads **saved** threads only (`savedOnly: true`).
- **Delete:** `DELETE …/conversations/[id]` removes saved threads for the owner.
- **Critical safeguarding:** `assessSafeguardingSignals` at **critical** returns static guidance (`criticalSafeguardingResponseWithoutAi`) **without** calling the model and **without** persisting user message text or assistant body (audit records issue/summary only).

---

## 2. Provider error handling (FIX 2)

**Requirement:** No raw provider errors to the browser; generic client messages; no confidential request/provider body in audit logs; sanitized diagnostics.

**Implementation:**

- **AI adapter** (`ask-shepherd-ai-server.ts`): On HTTP failure, returns `logHint` (e.g. `provider_http_<status>`) and optional `httpStatus` — **no** raw response body in the return value or to the client.
- **Chat API** (`chat/route.ts`): Unexpected errors respond with **"Request could not be completed."** (no stack or provider text).
- **Save / conversation routes:** Catch blocks return generic **"Request could not be completed."** where appropriate; empty-save keeps a specific safe message **"Nothing to save."**
- **Audits** for provider failures: `meta` includes `code`, `logHint`, `httpStatus` — **not** full request/response payloads.

Client-safe strings live in `src/lib/ask-shepherd-errors.ts`.

---

## 3. Safeguarding without AI (FIX 3)

**Requirement:** Critical safeguarding shows immediate safety guidance even if the provider is unavailable; do not auto-save sensitive allegations.

**Implementation:**

- **Critical** path returns static guidance before any AI call; `usedStaticSafeguarding: true` in the JSON response when applicable.
- **No** persistence of user content on that path (see FIX 1).
- Non-critical paths when AI is missing: **503** with `ASK_SHEPHERD_CLIENT_PROVIDER_NOT_CONFIGURED` (generic).

---

## 4. API surface (Phase 1 worship)

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/leadership/ask-shepherd/[departmentKey]/session` | Metadata, `aiConfigured`, categories |
| POST | `…/session/clear-ephemeral-team-context` | Clears team-context cookie after **New chat** |
| POST | `…/chat` | Turn; `ephemeralHistory` for unsaved; optional `teamMemberUserId` (consent-checked) |
| POST | `…/save` | **Explicit** save of ephemeral thread to library |
| GET | `…/conversations` | Saved library list |
| GET/PATCH/DELETE | `…/conversations/[conversationId]` | Load / toggle saved / delete (**GET/DELETE** require saved thread for list consistency) |
| GET | `…/members?q=` | Roster + `hasSharedTemperamentSummary` |
| POST | `…/access-grant` | Pastors: grants |

**Note:** `PATCH …/conversations/[id]` with `savedToLibrary` remains for compatibility; primary happy path for new saves is **`POST …/save`**.

---

## 5. Role matrix and regression coverage

Automated scripts cover:

- `test:ask-shepherd` — access matrix, route auth walk (8 Ask Shepherd `route.ts` files), AI adapter mock, team-context cookie regression
- `test:app:nav` — nav regression (Ask Shepherd behind flags)
- `test:temperament:shepherding` — hub + related API routes

**Manual / staging checklist** (when logged in on staging):

1. Unsaved chat: no new rows in `AskShepherdConversation` / `AskShepherdMessage` until **Save** (verify with DB or absence of new `conversationId` from chat).
2. **Save to library** persists approved turns; **Delete** removes them.
3. Provider/API failure: browser sees generic errors only.
4. AI unavailable (no key): controlled 503-style messaging; critical keywords still get static guidance.
5. Worship leader (non-pastor) vs unauthorized member/admin (see matrix in prior doc sections).
6. Temperament consent withdrawn → 400 with safe messaging.
7. `/worship` and Marriage Hub surfaces unchanged by these tests (spot-check).

---

## 6. Staging deployment

- Workflow: [.github/workflows/vercel-staging.yml](.github/workflows/vercel-staging.yml) runs on **push to `staging`** (not on feature branch pushes to PR alone).
- To deploy this PR’s code to the **staging** Vercel project: merge or fast-forward `staging` to include `feature/ask-shepherd-phase1` and **push `staging`** (does **not** merge PR #31 to `main`).
- If `VERCEL_STAGING_DEPLOY_HOOK` is unset, the workflow logs a warning and skips the hook.

**Production:** unchanged per instructions (no merge of PR #31 to `main` from this task).

---

## 7. Environment (reference only)

Flags: `ASK_SHEPHERD_ENABLED`, `NEXT_PUBLIC_ASK_SHEPHERD`.  
AI: `ASK_SHEPHERD_AI_API_KEY` or `OPENAI_API_KEY`, optional URL/model/limits.  
Privacy cookie signing: **`ASK_SHEPHERD_PRIVACY_SECRET`** (optional; falls back to **`CRON_SECRET`**). Required for team-context save blocking on `POST …/save`.

Migration was applied on staging per your note; **do not** re-run for this hardening batch.

---

## 8. Production release plan (not executed)

1. Merge after review + full staging PASS with authorized credentials.  
2. Apply migration to production Neon in a maintenance window if not already aligned.  
3. Set production env with explicit approval.  
4. Train pastors on access-grant workflow.
