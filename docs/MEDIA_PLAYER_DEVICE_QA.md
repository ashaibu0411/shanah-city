# Shanah Media Player — device QA checklist

Use this on a **physical Android phone** after syncing native changes (`npx cap sync android` + release/debug APK).

## Build & install

```bash
npm run build
npx cap sync android
```

Open `android/` in Android Studio → Run on device, or assemble `release`/`debug` APK and install.

Record: app version (`versionName` in `android/app/build.gradle`), build date, tester name.

---

## Test A — Full-screen video (sermon)

1. Sign in → **Sermons** → open a message with **Watch** (YouTube or hosted MP4).
2. Confirm:
   - [ ] Pure black full-screen (no tab bar, no app header)
   - [ ] Title + date in top bar; chevron minimizes
   - [ ] Landscape video centered (letterboxed, not cropped)
   - [ ] Timeline + elapsed / remaining near bottom
   - [ ] Row: **1x** · **−15** · **Play** · **+15** · **⋮**
3. YouTube only:
   - [ ] No visible YouTube control bar
   - [ ] Seek and ±15s move playback
   - [ ] Speed changes when allowed by YouTube

**Notes:** _______________________________________________

---

## Test B — More options sheet

1. With player open, tap **⋮**.
2. Confirm:
   - [ ] White sheet from bottom, rounded top corners
   - [ ] **Switch to audio** when Listen URL exists (sermon)
   - [ ] **Share**
   - [ ] Tap outside or swipe down dismisses
3. Switch to audio (if available):
   - [ ] Resumes near same position
   - [ ] Background playback + notification (Android)

**Notes:** _______________________________________________

---

## Test C — Picture-in-Picture

### Hosted MP4 (in-app HTML5 player)

1. Play sermon/rehearsal **HTTPS MP4** in full-screen web player.
2. Press **Home** (or tap PiP in header if shown).
3. Confirm:
   - [ ] Floating video continues
   - [ ] Tap PiP returns to app player

### Rehearsal MP4 (native ExoPlayer activity)

1. **Groups → Shanah Worship → Rehearsal → Recordings** → entry with 🎬 → **Watch**.
2. On Android, `.mp4` may open **native** black player (ExoPlayer).
3. Press **Home** → confirm system PiP.

**Notes:** _______________________________________________

---

## Test D — Choir rehearsal library

1. Open rehearsal **Recordings** (choir members only).
2. Audio entry: **Listen in app** → mini player → expand.
3. Video entry: **Watch** + **Listen in app** both work; no public sermon leakage.

**Notes:** _______________________________________________

---

## Test E — Regressions

- [ ] Sermon list / detail still load
- [ ] Devotion TTS still works; stops when sermon audio starts
- [ ] No duplicate audio (only one session)
- [ ] Cast button only on supported hosted media
- [ ] Back / minimize does not crash

---

## Report template

| Area | Pass / Fail | Device | Notes |
|------|-------------|--------|-------|
| A YouTube full-screen | | | |
| A Hosted MP4 | | | |
| B Bottom sheet | | | |
| C PiP | | | |
| D Rehearsal video | | | |
| E Regressions | | | |

Attach screenshots for A, B, and C when possible.
