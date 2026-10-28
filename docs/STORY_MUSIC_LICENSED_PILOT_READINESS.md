# Licensed story music pilot — readiness report

**Branch:** `fix/story-music-hybrid`  
**Date:** 2026-10-28  
**Production:** Hybrid flags **off** · No deploy · No vendor subscription · No prod data migration

---

## Delivered in this phase

| Item | Location |
|------|----------|
| Rights intake process | [STORY_MUSIC_RIGHTS_INTAKE.md](./STORY_MUSIC_RIGHTS_INTAKE.md) |
| Admin workflow (RBAC + audit) | `/admin/story-music`, `/api/admin/story-music` |
| Authorized catalog store | `data/story-music-authorized-catalog.json` (empty) |
| Intake records | `data/story-music-rights-records.json` |
| Audit log | `data/story-music-admin-audit.jsonl` (created on first action) |
| Legacy migration map | `data/story-music-legacy-migration-map.json` + [STORY_MUSIC_MIGRATION_MAPPING.md](./STORY_MUSIC_MIGRATION_MAPPING.md) |
| Usage report script | `scripts/story-music-legacy-usage-report.mjs` |
| Pilot test plan | [STORY_MUSIC_PILOT_TEST_PLAN.md](./STORY_MUSIC_PILOT_TEST_PLAN.md) |
| Rollback | [STORY_MUSIC_ROLLBACK.md](./STORY_MUSIC_ROLLBACK.md) |
| Catalog roadmap | [STORY_MUSIC_CATALOG_ROADMAP.md](./STORY_MUSIC_CATALOG_ROADMAP.md) |
| Provider comparison | [STORY_MUSIC_PROVIDER_COMPARISON.md](./STORY_MUSIC_PROVIDER_COMPARISON.md) |

## Local pilot env (not production)

```env
STORY_MUSIC_HYBRID_ENABLED=1
NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1
STORY_MUSIC_ADMIN_WRITE_ENABLED=1
# STORY_MUSIC_POC_CATALOG_ENABLED=1   # QA tones only — keep off for licensed pilot
```

## Admin workflow summary

1. **Create draft** — artist, title, rights fields, `/story-music/…` path (file must exist before publish).  
2. **Mark rights verified** — requires document ref, streaming/storage flags, story use text.  
3. **Publish** — writes to authorized catalog; playable when hybrid enabled.  
4. **Revoke** — removes from catalog; stories keep `musicTrackId`; playback unavailable.

**Authorization:** Admin Group (`canManageAsAdmin`).  
**Writes gated:** `STORY_MUSIC_ADMIN_WRITE_ENABLED=1`.

## Legacy usage analytics

Run against a database clone or staging (read-only aggregate):

```bash
npm run report:story-music:legacy-usage
```

Output: `musicTrackId`, `totalStories`, `activeStories`, optional legacy catalog label — **no member ids**.

Use output to prioritize [migration mappings](./STORY_MUSIC_MIGRATION_MAPPING.md).

## Outstanding decisions (require your approval)

| # | Decision |
|---|----------|
| 1 | **Licensed vendor shortlist** — Initiate Epidemic Sound enterprise conversation vs. church-only authorized catalog for pilot? |
| 2 | **First real recordings** — Which 1–3 label/artist agreements to execute for GH/NG pilot? |
| 3 | **Storage** — Keep pilot files in repo `public/story-music/` vs. Vercel Blob for staging? |
| 4 | **Migration priority** — Approve top-N legacy ids from usage report for first mappings. |
| 5 | **Staging hybrid enable** — When to turn hybrid on staging (still no production). |
| 6 | **Worship curator role** — Admin Group only vs. dedicated env allowlist for non-admin curators? |
| 7 | **Budget** — Licensed API subscription ceiling (if vendor path chosen). |

## Phase 2 design (pre-implementation)

See **[STORY_MUSIC_PHASE2_DESIGN.md](./STORY_MUSIC_PHASE2_DESIGN.md)** for proposed Prisma schema, Blob storage, RBAC, staging plan, and security model. **Implementation blocked** until that document is approved.

## Next engineering steps (after Phase 2 design approval)

1. Run usage report on staging DB; fill migration map for top tracks.  
2. Ingest first authorized files + intake publish.  
3. Execute [pilot test plan](./STORY_MUSIC_PILOT_TEST_PLAN.md) on Android APK.  
4. Implement licensed provider adapter when contract exists (replace stub).  
5. Optional: Prisma models for intake/audit before multi-editor production ops.

## Explicit non-actions (confirmed)

- No production deploy  
- No merge to `main`  
- No subscription purchase  
- No copyrighted audio published without intake  
- No `STORY_MUSIC_*` production flags enabled  
