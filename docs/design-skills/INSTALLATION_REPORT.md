# Shanah City — design skills installation report

**Branch:** `chore/design-skills-installation`  
**Date:** 2026-11-26  
**Scope:** Development environment only — **no application UI, env, or database changes**

## AGENTS.md review

The repository did **not** contain `AGENTS.md` before this work. A new root `AGENTS.md` was added to document skill priority and UI release gates without altering product code.

---

## Successfully installed (project skills)

| Skill | Path | Upstream | Version / ref | License |
|-------|------|----------|---------------|---------|
| **shanah-design-system** (canonical) | `.cursor/skills/shanah-design-system/` | _(project-authored)_ | 1.0.0 | — |
| **frontend-design** | `.cursor/skills/frontend-design/` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | main (2026) | upstream LICENSE.txt |
| **apple-design** | `.cursor/skills/apple-design/` | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/main/skills/apple-design) | main | upstream LICENSE |
| **transitions-dev** | `.cursor/skills/transitions-dev/` | [Jakubantalik/transitions.dev](https://github.com/Jakubantalik/transitions.dev) | skills/transitions-dev | transitions.dev terms + MIT tooling |
| **impeccable** (bridge) | `.cursor/skills/impeccable/` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | **4.11.1** (metadata) | Apache-2.0 |
| **ui-ux-pro-max** (bridge) | `.cursor/skills/ui-ux-pro-max/` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | README **v2.0** | MIT |
| **design-references** | `.cursor/skills/design-references/` | awesome-design-md + superpowers index | — | — |

Supporting docs: `.cursor/skills/shanah-design-system/DESIGN.md`, `PRODUCT.md`, `.cursor/skills/README.md`

---

## Not fully installed (and why)

| Source | Reason |
|--------|--------|
| **Impeccable (full)** | `npx impeccable install` downloads CLI/binary, copies large `reference/` tree, and offers **PostToolUse hooks**. **Hooks not enabled** per security policy. Bridge skill documents optional install. |
| **UI UX Pro Max (full)** | Skill requires `cli/assets/data` CSVs + Python `search.py` (~large). `npx uipro init --ai cursor` not executed without explicit approval (network + mass file write). Bridge skill + optional install command documented. |
| **Taste Skill** | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) **v2.5.1** ships **Stop hooks** running `gate.mjs` (Node 22 + Chrome). Not compatible with “no automatic hooks” policy. |
| **Superpowers** | [obra/superpowers](https://github.com/obra/superpowers) — engineering workflow, not frontend design; indexed in `design-references` only. |
| **Awesome Design MD** | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — link catalog, not a single SKILL; referenced, not vendored. |
| **Anthropic plugin path** | User URL pointed at `claude-code/plugins/frontend-design`; canonical skill content taken from **anthropics/skills** (same guidance, maintained path). |

---

## Configuration conflicts resolved

| Conflict | Resolution |
|----------|------------|
| frontend-design “bold new aesthetic” vs Shanah brand | **`shanah-design-system` always wins** on colors, fonts, nav |
| Impeccable redesign vs no app redesign | Impeccable limited to **refine/critique**; no init/hooks |
| Apple design vs web church app | Apple skill = **motion/touch only** |
| ui-ux-pro-max generated palettes | Map research → existing Tailwind scales only |
| taste-skill landing-page rules vs ministry app | Not installed; would conflict with existing home architecture |

---

## Security review

| Item | Finding | Action taken |
|------|---------|--------------|
| `npx impeccable install` | Network fetch, binary, hook JSON | **Not run** |
| Impeccable hooks (`PostToolUse`, detector) | Auto-runs on UI edits | **Not enabled** |
| taste-skill `gate.mjs` Stop hook | Blocks agent until browser gate | **Not installed** |
| `npx transitions-refine live` | Injects script into running app | Documented as **approval required** |
| `npx uipro init` | Writes `.cursor/skills` + data | Documented as **optional** |
| `install.sh` (taste-skill) | Shell installer | **Not executed** |
| Credentials / `.env` | — | **No changes** |

No new `hooks.json` committed under `.cursor/`.

---

## Cursor invocation

Skills are discovered from `.cursor/skills/<name>/SKILL.md`. Mention in chat:

- “Use **shanah-design-system** for this UI task”
- “**frontend-design** + shanah tokens”
- “**apple-design** for this sheet gesture”
- “**transitions-dev** for modal transition”
- “**impeccable** polish / critique (no hooks)”
- “**ui-ux-pro-max** for UX pattern research”

Verification script: `npm run test:design:skills` (see `scripts/verify-design-skills.test.ts`).

---

## Git / PR

- Commit on `chore/design-skills-installation`
- Open PR — **do not merge** per instructions

---

## Confirmation

- **No** changes to `src/` app components, layouts, or styles  
- **No** production env or Vercel configuration changes  
- **No** database or API changes  
- Only: `AGENTS.md`, `.cursor/skills/**`, `docs/design-skills/**`, `scripts/verify-design-skills.test.ts`, `package.json` test script (if added)