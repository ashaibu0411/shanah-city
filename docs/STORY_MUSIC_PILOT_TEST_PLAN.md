# Licensed story music — pilot test plan

**Environments:** Local or staging only.  
**Flags:** `STORY_MUSIC_HYBRID_ENABLED=1`, `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`, `STORY_MUSIC_POC_CATALOG_ENABLED=0` (real pilot), `STORY_MUSIC_ADMIN_WRITE_ENABLED=1` (admin only).

## Platforms

- Desktop: Chrome, Edge, Safari (latest)  
- Android: Capacitor APK / WebView  
- Optional: iOS smoke if church ships iOS

## Cases

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| P1 | **Preview** in compose picker | Same audio as story playback; stop works |
| P2 | **Attach** authorized track | Post succeeds; `musicTrackId` stored |
| P3 | **Reject** legacy YouTube-only id | 400 / UI error; no attach |
| P4 | **Story playback** sound on | Audio plays after slide load |
| P5 | **Tap to play / mute** | User toggle controls audio; no autoplay policy loop |
| P6 | **Unavailable** track on old story | Graceful message; retry; no crash |
| P7 | **Story transition** | Audio stops or continues per same `trackId` rules |
| P8 | **Revoked** catalog track | New views unavailable; story row intact |
| P9 | **Migration map** legacy id | Same id plays authorized file |
| P10 | **Admin intake** | Draft → verify → publish; audit log lines |
| P11 | **Security** | Stream 403 for non-catalog path / host |
| P12 | **WebView** | P1–P7 on Android APK |

## Regression (flags off)

| ID | Scenario | Pass criteria |
|----|----------|---------------|
| R1 | Production flag defaults | Legacy behavior unchanged |
| R2 | Existing stories | Still load; music fields present |

## Automation

```bash
npm run test:story-music:hybrid
npm run test:story-music:security
node scripts/story-music-legacy-usage-report.mjs   # requires DATABASE_URL
```

## Sign-off

- [ ] Worship / media lead  
- [ ] Admin operator  
- [ ] Engineering  
