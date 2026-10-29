# Three-song staging pilot — eligibility (not Shanah City approval)

Review date: 2026-10-29. Manifest: `data/story-music-pilot-three-song.json`.

**0 tracks** are finally approved or ingested until a named curator sets attestation and runs ingest.

## Summary

| # | Title | Eligibility | Territory | Ingest format |
|---|--------|-------------|-----------|---------------|
| 1 | Amazing Grace (USAF Reserve Band) | **Pass — pending curator sign-off** | Worldwide (PD hymn + USAF PD program; curator confirms non-U.S. members) | MP3 as-is |
| 2 | My Lord Is Writin' (Cochran Field Singers) | **Pass — pending curator sign-off** | Worldwide (LoC folklife PD transfer; archive LoC + Commons) | OGG → MP3 transcode |
| 3 | Rock of Ages (Edison Mixed Quartet, 1913) | **Pass — pending curator sign-off** | Worldwide (PD recording + PD hymn) | OGG → MP3 transcode |

All three support **reusable in-app story background** use under PD terms (no NC/ND/SA). No embedded license conflicts in OGG headers for tracks 2–3.

## Track 1 — Amazing Grace

- **Source:** [Commons MP3](https://commons.wikimedia.org/wiki/File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3)
- **Recording:** United States Air Force Reserve Band (Commons **Public domain**); [USAF PD music index](https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/)
- **Composition:** Newton / Walker hymn — public domain
- **Attribution:** Performance: United States Air Force Reserve Band (public domain)
- **Quality:** ~3:47 MP3; curator listen test still required

## Track 2 — My Lord Is Writin'

- **Source:** [Commons OGG](https://commons.wikimedia.org/wiki/File:Cochran_Field_Singers_-_My_Lord_Is_Writin'.ogg)
- **Recording:** Cochran Field Singers; LoC American Folklife Center **afcftv.7047a1** (Commons **Public domain**)
- **Composition:** Traditional spiritual — PD
- **Embedded tags:** No conflicting CC URLs in file header
- **Attribution:** Cochran Field Singers; Library of Congress American Folklife Center (via Wikimedia Commons)
- **Quality:** ~2:17 historic field audio; transcode to MP3 for Samsung/WebView

## Track 3 — Rock of Ages (1913)

- **Source:** [Commons OGG](https://commons.wikimedia.org/wiki/File:EdisonMixedQuartet_RockOfAges1913.ogg)
- **Recording:** Edison Mixed Quartet, 1913 cylinder transfer — **Public domain**
- **Composition:** Toplady / Hastings hymn — PD
- **Provenance:** File description documents Edison cylinder origin; passes pilot bar vs. undocumented recordings
- **Attribution:** Edison Mixed Quartet (1913 recording, public domain)
- **Quality:** ~4:12; transcode to MP3 recommended

## Staging ingest (after curator attestation)

```bash
STORY_MUSIC_ADMIN_WRITE_ENABLED=1
STORY_MUSIC_BLOB_READ_WRITE_TOKEN=...
STORY_MUSIC_PILOT_CURATOR_NAME="..."
STORY_MUSIC_PILOT_CURATOR_ATTESTATION="I confirm rights review for the three-song staging pilot."
node scripts/story-music-pilot-staging-ingest.mjs
```

Enable on **staging only:** `STORY_MUSIC_HYBRID_ENABLED=1`, `STORY_MUSIC_FREE_LIBRARY_ENABLED=1`, deploy branch with updated catalog JSON + Blob objects.

Acceptance: `STORY_MUSIC_QA_SESSION_COOKIE=... node scripts/story-music-staging-acceptance.mjs`

**Production:** keep free library flags off until staging playback + device tests pass.
