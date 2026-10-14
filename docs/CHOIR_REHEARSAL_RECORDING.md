# Shanah Worship — Rehearsal recording system

## Phase 1 — Short recording diagnosis

| Finding | Detail |
|--------|--------|
| **Primary limit** | `saveWorshipAudioFile` in `src/lib/worship-audio-server.ts` rejects files over **25 MB** (`MAX_BYTES`). Part stems and planner rehearsal uploads use this path. |
| **Memory** | Browser `MediaRecorder` collects **1s timeslices in RAM** (`chunksRef`) until stop, then builds one `Blob`. Long sessions risk OOM or tab kill before upload. |
| **Access** | Full service rehearsal uploads in the worship planner require **`canAccessWorshipPlanner`**, not all choir members. |
| **No duration timer** | No hardcoded stop at N minutes in choir part recorder components. |
| **Android** | **Capacitor WebView**; no native long-form rehearsal recorder yet. Background mic / screen lock not guaranteed. |
| **Large uploads** | Server multipart routes buffer full body; **direct Vercel Blob client upload** (512 MB cap for library) avoids serverless body limits. |

## Android wrapper

Capacitor (`android/` app module). Native playback via `ShanahNativeMediaPlugin`.

## Recording engine (current)

- **Android APK:** `ShanahNativeRecorder` + `ShanahAudioRecordingService` — `MediaRecorder` writing **AAC/M4A** to `files/rehearsal-recordings/{id}.m4a` with **foreground service type `microphone`**.
- **Web / fallback:** `MediaRecorder` via `createAudioMediaRecorder` (`src/lib/worship-audio-shared.ts`).
- **Storage:** Vercel Blob at `groups/group-choir/rehearsal-recordings/{recordingId}/audio.{ext}`.
- **Formats:** Browser-dependent (often WebM/Opus on Android Chrome; AAC/M4A where supported).

## Library route

- UI: Rehearsal Room → **Library** tab.
- Deep link: `/groups/group-choir/rehearsal/recordings` → redirects to `?tab=library`.

## Data model

- Prisma: `ChoirRehearsalLibraryRecording` (JSON fallback: `data/choir-rehearsal-recordings.json`).
- Legacy **`WorshipRehearsalRecording`** and song **practice stems** unchanged.

## API

- `GET/POST/PATCH/DELETE` `/api/groups/choir/rehearsal-recordings`
- `POST` `/api/groups/choir/rehearsal-recordings/upload` — Blob token (choir member auth)

## Playback

Shanah Media Player via `WorshipAudioPlayer` + `globalPlayer` (`kind: worship-rehearsal`).

## Delete / retention

- Soft delete (`deletedAt`); storage objects not auto-purged.
- Members may delete own non-official recordings; leaders/site admins may delete official/shared items.

## Tested durations

**Not device-verified for 2-hour sessions in this build.** Validate on a physical Android APK before claiming long-form reliability.

## Remaining limitations

1. Web fallback still holds chunks in memory until stop.
2. Native background/lock behavior **requires on-device validation** (FGS mic is implemented but not long-form certified here).
3. **Pending uploads:** IndexedDB metadata + optional blob; native `.m4a` path; **Retry upload** on Record/Library tabs. Orphan device files via **Prepare for upload**.
4. **Audio focus:** Native service pauses on call/other-app focus; user taps Resume.
4. Song “link existing library recording” UI not yet on song detail sheet.
5. Rehearsal event linking uses optional `serviceDate` / `serviceTime` on save only.

## Files (this feature)

**New:** `src/lib/choir-rehearsal-recording-*.ts`, `src/lib/stores/choir-rehearsal-recording-*.ts`, `src/app/api/groups/choir/rehearsal-recordings/**`, `src/components/groups/choir/rehearsal/RehearsalLongFormRecorder.tsx`, `RehearsalRecordingLibrary.tsx`, `docs/CHOIR_REHEARSAL_RECORDING.md`, Prisma migration.

**Modified:** `RehearsalSegmentTabs.tsx`, `ChoirRehearsalRoomPage.tsx`, `prisma/schema.prisma`.
