# Share Your Story music — live activation readiness

**Updated:** 2026-10-28  
**Production (flags off):** `4654b4b` on [shanah-city.vercel.app](https://shanah-city.vercel.app)  
**Hybrid on production:** **Not authorized**

---

## 1. Production stability (post-deploy)

| Check | Result |
|-------|--------|
| `/community` | Loads |
| `/api/community/story-music` | `hybrid: false`, legacy catalog |
| Playback `way-maker` | `mode: youtube`, `hybrid: false` |
| POC search | Empty (flag off) |

Re-check after next deploy that removes `public/story-music-poc/` static assets.

---

## 2. Authenticated story publish smoke

| Status | Notes |
|--------|--------|
| **BLOCKED** | No `data/staging-qa-session-cookies.json` or `STORY_MUSIC_QA_SESSION` in this environment. |

**Operator steps (no private content in logs):**

1. Sign in on **staging** with designated QA account.  
2. Community → Share Your Story → attach **legacy** track (flags off) or **authorized** track (hybrid staging).  
3. Publish; confirm `POST /api/community/statuses` returns 200 and story appears in feed.  
4. Optional script: `STORY_MUSIC_QA_SESSION_COOKIE=<session> node scripts/story-music-publish-smoke.mjs` (staging only).

---

## 3. Staging E2E + Android

| Item | Status |
|------|--------|
| Deploy `fix/story-music-hybrid` to `shanah-city-staging` | Pending approval |
| Env (staging only) | See `.env.staging.example` |
| Hybrid + POC for QA | `STORY_MUSIC_HYBRID_ENABLED=1`, `STORY_MUSIC_POC_CATALOG_ENABLED=1`, `STORY_MUSIC_DB_CATALOG=0` unless DB pilot |
| Blob tokens | Staging-only `STORY_MUSIC_BLOB_*` |
| Web pilot | [STORY_MUSIC_PILOT_TEST_PLAN.md](./STORY_MUSIC_PILOT_TEST_PLAN.md) P1–P12 |
| Android | `CAPACITOR_SERVER_URL=https://shanah-city-staging.vercel.app` → `npx cap sync` → APK smoke |

**Verified locally (not staging):** `npm run test:story-music:*`, hybrid POC stream via `story-music://test/` + `test-fixtures/`.

---

## 4. Playback defects to watch in staging

| Area | Risk | Mitigation |
|------|------|------------|
| **Range requests** | Legacy local file stream ignores `Range` header (full file) | Test `<audio>` + WebView; add ranged reads if seek/buffer fails |
| **Rate limit** | 120 streams/min/IP shared on NAT | Monitor 429 in church Wi‑Fi tests |
| **Story switch** | Client stops audio on slide change | P7 in pilot plan |
| **Hybrid legacy ids** | No YouTube in hybrid — `unavailable` unless migration map | Map top ids before prod hybrid |

---

## 5. Legacy `musicTrackId` usage (read-only, production DB)

Report run 2026-10-28 (aggregate only):

```json
{ "distinctTrackIds": 0, "rows": [] }
```

**Interpretation:** No `CommunityStatus` rows in production Postgres currently store `musicTrackId`. Hybrid activation **does not break existing DB-backed story music today**; future attaches and any JSON-backed statuses still follow catalog rules.

Re-run: `npm run report:story-music:legacy-usage` (requires `DATABASE_URL`).

---

## 6. Hybrid activation — legacy catalog behavior

When `STORY_MUSIC_HYBRID_ENABLED=1` and `STORY_MUSIC_POC_CATALOG_ENABLED=0`:

| Track type | Attach | Playback |
|------------|--------|----------|
| Authorized catalog (`story-music/` or Blob) | Yes | Stream API |
| Legacy id, no migration audio | **No** | **Unavailable** (explicit message) |
| Legacy id + migration map `published` | Yes | Stream API |
| YouTube-only legacy | **No** | **No Piped/YouTube** in hybrid |

Full legacy id list: `data/community-story-music.json` (~50+ ids). **All YouTube-only entries would lose hybrid playback** unless mapped.

---

## 7. Authorized catalog for launch

**Playable today:** **0** (`data/story-music-authorized-catalog.json` empty).

**Planned launch slots (no audio until rights verified):** [STORY_MUSIC_AUTHORIZED_CATALOG_LAUNCH.md](./STORY_MUSIC_AUTHORIZED_CATALOG_LAUNCH.md)

Do not ingest commercial recordings without documented rights + evidence.

---

## 8. QA audio removed from production static path

Synthesized WAVs moved to `test-fixtures/story-music-poc/` (POC flag + test refs only).  
Regenerate: `npm run story-music:poc-audio`

---

## 9. Final activation steps (after approval)

1. Complete rights intake for ≥1 track per target region (GH / NG / US minimum).  
2. Add entries to `data/story-music-authorized-catalog.json` + audio in private Blob or `public/story-music/` (authorized only).  
3. Run legacy usage report; publish `story-music-legacy-migration-map.json` for any in-use ids.  
4. Staging: hybrid on, POC off, pilot plan + Android PASS.  
5. Production: set `STORY_MUSIC_HYBRID_ENABLED=1` + `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`, keep `STORY_MUSIC_POC_CATALOG_ENABLED=0`.  
6. Monitor stream 429/502; rollback per [STORY_MUSIC_ROLLBACK.md](./STORY_MUSIC_ROLLBACK.md).

**Not in this activation:** `STORY_MUSIC_DB_CATALOG=1`, production Phase 2 migration, Marriage Hub flags.
