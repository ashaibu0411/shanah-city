# PR #102 — pre-existing `test:vision:phase1` CI failure (unrelated)

**Date:** 2026-11-16  
**PR:** [#102](https://github.com/ashaibu0411/shanah-city/pull/102) Homepage Mobile Spacing V3  
**Failing step:** GitHub Actions `verify` → `npm run test:vision:phase1`  
**PR diff:** No changes under `src/lib/vision-2027-drafts.ts`, `scripts/vision-center-phase1.test.ts`, or other Vision Center paths.

## Assertion

`scripts/vision-center-phase1.test.ts` requires each 2027 draft body to match:

`/NOT APPROVED|not approved|proposed|Proposed/i`

On `origin/main`, the **`kids`** draft (`dream-team-kids-vbs-2027` content merged on main) includes phrases such as *"The children's leader must **propose**"* and *"submits an **implementation proposal**"* but does **not** include the literal tokens `proposed` / `Proposed` / `not approved` / `NOT APPROVED`. The regex does not match the verb **propose** (only **proposed**).

## Local reproduction (same on PR branch and main)

```bash
npm run test:vision:phase1
# AssertionError: kids must stay draft-only
```

## Scope for PR #102

Homepage spacing is CSS + mobile shell hook only. **Do not fix Vision Center in this release** — track Vision regression separately on `main`.