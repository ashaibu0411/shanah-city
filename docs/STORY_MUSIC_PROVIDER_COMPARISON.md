# Story music — provider comparison (UGC background audio)

**Use case:** Members attach background music to **ephemeral community stories** (web app + Android APK/WebView). Music must be **previewable**, **streamable in-app**, and **legally cleared** for this product surface — not assumed from personal Spotify/Apple/CCLI subscriptions.

**Last reviewed:** 2026-10-28 (pricing and terms change — confirm with vendor before purchase)

---

## Evaluation criteria

| Criterion | Why it matters |
|-----------|----------------|
| **UGC / in-app stories** | License must cover **your app** distributing audio to **end users** for their stories, not only church Sunday streaming |
| **Stream URL API** | Stable HTTPS audio for `<audio>` / Range requests |
| **Search metadata** | Artist, title, genre, mood; ideally language/region tags |
| **Gospel / global Christian depth** | African gospel, Caribbean, Latin worship, Asian worship, hymns, CCM |
| **Safelisting / claims** | Lower priority for in-app-only audio (no YouTube republish) but relevant if stories are exported |
| **Pricing model** | Per MAU, per download/stream, enterprise minimums |

---

## Not sufficient alone (for this feature)

| Source | Typical gap |
|--------|-------------|
| **YouTube / Piped / Invidious** | No sync/background rights; extraction violates ToS; unreliable |
| **Spotify / Apple Music consumer APIs** | Preview-only or in-app playback rules; **no** general UGC soundtrack rights for third-party apps |
| **CCLI / CVLI streaming** | Worship **service** licensing — does **not** automatically cover **member story UGC** or arbitrary in-app background use |
| **Loop / MultiTracks / PraiseCharts** | Often rehearsal/service focused — need explicit **digital / social / UGC** rider |

---

## Candidate B2B catalogs

### Epidemic Sound Partner API

