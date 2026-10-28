# Story Music — final device acceptance (operator)

Run on **staging** (`https://shanah-city-staging.vercel.app`) with hybrid + POC flags until production authorized catalog exists.

## Sign-in

Use a designated QA account (session cookie in `data/staging-qa-session-cookies.json`, gitignored).

## Desktop browser

1. Community → Share Your Story → **Add song**.
2. Search, **Preview** (pause/resume), **select** track, confirm selected card shows title/artist.
3. Publish text or photo story.
4. Open story viewer → tap sound if muted → confirm audio.
5. Swipe to another story with different music → only one track audible.
6. Close viewer → audio stops.
7. Reopen same story → playback works.

## Mobile browser (physical phone)

Repeat steps 1–7 on Safari (iOS) or Chrome (Android). Desktop emulation does **not** count.

## Android Capacitor

```bash
set CAPACITOR_SERVER_URL=https://shanah-city-staging.vercel.app
npx cap sync android
```

Open Android Studio, run on **physical device** or emulator; record which. Repeat steps 1–7.

## Automated API smoke

```bash
STORY_MUSIC_QA_SESSION_COOKIE=<session> node scripts/story-music-staging-acceptance.mjs
```

## Production hybrid GO

Only after: ≥1 row in `data/story-music-authorized-catalog.json` with verified rights, device sign-off above, and explicit prod `STORY_MUSIC_*` env (POC off).
