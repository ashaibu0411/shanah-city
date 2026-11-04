# First three free-library songs — church owner rights review

**Purpose:** One sign-off covering all three launch tracks. **Not approved until boxes are checked and curator attestation is recorded.**

Shanah City will **download a copy** from Wikimedia Commons and **host it in Vercel Blob** for in-app story background audio (stream via `/api/community/story-music/stream`). That is **redistribution/hosting**, not merely linking to YouTube or Commons.

---

## What the owner is deciding (all three tracks)

For **each** recording below, the owner confirms:


| Question           | Owner answer                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Composition**    | Hymn/spiritual is public domain (or otherwise cleared) for our members.                                                                                                                    |
| **Recording**      | This specific performance is marked **Public domain** on Wikimedia Commons (or equivalent documented PD source).                                                                           |
| **Territory**      | We may offer this audio to **all Shanah City members worldwide**, not only U.S. members. (U.S. federal band/Navy PD markings are the basis — owner accepts use for international members.) |
| **Redistribution** | We may **store and re-stream** this exact recording from our **Vercel Blob** store inside the app (not hotlink-only).                                                                      |
| **Use case**       | Optional **background music on member photo stories** only; not sold, not extracted for download outside the app flow.                                                                     |
| **Attribution**    | Display the stated attribution in-app where the catalog requires it.                                                                                                                       |
| **Quality**        | Curator **listen test** — acceptable length and quality for stories.                                                                                                                       |
| **Evidence**       | Curator archives Commons page (+ USAF PD page for Air Force tracks) screenshot/PDF in church records.                                                                                      |


---



## Track 1 — Amazing Grace (USAF Reserve Band)


|                               |                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catalog id (after import)** | `amazing-grace-usaf-reserve-band`                                                                                                                                                                                                  |
| **Discovery id**              | `smd-0eb452b6f960bc56576688b2`                                                                                                                                                                                                     |
| **Commons**                   | [https://commons.wikimedia.org/wiki/File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3](https://commons.wikimedia.org/wiki/File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3) |
| **USAF PD program**           | [https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/](https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/)                                                                                                   |
| **Attribution**               | Performance: United States Air Force Reserve Band (public domain).                                                                                                                                                                 |


- [x] Listen test passed  
- [x] Worldwide + Blob redistribution confirmed  
- [x] Evidence archived  

Detail: [STORY_MUSIC_AMAZING_GRACE_OWNER_REVIEW.md](./STORY_MUSIC_AMAZING_GRACE_OWNER_REVIEW.md)

---



## Track 2 — The God of Abraham Praise (USAF Band)


|                     |                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Catalog id**      | `the-god-of-abraham-praise-usaf-band`                                                                                                                                                                                                      |
| **Discovery id**    | `smd-c48ba54c4945205fa63795e8`                                                                                                                                                                                                             |
| **Commons**         | [https://commons.wikimedia.org/wiki/File:The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3](https://commons.wikimedia.org/wiki/File:The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3) |
| **USAF PD program** | [https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/](https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/)                                                                                                           |
| **Composition**     | Thomas Olivers; tune Leoni (traditional PD)                                                                                                                                                                                                |
| **Attribution**     | Performance: United States Air Force Band (public domain).                                                                                                                                                                                 |


- [x] Listen test passed  
- [x] Worldwide + Blob redistribution confirmed  
- [x] Evidence archived  

---



## Track 3 — Gospel Train (U.S. Navy)


|                  |                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Catalog id**   | `gospel-train-us-navy-edwards`                                                                                       |
| **Discovery id** | `smd-fcf40b8954248b34a7e15f57`                                                                                       |
| **Commons**      | [https://commons.wikimedia.org/wiki/File:Gospel_Train.mp3](https://commons.wikimedia.org/wiki/File:Gospel_Train.mp3) |
| **Composition**  | Traditional gospel spiritual (PD)                                                                                    |
| **Attribution**  | Performance: MU1 William F. Edwards, III (public domain).                                                            |


- [x] Listen test passed  
- [x] Worldwide + Blob redistribution confirmed  
- [x] Evidence archived  

---



## Record your approval (required before import)

The checkboxes above are your internal record. The **import pipeline** reads approval only from **local environment variables** (never committed):

1. Open **`.env.local`** in this repo (create it if needed; it is gitignored).
2. Add **your real name** and **your own attestation text** (do not use a placeholder name). Example shape only — **replace every bracket**:

```env
STORY_MUSIC_CURATOR_NAME="[Your legal name as Shanah City owner/curator]"
STORY_MUSIC_CURATOR_ATTESTATION="[Your date]. I, [same name], confirm Shanah City approval to host and stream worldwide as story background music the three public-domain recordings in STORY_MUSIC_THREE_SONG_OWNER_CHECKLIST.md: Amazing Grace (USAF Reserve Band), The God of Abraham Praise (USAF Band), and Gospel Train (U.S. Navy), via Vercel Blob and the authorized catalog."
STORY_MUSIC_ADMIN_WRITE_ENABLED=1
```

3. Save the file. Confirm:

```bash
npm run story-music:check-import-env
```

You should see **set** for curator name, attestation, and admin write (lengths only — no secrets printed).

4. Optional: add a dated note in church records pointing to this checklist and the three Commons URLs.

**Do not commit `.env.local`.** Do not ask Cursor to invent your name or attestation.

```bash
npm run story-music:check-import-env
npm run story-music:import-free-library -- --dry-run
npm run story-music:import-free-library
npm run story-music:verify-free-library
```

Commit **only** updated `data/story-music-authorized-catalog.json`, `data/story-music-rights-records.json`, and discovery `published` rows — then merge PR #22 and adjust production env per [STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md](./STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md).

**Status:** Checklist boxes are owner-maintained. **Import runs only after** `story-music:check-import-env` shows curator + admin write + a **real** Blob token (62+ chars), then `story-music:import-free-library` succeeds.

## After attestation — technical steps (Cursor / worship tech)

**Blob token** (see [STORY_MUSIC_PRODUCTION_BLOB_AND_IMPORT.md](./STORY_MUSIC_PRODUCTION_BLOB_AND_IMPORT.md)) — add to `.env.local`:

```env
# Prefer dedicated story-music token if configured on Vercel; else production BLOB_READ_WRITE_TOKEN
STORY_MUSIC_BLOB_READ_WRITE_TOKEN=
# or BLOB_READ_WRITE_TOKEN=
```