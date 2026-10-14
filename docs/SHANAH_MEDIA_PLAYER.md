# Shanah Media Player — implementation report

Last updated: 2026-10-14

## 1. Existing media architecture

- **Stack:** Next.js 15 (App Router), React client providers, Firebase backend, Vercel web, **Capacitor 8** Android WebView.
- **Sermons:** YouTube embed for video; authorized audio via `/api/sermons/playback` (no YouTube audio extraction).
- **Devotions:** Uploaded file audio and/or TTS (Web Speech / native TTS) with keep-alive via `BackgroundPlaybackProvider` and `native-background-playback.ts`.
- **Worship / choir:** Practice stems and rehearsal tracks via Firebase-backed URLs; uploads through existing worship planner and rehearsal APIs.
- **Prior players:** `SermonPlayerProvider` (dedicated `<audio>`), `DevotionPlayerProvider` (TTS + optional `<audio>`), inline `WorshipAudioPlayer` per track.

## 2. Android wrapper

- **Capacitor** `MainActivity` + WebView bridge (`native-webview-bridge.ts`, `setBackgroundAudioActive`, silence keep-alive).
- **Not yet:** AndroidX Media3 / ExoPlayer foreground `MediaSessionService`, system notification player, or lock-screen MediaSession at the native layer.

## 3. Libraries reused

- `backgroundCapableAudioEventHandlers` / `BackgroundPlaybackProvider`
- `/api/sermons/playback`
- `worship-audio-shared` URL resolution
- Browser **Media Session API** in the global player

## 4. Libraries added

- None (no new npm packages). New app modules only.

## 5. Global player components

| File | Role |
|------|------|
| `src/lib/shanah-media-types.ts` | `ShanahMediaItem`, speeds |
| `src/lib/shanah-media-progress.ts` | Throttled localStorage resume |
| `src/lib/shanah-media-helpers.ts` | Sermon/worship item builders, cross-player events |
| `src/components/media/ShanahMediaPlayerProvider.tsx` | Single hidden `<audio>`, queue, seek, rate, errors |
| `src/components/media/ShanahMediaMiniPlayer.tsx` | App-wide mini bar above mobile nav |
| `src/components/media/ShanahMediaFullPlayer.tsx` | Full-screen mobile player (portal) |

Mounted in `AppShell.tsx` inside `ShanahMediaPlayerProvider` (wraps devotion + sermon providers).

## 6. Native Android service

- **Phase 2 (in repo):** `ShanahMediaPlaybackService` (Media3 ExoPlayer + `MediaSessionService`), `ShanahNativeMediaPlugin` Capacitor plugin, JS bridge in `src/lib/shanah-native-media.ts`.
- On Android APK, `ShanahMediaPlayerProvider` prefers native playback when the plugin is available; web `<audio>` remains for browsers.
- **Must verify on device:** notification controls, lock screen, Bluetooth, audio focus, and long sessions.

## 7. Android manifest changes

- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- `ShanahMediaPlaybackService` with `foregroundServiceType="mediaPlayback"`
- Gradle: `androidx.media3` exoplayer, session, ui (see `android/variables.gradle`)

## 8. Sermon audio integration

- `SermonPlayerProvider` delegates to `useShanahMedia().play()` after fetching authorized audio URL.
- `SermonMiniPlayer` is a no-op; UI is `ShanahMediaMiniPlayer` / full player.
- `SermonMediaPanel` unchanged API (`useSermonPlayer`).

## 9. Choir rehearsal integration

- Rehearsal Room (`/groups/{groupId}/rehearsal`): `WorshipAudioPlayer` with `globalPlayer` on now-playing, audio tab, and practice sheet stems.
- Worship planner / member recording previews still use **inline** `<audio>` where `globalPlayer` is omitted.

## 10. Devotional audio integration

- **Uploaded devotion audio** routes through Shanah Media Player.
- **TTS listen** remains in `DevotionPlayerProvider` with `DevotionMiniPlayer`.
- `SHANAH_MEDIA_START_EVENT` stops TTS when global file audio starts.

## 11. Playback state synchronization

- One authoritative `<audio>` in `ShanahMediaPlayerProvider`.
- Media Session handlers wired to pause/resume/seek/stop.
- Native notification / lock-screen sync **pending** Media3.

## 12. Firebase changes

- None. Existing storage rules and APIs unchanged.

## 13. Media security

- Sermon and worship URLs still obtained through existing authenticated APIs and signed/authorized URLs.
- No public exposure of private choir paths for background playback.

## 14. Android device test results

- **Not verified** in this session (build/device not run here). Do not treat Android background or lock-screen controls as complete until tested on hardware.

## 15. Web browser test results

- **Not run** in CI this session. Recommended: play sermon audio, navigate routes, expand mini player, rehearsal track, resume position.

## 16. Known limitations

- No native ExoPlayer / FGS notification player.
- WebView background audio may pause on some OEMs or after force-stop.
- Worship Academy / training pages not wired to global player unless they adopt `WorshipAudioPlayer` + `globalPlayer`.
- Queue UI is basic; no “play next” from list views yet.
- YouTube watch mode unchanged; no background listen without separate audio asset.

## 17. Content requiring separately hosted audio

- Any sermon without an entry in the sermon playback API (YouTube-only messages).

## 18. Remaining steps before APK release

1. Build APK (`npm run mobile:sync`, Android Studio) and run full **§28 test matrix** on a physical Android device.
3. Wire remaining inline `WorshipAudioPlayer` sites (planner, academy) if desired.
4. `npm run build` + Vercel deploy smoke test.
