---
name: ui-ux-pro-max
description: Design intelligence for layout, UX patterns, typography pairing research, and icon guidance. Use when exploring design-system options for a new Shanah surface. Shanah brand tokens always override generated palettes.
license: MIT (nextlevelbuilder/ui-ux-pro-max-skill)
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
source_version: README v2.0 (intelligent design system generation)
---

# UI UX Pro Max (Shanah bridge)

Upstream bundles curated CSV/Markdown design knowledge and Python `search.py` for style, typography, UX, and icon queries.

## Shanah constraints

- Output is **research only** — map suggestions onto `night` / `sand` / `clay` / `gold` / `sage` tokens
- Do not replace `font-display` / `font-sans` with random Google font pairs from the skill
- Ministry app = **Operate** and **Read** modes more than marketing **Persuade**

## Partial install status

This repo includes the **skill instructions only**. The data catalog and `scripts/search.py` are **not vendored** (large CSV set).

### Optional full install (requires approval)

From project root, after security review:

```bash
npx uipro init --ai cursor
# or: gh skill install nextlevelbuilder/ui-ux-pro-max-skill
```

That copies `.cursor/skills/ui-ux-pro-max` with scripts and data per upstream README.

## When to use

- Choosing chart patterns, form UX, icon semantics
- Accessibility copy for errors and empty states
- RTL or responsive pattern lookup

## When not to use

- Global re-skin of Shanah City
- Replacing premium-home CSS architecture