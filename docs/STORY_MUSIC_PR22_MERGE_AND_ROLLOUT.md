# PR #22 — merge and production rollout (three free-library songs)

## Merge

1. Import committed on `feature/free-worship-story-picker`: catalog + rights + discovery `published`.
2. CI green; `npm run test:story-music:catalog-integrity` passes with **3** free-library tracks.
3. Merge [PR #22](https://github.com/ashaibu0411/shanah-city/pull/22) to `main` → production deploy **shanah-city**.

## Phase A — deploy catalog (pilot still on)

Keep current production pilot flags until **you** validate playback. Members still see pilot gating until Phase B.

## Phase B — validate before all members (required)

On **production** (Samsung WebView or browser, normal member account if pilot off, or admin during pilot):

1. Community → create **photo story**.
2. **Free Worship Music** → search **Amazing Grace**, **God of Abraham Praise**, **Gospel Train**.
3. **Preview** each → **attach** one → **publish** → **replay** story with sound on.

Also confirm **Record Your Voice** and an **existing YouTube** story still behave as before.

## Phase C — member-wide flags

Only after Phase B passes, set on **shanah-city** production:

| Enable | Disable |
|--------|---------|
| `STORY_MUSIC_HYBRID_ENABLED=1` | `STORY_MUSIC_PRODUCTION_PILOT_ENABLED` |
| `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1` | `STORY_MUSIC_POC_CATALOG_ENABLED` |
| `STORY_MUSIC_FREE_LIBRARY_ENABLED=1` | `STORY_MUSIC_STAGING_QA_LIBRARY` |

Redeploy. Confirm `/api/community/story-music` returns `freeLibraryLive: true` for a normal signed-in member and **3** attachable tracks.

## Rollback

Unset hybrid/free-library flags; revert catalog commit if needed. Blob objects can remain unused.