| Item | Notes |
|------|--------|
| **UGC fit** | Built for platform embedding; partner license can cover users posting from your product ([developer docs](https://developers.epidemicsound.com/docs/)) |
| **Catalog** | 55k+ tracks; **gospel/Christian** present but catalog is **global production music**, not Africa-first gospel depth |
| **Integration** | REST: search, **stream preview**, **download**; OAuth “Connect” optional; **Safelisting** for YouTube/social (paid partnership) |
| **Pricing** | Free dev key (~50 downloads, **not commercial go-live**); **Scale** by download volume; **Enterprise** custom ([developers portal](https://developers.epidemicsound.com/docs/)) |
| **Metering** | Downloads/previews metered automatically; exports may need reporting ([usage docs](https://developers.epidemicsound.com/docs/report-usage/)) |
| **Limitations** | Christian/gospel **discoverability** may need curated collections; confirm story-specific sublicense in contract |

**Shanah fit:** Strong **legal + API** story for UGC; weaker on **Nigerian/Ghanaian gospel** unless curated separately.

---

### Artlist Business / API

| Item | Notes |
|------|--------|
| **UGC fit** | Business licenses often cover social/video; **must confirm** “in-app user selects music for their upload” |
| **Catalog** | Large; worship/gospel not primary taxonomy |
| **Integration** | Typically business contact for API; consumer app differs from platform embedding |
| **Pricing** | Business tiers (contact sales); not self-serve for platform UGC at scale |
| **Limitations** | Contract negotiation required; gospel regional coverage |

**Shanah fit:** Possible enterprise path; slower procurement.

---

### Soundstripe Business

| Item | Notes |
|------|--------|
| **UGC fit** | Similar to Artlist — confirm platform redistribution to end users |
| **Catalog** | Broad; limited African gospel focus |
| **Integration** | API/partner programs vary by plan |
| **Pricing** | Business / enterprise quotes |

---

### AudioNetwork / Songtradr (enterprise)

| Item | Notes |
|------|--------|
| **UGC fit** | Enterprise sync/platform deals possible |
| **Catalog** | Very broad including world; gospel varies by label deals |
| **Integration** | Custom |
| **Pricing** | Enterprise |

**Shanah fit:** Long sales cycle; good if church wants major-label clearance path.

---

### Faith-specific / regional (hybrid complement)

| Source | Role |
|--------|------|
| **Label / artist direct deals** | Nigerian, Ghanaian, SA gospel artists — **church-authorized** files (your `church_authorized` provider) |
| **Gospel aggregators** | Possible bulk deals; rarely offer story-UGC API — often manual hosting |
| **Public domain hymns / Creative Commons** | Small **hymn/instrumental** slice; not a full gospel catalog |

**Shanah fit:** Essential for **authentic regional gospel** alongside any generic B2B API.

---

## Recommended hybrid strategy

1. **`licensed_catalog` provider** — one contracted B2B API (Epidemic Sound is the best-documented for **platform UGC**) for breadth, search, and compliance.
2. **`church_authorized` provider** — Vercel Blob (or R2) for **region-specific gospel** with signed agreements and rich metadata (`country`, `language`, `genres`).
3. **`legacy_catalog` provider** — read-only id preservation; map high-traffic legacy ids to licensed/church files over time **without changing** `musicTrackId`.

---

## POC vs production

| POC (this branch) | Production (after approval) |
|-------------------|-----------------------------|
| Synthesized WAV in `public/story-music-poc/` | Licensed streams or authorized Blob URLs |
| `STORY_MUSIC_HYBRID_ENABLED=1` locally | Phased flag on Vercel + migration plan |
| No vendor spend | Execute Epidemic (or chosen) enterprise agreement |

---

## Questions for vendor sales (copy/paste)

1. Does the license cover **end users** adding tracks as **background audio** to **user-generated photo/video stories** inside our **church mobile app and website**?
2. Are **stream/preview URLs** allowed for **in-app `<audio>` playback** (not only export)?
3. Pricing for **~X active members**, **Y story posts/month**, **Z preview plays/month**?
4. Can we **restrict catalog** to curated Christian/gospel collections?
5. Do you offer **metadata** for language/country or only genre/mood tags?

---

## Regional gospel coverage matrix (unverified — requires vendor demo)

**Legend:** ✅ Likely some titles · ⚠️ Limited / curated only · ❌ Not a strength · **?** Must verify with catalog search before contract

| Region / genre | Epidemic Sound | Artlist | Soundstripe | AudioNetwork / Songtradr | Church-authorized (`church_authorized`) |
|----------------|----------------|---------|-------------|---------------------------|----------------------------------------|
| **Ghanaian gospel** | ⚠️ **?** | ❌ **?** | ❌ **?** | ⚠️ **?** | ✅ Intended path (label/artist deals) |
| **Nigerian gospel** | ⚠️ **?** | ❌ **?** | ❌ **?** | ⚠️ **?** | ✅ Intended path |
| **South African gospel** | ⚠️ **?** | ❌ **?** | ❌ **?** | ⚠️ **?** | ✅ Intended path |
| **East African (KE, TZ, UG)** | ❌ **?** | ❌ **?** | ❌ **?** | ⚠️ **?** | ✅ Intended path |
| **Caribbean gospel** | ⚠️ **?** | ❌ **?** | ❌ **?** | ⚠️ **?** | ✅ Intended path |
| **American gospel / CCM** | ✅ **?** | ⚠️ **?** | ⚠️ **?** | ✅ **?** | ⚠️ Complement for exclusives |
| **Latin worship / gospel** | ⚠️ **?** | ⚠️ **?** | ⚠️ **?** | ⚠️ **?** | ✅ Local artists |
| **European worship** | ✅ **?** | ✅ **?** | ✅ **?** | ✅ **?** | Optional |
| **Asian Christian worship** | ⚠️ **?** | ⚠️ **?** | ❌ **?** | ⚠️ **?** | ✅ Local ministries |
| **Traditional hymns (PD)** | ⚠️ Recordings vary | ⚠️ | ⚠️ | ⚠️ | ✅ PD recordings you host |
| **Instrumental worship** | ✅ **?** | ✅ **?** | ✅ **?** | ✅ **?** | ✅ |

**Verification protocol (before purchase):** For each shortlisted vendor, run fixed search terms (e.g. “Sinach”, “Diana Hamilton”, “Joyous Celebration”, “Kirk Franklin”, “Marcos Witt”, “Eunice Njeri”) and record **hit count**, **full-track stream availability**, and **metadata fields** (artist, ISRC, genre, language). Store results in a spreadsheet — do not assume from marketing pages.

---

## Detailed provider scorecard (API + rights + playback)

| Dimension | Epidemic Sound Partner API | Artlist Business | Soundstripe Business | Notes |
|-----------|----------------------------|------------------|----------------------|--------|
| **API self-serve** | ✅ Free dev tier documented | ⚠️ Sales-led | ⚠️ Sales-led | ES best for engineering POC |
| **Search: artist + title** | ✅ **?** confirm | ⚠️ **?** | ⚠️ **?** | Test African artist names explicitly |
| **Full-track in-app stream** | ✅ Stream/preview endpoints **?** | ⚠️ **?** | ⚠️ **?** | Need written UGC story rights |
| **Licensed excerpt only** | ⚠️ Previews metered | Unknown | Unknown | Story needs full clip ≥ slide duration |
| **UGC story background rights** | ⚠️ Contractual — promising docs | **?** Must ask | **?** Must ask | Use questionnaire in prior section |
| **Android WebView `<audio>`** | ✅ HTTPS URLs work in browser engines | ✅ if HTTPS | ✅ if HTTPS | Same as POC; test Range requests |
| **Browser desktop** | ✅ | ✅ | ✅ | |
| **Typical cost driver** | Downloads/previews/jobs | Seats / enterprise | Enterprise | Model **unverified** until quote |
| **Indicative pricing (public)** | Free tier limited; Scale/Enterprise ([ES docs](https://developers.epidemicsound.com/docs/)) | Contact sales | Contact sales | **No subscription purchased** |

---

## Authorized regional gospel (missing from commercial libraries)

**Practical approach:**

1. **Rights pipeline** — Standard one-page **church story music license** with Ghana/Nigeria/SA artists or aggregators (territory, term, in-app stream, no download, attribution if required).
2. **Ingest** — Master file → **Vercel Blob** (`story-music/` prefix) with entry in `data/story-music-church-audio.json` (production catalog file separate from POC JSON).
3. **Metadata** — Required fields: `country`, `language`, `genres`, `artist`, `title`; optional ISRC / label contact.
4. **Stable ids** — Assign permanent `musicTrackId` before launch; never reuse POC `poc-*` ids in production.
5. **Curation board** — Worship pastor + one regional rep approve new tracks; quarterly review.
6. **Map legacy ids** — For top legacy YouTube-backed ids, add church or licensed file **keeping the same id** in `legacy_catalog` mapping table (future).

This layer is **required** for authentic African and Caribbean gospel even if a B2B API is adopted for CCM/instrumental breadth.

---

## Pilot scorecard (verify before purchase — all **?** = not confirmed)

| Requirement | Epidemic Partner | Artlist Biz | Soundstripe | Church-authorized |
|-------------|------------------|-------------|-------------|-------------------|
| Ghanaian gospel depth | ? | ? | ? | ✅ (your deals) |
| Nigerian gospel depth | ? | ? | ? | ✅ |
| South African gospel | ? | ? | ? | ✅ |
| East African gospel | ? | ? | ? | ✅ |
| Caribbean gospel | ? | ? | ? | ✅ |
| US gospel / CCM | ? likely some | ? | ? | ⚠️ partial |
| Latin worship | ? | ? | ? | ✅ local |
| European worship | ? | ? | ? | ⚠️ |
| Asian worship | ? | ? | ? | ✅ local |
| Artist + title search API | ✅ documented | ? | ? | ✅ (your metadata) |
| Full-track in-app stream | ✅ stream endpoint **?** UGC | ? | ? | ✅ HTTPS file |
| UGC **story background** rights | ? contract | ? | ? | ✅ intake doc |
| Android WebView `<audio>` | ✅ if HTTPS URL | ✅ if HTTPS | ✅ if HTTPS | ✅ |
| Desktop browsers | ✅ | ✅ | ✅ | ✅ |
| Public API + pricing | Dev free; Scale/Enterprise | Sales | Sales | N/A |

**Action:** Before any subscription, complete vendor searches documented in [STORY_MUSIC_LICENSED_PILOT_READINESS.md](./STORY_MUSIC_LICENSED_PILOT_READINESS.md) and attach results to leadership review.
