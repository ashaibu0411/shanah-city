---
name: impeccable
description: Design critique, polish, audit, typography and hierarchy improvements for UI. Use when user asks to polish, critique, or remove AI slop. Hooks and CLI auto-install are disabled in this repo unless explicitly approved.
license: Apache-2.0
source: https://github.com/pbakaus/impeccable
source_version: 4.11.1 (skill metadata from upstream .cursor/skills/impeccable/SKILL.md)
---

# Impeccable (Shanah bridge)

Impeccable provides vocabulary for **critique**, **polish**, **audit**, **typeset**, **clarify** (UX copy), and **operate** mode dashboards.

## Shanah constraints (required)

1. Load **`shanah-design-system`** before any UI edit
2. **Do not** run `/impeccable hooks on` or install PostToolUse hooks without user approval
3. **Do not** run `npx impeccable install` in CI without review (downloads binary, may modify hooks)
4. Refinement preserves IA; redesign does not apply to this repo unless requested

## Useful command concepts (manual)

When the user asks for polish:

- **critique** — hierarchy, clarity, AI tells
- **polish** — spacing, alignment, copy tightening within DESIGN.md
- **audit** — a11y, responsive, performance of UI
- **typeset** — fix scale/leading using Shanah fonts only
- **clarify** — pastoral, plain-language labels and errors

## Optional full install (not run by default)

Official: `npx impeccable install` then Cursor plugin path. Full skill includes `reference/` corpus and detector scripts under `.cursor/skills/impeccable/`.

Upstream: https://impeccable.style/

## Live mode

`/impeccable live` requires browser tooling — use Cursor browser MCP for visual inspection instead unless user enables Impeccable Live explicitly.