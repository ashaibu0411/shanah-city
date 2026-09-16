# Community story live — production & native

## Production deploy checklist

After merging schema or live API changes:

1. **Vercel** — Confirm the latest commit is deployed (LiveKit env vars unchanged):
   - `NEXT_PUBLIC_LIVEKIT_URL` (Config) — `wss://…livekit.cloud`
   - `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` (Secret)
2. **Database** — From a machine with production `DATABASE_URL`:
   ```bash
   npm run db:deploy
   ```
   Required for Phase 2 tables: `CommunityLiveJoinRequest`, `CommunityLiveCoHost`, and live comments (`CommunityStatusReply` rows per live).
   If this step is skipped, viewers see comment/join errors and the host never sees join requests.
3. **Smoke test (two signed-in accounts)**  
   - **Host (web):** Community → Go live → confirm **Join requests** panel shows “No pending requests…”.  
   - **Viewer:** Open host’s LIVE story → type a comment → **Send** → comment appears for both.  
   - **Viewer:** **Request to join live** → stays on the story (does not skip to next story).  
   - **Host:** Pending name appears → **Approve** → viewer opens co-host page with camera/mic toggles.  
   - **Host:** **Mute mic** / **Mute video** on connected co-host (remote controls under guest media).  
   - **Host:** **End live** → story ends; join/comment data cleared for that status.

## Android native build (host camera / mic)

Web deploy does **not** update Android manifest permissions. For go-live inside the Capacitor app:

1. Pull latest `main` (includes `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` in `android/app/src/main/AndroidManifest.xml`).
2. Sync and open Android Studio:
   ```bash
   npm run build
   npm run mobile:sync
   npm run mobile:android
   ```
3. In Android Studio: **Build → Generate Signed Bundle / APK** (or run on device).
4. Ship the new build to testers / Play Console.

iOS: same web bundle via `mobile:sync`; ensure camera/mic usage strings in `Info.plist` if you ship live on iOS.

## Troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| Comments fail / “Comments unavailable” | Prod migration not applied |
| Join request fails silently | Same; or viewer not signed in |
| Tap join skips to next story | Fixed in app: live slides no longer use link prev/next zones |
| Host sees empty panel forever | Run `db:deploy`; refresh host page |
| Viewers connect but no video | Host camera blocked; Android needs new native build |

## Host remote mute

Host-only API: `POST /api/community/live/mute` with `{ statusId, guestUserId, source: "microphone" \| "camera", muted: boolean }`.  
UI: **Guest media (host)** on the host live screen when a co-host is connected in LiveKit.

Co-hosts can still use **Mic on/off** and **Video on/off** for themselves (privacy).
