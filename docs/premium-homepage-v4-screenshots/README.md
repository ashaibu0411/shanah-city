# Premium Homepage V4.1 — capture log

Generated with `node scripts/capture-premium-v41-screenshots.mjs http://localhost:3010` (local dev, commit on branch at capture time).

| File | Viewport | Notes |
|------|----------|--------|
| `church-desktop-1440.png` | 1440×900 | Public `/church-site` |
| `church-mobile-390.png` | 390×844 | Public `/church-site` |
| `app-desktop-light-1280.png` | 1280×900 | App `/` light |
| `app-mobile-light-390-signed-out.png` | 390×844 | Fresh session (no cookies) |
| `app-mobile-dark-390-signed-out.png` | 390×844 | `html.dark` + prefers-color-scheme dark |
| `app-desktop-dark-1280.png` | 1280×900 | Dark desktop |

## Reference comparison (owner mockups)

| Area | Match | Gap to close |
|------|-------|----------------|
| Public hero + strip | Strong | Mobile hero could stack CTAs earlier on 320px |
| Ministries 2×2 photos | Strong | — |
| Events / sermon / give band | Strong | Event titles use live calendar data |
| App light porcelain | Partial | Re-capture after `premium-home-v41.css` contrast fix |
| App dark midnight | Good | Authenticated signed-in pass not captured here |
| Stories / notifications | N/A in static capture | Requires signed-in session |

## Signed-in captures

Not automated (needs church account). Owner or QA: sign in on preview, repeat script against preview base URL, or capture manually at 390/1280.

## Preview

Use the Vercel deployment for PR #163 on `feature/premium-homepage-v4` (see PR checks). Re-run:

```bash
node scripts/capture-premium-v41-screenshots.mjs https://<preview-host>
```