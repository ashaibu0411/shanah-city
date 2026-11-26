# Shanah City — design skills installation report

**Branch:** `chore/design-skills-installation-clean` (supersedes PR #161 on `chore/design-skills-installation`)  
**Base:** `origin/main` @ `4ffa13ddb1098e5767879d2ea4f810a8ba70e4eb`  
**Date:** 2026-11-26  
**Scope:** Cursor design skills, `AGENTS.md` reconciliation, verification script — **no app UI, Prisma, migrations, `.env`, or production config**

## AGENTS.md

`AGENTS.md` on `main` already contained **Design quality — app and public website**. That section is **unchanged in intent**; a **Cursor design skills (project)** section was appended with skill priority, verification command, and explicit bans on hooks / live refine scripts.

---

## Installed (project)

| Skill | Path | Upstream | Version | License |
|-------|------|----------|---------|---------|
| **shanah-design-system** (canonical) | `.cursor/skills/shanah-design-system/` | project | 1.0.0 | — |
| **frontend-design** | `.cursor/skills/frontend-design/` | anthropics/skills | main | upstream |
| **apple-design** | `.cursor/skills/apple-design/` | emilkowalski/skills | main | upstream |
| **transitions-dev** (full reference) | `.cursor/skills/transitions-dev/` | Jakubantalik/transitions.dev | `skills-lock.json` commit `ec4d48f5` | LICENSE.txt in skill |
| **transitions-polish** (companion) | `.cursor/skills/transitions-polish/` | same repo | same | same |
| **impeccable** (full) | `.cursor/skills/impeccable/` | pbakaus/impeccable | **4.11.1** | Apache-2.0 |
| **ui-ux-pro-max** (full + data) | `.cursor/skills/ui-ux-pro-max/` | nextlevelbuilder/ui-ux-pro-max-skill | CLI **v2.15.0** | MIT |
| **design-references** | `.cursor/skills/design-references/` | curated index | — | — |

Impeccable ecosystem skills co-installed under `.cursor/skills/` by the UI/UX Pro Max / Impeccable bundle: `brand`, `design`, `design-system`, `slides`, `ui-styling`, `banner-design` (research/build aids — **subordinate to `shanah-design-system`**).

Supporting: `.cursor/skills/README.md`, `.cursor/agents/impeccable-*.md`, `skills-lock.json`, `scripts/verify-design-skills.test.ts`, `npm run test:design:skills`.

---

## Installers executed (reviewed first)

| Command | Purpose | Hooks / risk | Result |
|---------|---------|--------------|--------|
| `npx impeccable@latest install -y --providers=cursor --scope=project --no-hooks` | Full Impeccable skill + reference + launcher | **No** `hooks.json`; binary may cache under user profile | OK |
| `npx ui-ux-pro-max-cli@latest init -a cursor -f` | Skill + CSV/Python search data | No hooks; no `--token` | OK |
| `npx skills add Jakubantalik/transitions.dev -y` | transitions.dev skills | Installed to `.agents/` then **copied to `.cursor/skills/`** for Cursor discovery | OK |

**Not run:** Taste Skill, Superpowers full install, `transitions-refine live`, Impeccable hooks, any `--token` / credential flags.

---

## Deferred (explicit)

| Source | Reason |
|--------|--------|
| **Taste Skill** | Stop hooks + browser gate — conflicts with no-automatic-hooks policy |
| **Superpowers** | Engineering workflow; indexed via `design-references` only |
| **Impeccable hooks** | User-approved **disabled** (`--no-hooks`) |

---

## Security / hygiene

| Check | Status |
|-------|--------|
| `.cursor/hooks.json` | **Absent** |
| `.env` / production secrets | **Unchanged** |
| `prisma/` / `src/` app code | **Out of PR diff** |
| `transitions-refine live` | Documented — **approval required** |
| Installer telemetry tokens | **Not passed** |

Repo-specific override blocks added to `impeccable`, `ui-ux-pro-max`, and `transitions-dev` SKILL.md files pointing at `shanah-design-system`.

---

## Cursor usage

Skills load from `.cursor/skills/<name>/SKILL.md`. Example prompts:

- “Follow **shanah-design-system** for this component.”
- “**impeccable** critique this screen (no redesign).”
- “**ui-ux-pro-max** search UX guidelines for forms, then apply Shanah tokens.”
- “**transitions-dev** — use `06-modal.md` pattern with reduced motion.”

Restart or reload Cursor after merge so skill discovery picks up new folders.

---

## Verification

```bash
npm run test:design:skills
npm run build
```

`test:design:skills` asserts: seven core skills, full Impeccable reference + UI/UX data CSV, transitions snippet library, no `hooks.json`, `AGENTS.md` sections, and Shanah override notes in installed upstream skills.