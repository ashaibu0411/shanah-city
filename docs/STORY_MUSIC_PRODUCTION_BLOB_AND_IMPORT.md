# Story Music — production Vercel Blob and import (no staging)

Use this to connect the **shanah-city** production project Blob store for the three-song free-library import. **Never commit tokens or curator attestation.**

---

## 1. Link the repo to the correct Vercel project

From the repo root (production app is **shanah-city**, not an ad-hoc CLI project):

```bash
npx vercel login
npx vercel link
```

Choose the existing **shanah-city** team/project when prompted. Confirm `.vercel/project.json` points at that project (file is gitignored).

**Warning:** Running `vercel env run` without linking can create a **wrong** throwaway project. Always `vercel link` first.

---

## 2. Where Blob credentials live

Story music uses the same pattern as other app Blob uploads:

| Variable | Purpose |
|----------|---------|
| `STORY_MUSIC_BLOB_READ_WRITE_TOKEN` | **Preferred** — dedicated story-music store token if configured |
| `BLOB_READ_WRITE_TOKEN` | Fallback read-write token for the linked Blob store |

Optional: `STORY_MUSIC_BLOB_STORE_ID` if your project sets it.

**In Vercel Dashboard (recommended for inspection):**

1. Open project **shanah-city** → **Storage** → your Blob store.  
2. **Connect to project** if not already connected (Production environment).  
3. Open the store → **Tokens** → create or view a **Read-Write** token.  
4. In **Settings → Environment Variables**, confirm `BLOB_READ_WRITE_TOKEN` (and `STORY_MUSIC_BLOB_READ_WRITE_TOKEN` if used) exist for **Production** only.

**Pull to your machine (does not print token in terminal if you avoid `cat`):**

```bash
npx vercel env pull .env.production.local --environment=production
```

Add `.env.production.local` to your local ignore habits (repo already ignores `.env*`).

Verify without exposing values:

```bash
npm run story-music:check-import-env
```

Expect **set (62+ chars)** for a real `vercel_blob_rw_…` token, not a placeholder.

---

## 3. Curator variables (local only for import script)

These are **not** required on Vercel for members to play music unless you automate imports in CI (you should not). Set in `.env.local` or prefix the command:

| Variable | Purpose |
|----------|---------|
| `STORY_MUSIC_CURATOR_NAME` | Named curator |
| `STORY_MUSIC_CURATOR_ATTESTATION` | Text confirming [owner checklist](./STORY_MUSIC_THREE_SONG_OWNER_CHECKLIST.md) |
| `STORY_MUSIC_ADMIN_WRITE_ENABLED` | Must be `1` to write catalog JSON |

---

## 4. Run import (production Blob + repo catalog JSON)

```bash
npm run story-music:import-free-library -- --dry-run
npm run story-music:import-free-library
```

This will:

1. Download each Commons MP3  
2. Upload to `story-music/audio/free-library/<catalogTrackId>.mp3`  
3. Append rows to `data/story-music-rights-records.json` and `data/story-music-authorized-catalog.json`  
4. Mark discovery candidates `published`

Then verify Blob + catalog locally:

```bash
npm run story-music:verify-free-library
```

---

## 5. Alternative: inject production env for one command

After `vercel link`, some teams use:

```bash
npx vercel env pull .env.production.local --environment=production
# merge curator vars into .env.local, then:
npm run story-music:import-free-library
```

If your CLI supports running a local script with remote env, use **only** on a linked **shanah-city** project. Do not deploy stray Node projects.

Pilot ingest reference (QA WAV only): `docs/STORY_MUSIC_PRODUCTION_PILOT.md` — same token family, different path prefix.

---

## 6. After import — production deploy

1. **Commit and push** catalog + rights JSON on branch `feature/free-worship-story-picker`.  
2. **Merge PR #22** and deploy **shanah-city** production.  
3. Set member-wide flags ([STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md](./STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md)):  
   - Turn **off** `STORY_MUSIC_PRODUCTION_PILOT_ENABLED`  
   - Turn **on** `STORY_MUSIC_HYBRID_ENABLED` + `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED` + `STORY_MUSIC_FREE_LIBRARY_ENABLED`  
   - Keep `STORY_MUSIC_POC_CATALOG_ENABLED` off  
4. Redeploy production.  
5. On Samsung: Community → photo story → **Free Worship Music** → search each title → preview → attach → publish → replay story.

---

## 7. Rollback

Unset hybrid/free-library flags and redeploy; catalog JSON can be reverted in git. Blob objects can remain orphaned without being served.
