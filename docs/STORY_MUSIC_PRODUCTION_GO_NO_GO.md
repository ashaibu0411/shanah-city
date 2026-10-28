# Share Your Story music — production GO / NO-GO

**Branch:** `fix/story-music-hybrid`  
**Last verified commit:** `cdab4fa` (plus local validation on `64d6b6f` implementation)  
**Decision requested:** Enable hybrid flags on **shanah-city** production after review.

---

## Executive recommendation

| Action | Verdict |
|--------|---------|
| **Merge + deploy code with all `STORY_MUSIC_*` flags unset** | **GO** — restores no behavior change; ships fix path for later enablement. |
| **Enable hybrid flags on production now** | **NO-GO** — **0 authorized playable recordings** in the production catalog; enabling hybrid would empty the attach picker and mark most existing story tracks **unavailable** (by design — no YouTube/Piped in hybrid mode). |

---

## Authorized catalog at launch (requirement 13)

| Source | Playable real tracks |
|--------|----------------------|
| `data/story-music-authorized-catalog.json` | **0** |
| `data/story-music-legacy-migration-map.json` (published + audio) | **0** |
| `data/story-music-church-audio.json` (POC; gated by `STORY_MUSIC_POC_CATALOG_ENABLED`) | **0 in production** (must stay off) |

**Release blocker:** Worship/media must add at least one **documented, authorized** entry to the authorized catalog (and audio under `/story-music/…` or private Blob ref) **before** turning hybrid on. Do not use POC wavs or `poc-*` ids in production.

---

## Staging test results

| Area | Status | Notes |
|------|--------|-------|
| Deploy `fix/story-music-hybrid` to staging | **NOT RUN** | Awaiting explicit deploy authorization. |
| Staging migration (Phase 2 tables) | **NOT RUN** | Optional for launch; JSON catalog works with `STORY_MUSIC_DB_CATALOG=0`. |
| Admin → publish → member E2E | **NOT RUN** | Blocked on staging deploy + env + Blob. |
| Live staging API today | Legacy pre-Phase-2 | No `hybrid` field on `/api/community/story-music`. |

**Local / CI automated tests (PASS):**  
`test:story-music:hybrid`, `security`, `admin`, `phase2` — all pass on branch.  
**Production build:** PASS (`npm run build`).

---

## Android playback results

| Test | Status |
|------|--------|
| WebView / APK against staging hybrid | **NOT RUN** |
| Capacitor default URL | Production (`shanah-city.vercel.app`) unless `CAPACITOR_SERVER_URL` set |

After staging pilot: set `CAPACITOR_SERVER_URL=https://shanah-city-staging.vercel.app`, sync, run cases P1–P7 in [STORY_MUSIC_PILOT_TEST_PLAN.md](./STORY_MUSIC_PILOT_TEST_PLAN.md).

---

## Production migration readiness

| Item | Status |
|------|--------|
| Migration SQL `20261027230000_story_music_phase2` | **Ready, not required for JSON-only launch** |
| Additive only; no `CommunityStatus` schema changes | Yes |
| Rollback | Unset flags → legacy bridge; story rows unchanged ([STORY_MUSIC_ROLLBACK.md](./STORY_MUSIC_ROLLBACK.md)) |
| Run on production DB | **NOT APPROVED** — defer until DB catalog pilot (`STORY_MUSIC_DB_CATALOG=1`) |

---

## Existing-story compatibility

| Mode | Behavior |
|------|----------|
| **Flags off (current production)** | Legacy search + Piped/YouTube stream path; `musicTrackId` preserved. |
| **Hybrid on, no migration audio** | Legacy ids **resolve** but playback `mode: unavailable` with explicit message — **not silent**; YouTube fallback **disabled** in hybrid (policy). |
| **Hybrid on + migration map** | Same `musicTrackId`; authorized file plays via `/api/community/story-music/stream`. |

**Before enablement:** run `npm run report:story-music:legacy-usage` on production DB and publish migration maps for top-used ids.

---

## Security findings (static review)

- Stream by `trackId` only; rate limit 120/min/IP; private cache headers.
- POC tracks hidden unless `STORY_MUSIC_POC_CATALOG_ENABLED=1` (**must remain off on prod**).
- Evidence admin-only; not on community APIs.
- Story music Blob tokens isolated from gallery `BLOB_READ_WRITE_TOKEN`.
- No story-music `console.*` logging in libs.

---

## Rollback readiness

1. Unset all `STORY_MUSIC_*` flags on Vercel production.  
2. Redeploy (current build is sufficient — flags off uses `legacy-playback-bridge`).  
3. **No Postgres data loss** for community stories; hybrid JSON/DB catalog ignored when off.

Verified procedure: [STORY_MUSIC_ROLLBACK.md](./STORY_MUSIC_ROLLBACK.md).

---

## Minimum production environment (when authorized to enable hybrid)

**Required to turn feature on:**

```env
STORY_MUSIC_HYBRID_ENABLED=1
NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1
STORY_MUSIC_POC_CATALOG_ENABLED=0
```

**Recommended for launch (JSON catalog, no DB pilot):**

```env
STORY_MUSIC_DB_CATALOG=0
STORY_MUSIC_ADMIN_WRITE_ENABLED=0
```

**When catalog uses private Blob audio (recommended long-term):**

```env
STORY_MUSIC_BLOB_READ_WRITE_TOKEN=<prod-only token>
STORY_MUSIC_BLOB_STORE_ID=<optional separate store>
```

**Do not set on production until DB admin pilot:** `STORY_MUSIC_DB_CATALOG=1`, `STORY_MUSIC_ADMIN_WRITE_ENABLED=1`, evidence tokens.

---

## Marriage / safeguarding scope

`git diff origin/main...HEAD` contains **no** `marriage` or `safeguard` paths — story music + community only.

---

## Sign-off checklist (for GO on flag enablement)

- [ ] ≥1 authorized playable track in catalog (not POC).  
- [ ] Migration maps for top legacy `musicTrackId` usage **or** accepted unavailable message on old stories.  
- [ ] Staging E2E + Android smoke PASS.  
- [ ] Vercel production env audit: all `STORY_MUSIC_*` off until launch moment; `POC` never `1`.  
- [ ] Leadership sign-off on rights documentation per track.
