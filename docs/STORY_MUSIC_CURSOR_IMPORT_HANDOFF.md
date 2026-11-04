# Cursor handoff — Free Worship Music import

**State:** PR #21 is merged. PR #22 updates the member story picker and allows a curator-approved music candidate to be downloaded and uploaded directly to Vercel Blob. No third-party songs are currently published for members.

## Steps in Cursor

1. `git fetch origin && git switch feature/free-worship-story-picker && git pull --ff-only`.
2. Read `docs/STORY_MUSIC_FIRST_LAUNCH_RIGHTS.md` and `docs/STORY_MUSIC_PILOT_THREE_SONG_ELIGIBILITY.md`.
3. Start with documented U.S. government recording candidates such as **Amazing Grace — USAF Reserve Band** and **The God of Abraham Praise — USAF Band**. Other historic tracks may have unresolved rights even where the composition is public domain. Inspect original Commons pages, audio quality, source provenance, arrangement rights, and territories before approval.
4. After a real church curator authorizes a particular recording for the intended app use, update that candidate in `data/story-music-discovery-candidates.json`: set `reviewStatus: "approved"`, `rightsEvidenceRef`, `recordingRightsNote`, `compositionRightsNote`, `territory`, `streamingPermitted: true`, `storagePermitted: true`, and the correct attribution/license fields. Do **not** manufacture approval or claim worldwide rights without evidence.
5. Preview intake: `node scripts/story-music-import-free-library.mjs --dry-run` (requires rights fields on candidate; does not publish).
6. With `STORY_MUSIC_CURATOR_NAME`, `STORY_MUSIC_CURATOR_ATTESTATION`, `STORY_MUSIC_BLOB_READ_WRITE_TOKEN`, and `STORY_MUSIC_ADMIN_WRITE_ENABLED=1`, run `node scripts/story-music-import-free-library.mjs`. This downloads, uploads to `story-music/audio/free-library/…`, and publishes to `data/story-music-authorized-catalog.json`.
7. Or step manually: `node scripts/story-music-ingest-approved.mjs --candidate=<id> --upload-blob` then `node scripts/story-music-complete-intake-publish.mjs --intake=… --candidate=<id>`.
8. Once published, test search → preview → attach on a photo story. Keep member-wide production flags off until verified playable.

## Sources and restrictions

- Wikimedia Commons permits reuse subject to each file's actual rights and attribution; hosting a vetted copy is preferable to hotlinking.
- A public-domain hymn composition alone does not clear an unrelated recording or modern arrangement.
- Hold conflicting, unknown, or archive-performer-rights recordings. No YouTube or Spotify downloads.
- Do not enable the public library merely because candidates exist in the discovery JSON.

## Known blockers here

This GitHub-connected session cannot access the church's private Vercel Blob token, download music bytes to its container, or assert curator approval for it. Cursor, using your authorized deployment credentials, remains the tool for completing the audio ingestion and runtime validation.

Check local readiness (no secret values printed):

```bash
node scripts/story-music-check-import-env.mjs
npm run story-music:import-free-library -- --dry-run
```

After import succeeds, follow [STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md](./STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md) for production flags. **Do not report the library complete with zero member-visible free-library tracks.**
