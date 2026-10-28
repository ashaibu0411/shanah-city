# Story music hybrid — security review (prototype)

**Scope:** Hybrid playback when `STORY_MUSIC_HYBRID_ENABLED=1`. Production default remains **off** (legacy stream path unchanged).

## Threat model

| Threat | Surface |
|--------|---------|
| **SSRF** | `/api/community/story-music/stream` fetching attacker-controlled URLs |
| **Path traversal** | Local `audioPath` reading files outside `public/` |
| **Catalog bypass** | Arbitrary `trackId` or tampered JSON paths |
| **Unauthorized remote audio** | Hybrid proxying non-allowlisted hosts |

## Controls implemented

### 1. Catalog-only resolution

- Stream and playback resolve **`trackId`** via `findStoryMusicTrack()` — no free-form URL query params.
- Hybrid mode **does not** call Piped/Invidious/YouTube extractors on the stream route.

### 2. Local path allowlist

- `isAllowedCatalogLocalAudioPath()` — only `story-music-poc/` and `story-music/` under `public/`.
- `resolveCatalogLocalPublicFile()` — `realpath` check keeps resolved file under `public/`.

### 3. Remote URL allowlist (HTTPS only)

- Hybrid remote fetch: **`redirect: "error"`**, host must match `STORY_MUSIC_REMOTE_AUDIO_HOST_ALLOWLIST` plus default `blob.vercel-storage.com`.
- **http://** rejected.

### 4. POC / QA isolation

- Track ids prefixed **`poc-`** hidden unless `STORY_MUSIC_POC_CATALOG_ENABLED=1`.
- Titles prefixed **"POC —"**; catalog JSON includes QA notice.
- Production (hybrid off, POC off): **zero** church POC tracks in search/attach.

### 5. Playback URL indirection

- Authorized playback returns **`/api/community/story-music/stream?trackId=`** rather than raw filesystem paths in JSON (reduces path leakage; stream re-validates).

## Residual risks

| Risk | Severity | Mitigation / next step |
|------|----------|-------------------------|
| **Legacy mode SSRF** (hybrid off) | Medium (pre-existing) | YouTube CDN URLs from Piped/Invidious when hybrid disabled — unchanged; retire with hybrid rollout |
| **Allowlist too permissive** | Low | Review Blob hostnames per environment; avoid `*` wildcards |
| **Licensed provider SSRF** | TBD | When integrating vendor API, only stream URLs returned by vendor SDK — never user-supplied |
| **Large file DoS** | Low | Consider max stream duration/size at CDN; story clips are short |
| **POC flag mis-set in prod** | Medium | Vercel prod checklist: **do not** set `STORY_MUSIC_POC_CATALOG_ENABLED` |

## Automated checks

```bash
npm run test:story-music:security
npm run test:story-music:hybrid
```

Manual: attempt `GET /stream?trackId=../../../etc` — 503/404; hybrid with crafted JSON path outside prefix — 403.
