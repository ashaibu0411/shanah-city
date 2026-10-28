# Authorized gospel catalog — launch plan (GH / NG / US)

**Status:** Intake only — **no audio files** until rights are verified.  
**Catalog file:** `data/story-music-authorized-catalog.json` (currently empty).

## Required before each track goes live

1. Complete [STORY_MUSIC_RIGHTS_INTAKE.md](./STORY_MUSIC_RIGHTS_INTAKE.md).  
2. Store evidence (staging/admin pilot or future DB evidence store).  
3. Upload **authorized recording** to private Blob (`story-music://blob/…`) or approved `public/story-music/<id>.wav`.  
4. Add row to authorized catalog with matching `id` (stable forever once stories attach).

## Launch slots (placeholders)

| Priority | Suggested `id` | Region | Genre focus | Recording status |
|----------|----------------|--------|-------------|------------------|
| 1 | `authorized-gh-worship-01` | Ghana (GH) | Worship / gospel | **Awaiting authorized master** |
| 2 | `authorized-ng-gospel-01` | Nigeria (NG) | Gospel | **Awaiting authorized master** |
| 3 | `authorized-us-gospel-01` | United States (US) | Gospel / worship | **Awaiting authorized master** |

## Example catalog row (after rights verified)

```json
{
  "id": "authorized-gh-worship-01",
  "title": "<Licensed title>",
  "artist": "<Artist>",
  "providerTrackId": "authorized-gh-worship-01",
  "audioPath": "story-music://blob/story-music/audio/<file>",
  "country": "GH",
  "language": "en",
  "genres": ["worship", "gospel"],
  "tags": ["ghana", "worship"],
  "startSeconds": 0,
  "rightsRecordId": "<intake record id>"
}
```

## Explicitly excluded

- Commercial studio masters without license  
- Synthesized POC tones (`poc-*`, `test-fixtures/`)  
- YouTube/Piped extraction as catalog source  
