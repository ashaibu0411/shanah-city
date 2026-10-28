# Story music hybrid — recommended rollout plan

**Prerequisite:** Pastoral/leadership approval of licensing budget and vendor contract.

## Phase 0 — POC (current branch, local only)

- [x] Provider abstraction + feature flag  
- [x] Church-authorized POC catalog + generated test audio  
- [x] Preview-before-attach  
- [x] Hybrid attach gate (no legacy YouTube-only attach)  
- [x] Legacy id resolution for existing stories  
- [ ] Leadership picks vendor shortlist (see [STORY_MUSIC_PROVIDER_COMPARISON.md](./STORY_MUSIC_PROVIDER_COMPARISON.md))

**Exit:** `npm run test:story-music:hybrid` green; manual desktop + Android WebView smoke with `.env.local` flags.

## Phase 1 — Legal & vendor (no production flag)

1. Send UGC story questionnaire to Epidemic Sound (+ optional Artlist/Soundstripe).  
2. Execute agreement covering **in-app story background audio**.  
3. Implement `licensed-catalog-provider.ts` (replace stub) with sandbox keys.  
4. Curate **Christian/gospel collections** + import regional **church_authorized** tracks with signed rights.

**Exit:** Staging environment with hybrid on; 20+ real playable tracks across 3+ regions.

## Phase 2 — Legacy mapping (still no default prod flag)

1. Analytics: top **legacy `musicTrackId`** on active stories.  
2. For each, add **mapping row** (same `id`, new `audioPath` or licensed `providerTrackId`) — **do not rename ids**.  
3. Optional DB columns: `musicProvider`, `musicProviderTrackId` for forward compatibility.  
4. Automated playback health check in CI.

**Exit:** ≥90% of recent story plays resolve `mode: audio` on staging.

## Phase 3 — Controlled production enable

1. Deploy **`fix/story-music-hybrid`** (or merge to `main`) **without** Marriage Hub branches.  
2. Set on Vercel **production**:  
   - `STORY_MUSIC_HYBRID_ENABLED=1`  
   - `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`  
   - Licensed provider secrets  
   - `MARRIAGE_*` flags unchanged  
3. Monitor: playback 503 rate, attach errors, member support tickets.  
4. Keep **legacy YouTube path disabled** in hybrid (no stream extraction).

**Rollback:** Unset hybrid flags → instant revert to `legacy-playback-bridge` behavior.

## Phase 4 — Catalog growth

- Expand **church_authorized** with regional gospel (GH, NG, ZA, KE, Caribbean, LATAM, KR, EU).  
- Expand licensed collections; add language/country filters from provider metadata.  
- Editorial review queue for new church-uploaded tracks.

---

## Deployment isolation checklist

| Check | Action |
|-------|--------|
| Branch | `fix/story-music-hybrid` from `main` only |
| Marriage Hub | No merge from `feature/marriage-self-paced-stage2` |
| Vercel | Production deploy only after explicit approval |
| Data | No bulk replace of `community-story-music.json` without mapping plan |
| Secrets | Licensed API keys in Vercel env, not repo |

---

## Local developer setup

```bash
git checkout fix/story-music-hybrid
node scripts/generate-story-music-poc-audio.mjs
```

`.env.local`:

```
STORY_MUSIC_HYBRID_ENABLED=1
NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1
```

```bash
npm run dev
npm run test:story-music:hybrid
```

**Android WebView:** run Capacitor against local or staging URL with same flags; verify preview + story playback with one tap to unmute.
