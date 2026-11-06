# Ask Shepherd Phase 1 — acceptance report

**Branch:** `feature/ask-shepherd-phase1`  
**Date:** 2026-11-06  
**Staging URL (when deployed):** `https://shanah-city-staging.vercel.app`  
**Final verdict:** **PENDING** (implementation complete locally; staging verification pending env + DB migration)

---

## 1. Implemented functionality

- **Route:** `/leadership/ask-shepherd` — mobile-first chat UI with topic/category, optional consented temperament context, follow-up turns, copy/save/delete, ministry resource list, link to Temperament & Shepherding Hub.
- **API (all under `/api/leadership/ask-shepherd/[departmentKey]/…`, `departmentKey=worship` in Phase 1):**
  - `GET …/session` — department metadata, access flags, guidance categories, `aiConfigured`.
  - `POST …/chat` — send message; creates conversation; loads prior turns; optional `teamMemberUserId` (consented highlights only).
  - `GET …/conversations` — list (saved flagged via `savedToLibrary`).
  - `GET|PATCH|DELETE …/conversations/[conversationId]` — load, mark saved, delete (cascade messages).
  - `GET …/members?q=` — searchable worship roster with `hasSharedTemperamentSummary` (no raw answers).
  - `POST …/access-grant` — pastors only: grant/revoke explicit `AskShepherdAccessGrant` rows.
- **Authorization (server on every API):** session + Phase 1 worship rules (see matrix). **Site admins denied** unless pastoral or worship leader/assistant or explicit grant.
- **Explicit grants:** revocable DB rows; audited.
- **Temperament integration:** optional `teamMemberUserId`; each request calls `buildLeaderHighlightsForUser` (same as temperament hub) — if consent withdrawn, chat returns 400.
- **Safeguarding:** keyword tiers prepend escalation copy on caution/critical topics; no auto-reporting.
- **Rate / cost:** daily chat counter per user (UTC) after AI config check; configurable `ASK_SHEPHERD_DAILY_LIMIT` (default 40). Message/output size caps in server.
- **AI:** server-side OpenAI-compatible `chat/completions` via `ASK_SHEPHERD_AI_API_KEY` (or `OPENAI_API_KEY`), optional URL/model/timeouts. **No key → 503** on chat (not mock live AI).

---

## 2. UI screens

| Screen | Purpose |
| --- | --- |
| `/leadership/ask-shepherd` | Main chat + sections (Ask, Communication, Team, Development, Saved, Resources) |
| Nav | “Ask Shepherd” appears when `ASK_SHEPHERD_ENABLED`, `NEXT_PUBLIC_ASK_SHEPHERD`, and user authorized |

---

## 3. Role / permission matrix (Phase 1 — worship)

| Actor | Nav + APIs |
| --- | --- |
| Senior / Associate Pastor (pastoral assignment) | **Allow** |
| Worship group **leader** or **assistant** (configured worship group) | **Allow** |
| User with **active** `AskShepherdAccessGrant` (pastor-created) | **Allow** |
| Ordinary worship **member** | **Deny** |
| Unrelated ministry leader (not in worship group leadership) | **Deny** |
| Site **admin** (Admin Group only) | **Deny** (unless also pastor / worship leader / grant) |
| Anonymous | **Deny** (401) |

---

## 4. Feature flags (default **off**)

| Variable | Scope |
| --- | --- |
| `ASK_SHEPHERD_ENABLED` | Server APIs + nav permission resolution |
| `NEXT_PUBLIC_ASK_SHEPHERD` | Public UI gate for page + nav item |

---

## 5. AI provider configuration

| Variable | Purpose |
| --- | --- |
| `ASK_SHEPHERD_AI_API_KEY` or `OPENAI_API_KEY` | Bearer token (server only) |
| `ASK_SHEPHERD_AI_API_URL` | Default `https://api.openai.com/v1/chat/completions` |
| `ASK_SHEPHERD_AI_MODEL` | Default `gpt-4o-mini` |
| `ASK_SHEPHERD_AI_MAX_TOKENS` | Cap model output |
| `ASK_SHEPHERD_AI_TIMEOUT_MS` | Request abort |
| `ASK_SHEPHERD_DAILY_LIMIT` | Max successful AI turns per user per UTC day |

**Real-provider verification:** **PENDING** until a deployment sets the above secrets on staging (no billing activation performed from this workspace).

---

## 6. Temperament data-sharing safeguards

- Only **highlights** from shared member assessment (`buildLeaderHighlightsForUser`); no `answersJson`, no leader reflection, no Marriage Prep.
- Consent re-checked **every** chat request; withdrawal immediately yields “no consented summary.”
- Member list API exposes only id, display label, and boolean “has shared summary.”

---

## 7. Database (additive)

Migration: `prisma/migrations/20261106120000_ask_shepherd_phase1/migration.sql`

Models: `AskShepherdAccessGrant`, `AskShepherdConversation`, `AskShepherdMessage`, `AskShepherdAudit`, `AskShepherdUsageDaily`, `AskShepherdGuidanceSource`.

**Apply on isolated staging Neon only** (not production): `npm run db:deploy` with staging `DATABASE_URL`.

---

## 8. Automated tests

| Script | Result |
| --- | --- |
| `npm run test:ask-shepherd` | Access matrix (pure), API route static security, mocked AI adapter |
| `npm run test:app:nav` | Regression — nav builder |
| `npm run test:temperament:shepherding` | Regression — temperament hub |
| `npm run build` | PASS |

---

## 9. Staging acceptance (batch)

**Status:** **PENDING** — requires Vercel preview/staging with env flags + migration + AI key as approved.

Checklist when running on `shanah-city-staging`:

1. `ASK_SHEPHERD_ENABLED=1`, `NEXT_PUBLIC_ASK_SHEPHERD=1`
2. Run migration on staging DB
3. Set `ASK_SHEPHERD_AI_API_KEY` (or `OPENAI_API_KEY`)
4. Verify pastor, worship leader (non-pastor), member deny, admin deny
5. Verify consented vs withdrawn temperament path
6. Verify rate limit (429) with low `ASK_SHEPHERD_DAILY_LIMIT` in staging only

---

## 10. Known limitations

- Phase 1 **worship department only** (`ASK_SHEPHERD_DEPARTMENTS`).
- Approved church documents in `AskShepherdGuidanceSource` are empty until staff seed rows.
- AI adapter targets OpenAI-compatible JSON; other gateways need URL compatibility testing.
- Conversation history loads up to Prisma default message count for GET (very long threads may need pagination later).

---

## 11. Production release plan

1. Merge after review + full staging PASS.
2. Apply migration to production Neon in a maintenance window.
3. Set env flags and AI keys in Vercel production (**explicit approval only**).
4. Train pastors on access-grant workflow for edge-case leaders.

---

## 12. Verdict

**Implementation:** complete on feature branch with tests and build **PASS**.  
**Staging / real AI verification:** **PENDING** (environment-dependent).  
**Overall:** **PENDING** until staging batch completes with live credentials as authorized.
