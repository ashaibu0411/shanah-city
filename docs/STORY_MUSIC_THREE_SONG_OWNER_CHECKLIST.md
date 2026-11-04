# First three free-library songs — church owner rights review

**Purpose:** One sign-off covering all three launch tracks. **Not approved until boxes are checked and curator attestation is recorded.**

Shanah City will **download a copy** from Wikimedia Commons and **host it in Vercel Blob** for in-app story background audio (stream via `/api/community/story-music/stream`). That is **redistribution/hosting**, not merely linking to YouTube or Commons.

---

## What the owner is deciding (all three tracks)

For **each** recording below, the owner confirms:

| Question | Owner answer |
|----------|----------------|
| **Composition** | Hymn/spiritual is public domain (or otherwise cleared) for our members. |
| **Recording** | This specific performance is marked **Public domain** on Wikimedia Commons (or equivalent documented PD source). |
| **Territory** | We may offer this audio to **all Shanah City members worldwide**, not only U.S. members. (U.S. federal band/Navy PD markings are the basis — owner accepts use for international members.) |
| **Redistribution** | We may **store and re-stream** this exact recording from our **Vercel Blob** store inside the app (not hotlink-only). |
| **Use case** | Optional **background music on member photo stories** only; not sold, not extracted for download outside the app flow. |
| **Attribution** | Display the stated attribution in-app where the catalog requires it. |
| **Quality** | Curator **listen test** — acceptable length and quality for stories. |
| **Evidence** | Curator archives Commons page (+ USAF PD page for Air Force tracks) screenshot/PDF in church records. |

---

## Track 1 — Amazing Grace (USAF Reserve Band)

| | |
|---|---|
| **Catalog id (after import)** | `amazing-grace-usaf-reserve-band` |
| **Discovery id** | `smd-0eb452b6f960bc56576688b2` |
| **Commons** | https://commons.wikimedia.org/wiki/File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3 |
| **USAF PD program** | https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/ |
| **Attribution** | Performance: United States Air Force Reserve Band (public domain). |

- [ ] Listen test passed  
- [ ] Worldwide + Blob redistribution confirmed  
- [ ] Evidence archived  

Detail: [STORY_MUSIC_AMAZING_GRACE_OWNER_REVIEW.md](./STORY_MUSIC_AMAZING_GRACE_OWNER_REVIEW.md)

---

## Track 2 — The God of Abraham Praise (USAF Band)

| | |
|---|---|
| **Catalog id** | `the-god-of-abraham-praise-usaf-band` |
| **Discovery id** | `smd-c48ba54c4945205fa63795e8` |
| **Commons** | https://commons.wikimedia.org/wiki/File:The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3 |
| **USAF PD program** | https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/ |
| **Composition** | Thomas Olivers; tune Leoni (traditional PD) |
| **Attribution** | Performance: United States Air Force Band (public domain). |

- [ ] Listen test passed  
- [ ] Worldwide + Blob redistribution confirmed  
- [ ] Evidence archived  

---

## Track 3 — Gospel Train (U.S. Navy)

| | |
|---|---|
| **Catalog id** | `gospel-train-us-navy-edwards` |
| **Discovery id** | `smd-fcf40b8954248b34a7e15f57` |
| **Commons** | https://commons.wikimedia.org/wiki/File:Gospel_Train.mp3 |
| **Composition** | Traditional gospel spiritual (PD) |
| **Attribution** | Performance: MU1 William F. Edwards, III (public domain). |

- [ ] Listen test passed  
- [ ] Worldwide + Blob redistribution confirmed  
- [ ] Evidence archived  

---

## After owner approval — technical steps (Cursor / worship tech)

**Do not commit secrets.** Set locally only:

```bash
STORY_MUSIC_CURATOR_NAME="Name of authorized curator"
STORY_MUSIC_CURATOR_ATTESTATION="I confirm church owner approval for the three PD recordings listed in STORY_MUSIC_THREE_SONG_OWNER_CHECKLIST.md for worldwide in-app story background use and Vercel Blob hosting."
STORY_MUSIC_ADMIN_WRITE_ENABLED=1
# STORY_MUSIC_BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN from production Vercel (see STORY_MUSIC_PRODUCTION_BLOB_AND_IMPORT.md)
```

```bash
npm run story-music:check-import-env
npm run story-music:import-free-library -- --dry-run
npm run story-music:import-free-library
npm run story-music:verify-free-library
```

Commit **only** updated `data/story-music-authorized-catalog.json`, `data/story-music-rights-records.json`, and discovery `published` rows — then merge PR #22 and adjust production env per [STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md](./STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md).

**Status today:** Owner checklist incomplete; import has **not** run with valid credentials in this environment.
