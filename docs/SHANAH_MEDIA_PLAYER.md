# Shanah Media Player — implementation report

Last updated: 2026-10-14

## Summary

Subsplash-style **full-screen black player** (web), **YouTube IFrame API** custom controls, **white bottom sheet**, **Android PiP** (WebView + native activity), **Media3** background audio, optional **ExoPlayer fullscreen** for choir rehearsal MP4.

## Components

| File | Role |
|------|------|
| `ShanahMediaPlayerProvider.tsx` | State, HTML5 video, YouTube controller, native audio/video handoff |
| `ShanahMediaFullPlayer.tsx` | Immersive UI (portal) |
| `ShanahYouTubeIframePlayer.tsx` | YouTube IFrame API, `controls: 0` |
| `ShanahMediaMoreOptionsSheet.tsx` | Switch to audio, Share, secondary actions |
| `shanah-media-full-player.css` | Layout, timeline, sheet animation |
| `WorshipAudioPlayer.tsx` | Rehearsal **Watch** / **Listen in app** |
| `worshipRehearsalToShanahMediaItem()` | Builds items with `hostedVideoUrl`, `preferNativeHostedVideo` |

## Media sources

| Source | Full-screen UI | Custom seek | Switch to audio | PiP | Cast |
|--------|----------------|-------------|-----------------|-----|------|
| YouTube sermon | Web + YT API | Yes (API) | If Listen URL | No | No |
| Hosted HTTPS MP4 (sermon) | Web `<video>` | Yes | If companion URL | Yes (WebView / Home) | Hosted |
| Rehearsal video `.mp4` (Android) | Native ExoPlayer activity | Yes | Same file as Listen | Yes (activity) | N/A |
| Rehearsal audio / webm video | Web or audio native | Yes | N/A | Web video only | If hosted |

We **never** extract audio from YouTube.

## Android native

- `ShanahNativeMediaPlugin` + `ShanahMediaPlaybackService` — background audio
- `ShanahHostedVideoPlugin` + `HostedSermonVideoActivity` — rehearsal MP4 when `preferNativeHostedVideo: true`
- `MainActivity` — PiP on Home when hosted video playing in WebView (`setVideoPictureInPictureEligible`)
- Manifest: `supportsPictureInPicture` on MainActivity and HostedSermonVideoActivity

## Device QA

See **[MEDIA_PLAYER_DEVICE_QA.md](./MEDIA_PLAYER_DEVICE_QA.md)**.

## Rehearsal video wiring

Library entries with `mediaType: "video"` show **Watch** and **Listen in app**. HTTPS `.mp4` / `.mov` sets `preferNativeHostedVideo` on Android for ExoPlayer.
