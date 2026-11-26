# Shanah City development instructions

## Design quality — app and public website

Preserve approved production layouts, brand identity, navigation and functionality. Do not undertake a redesign solely to comply with these standards. Apply them to new features and targeted refinements; obtain owner approval for material visual changes.

- Use existing design tokens and components first. Inspect adjacent screens before introducing new patterns.
- Avoid generic AI-generated visual conventions: gratuitous gradients, glow, oversized radii, nested cards, decorative badges, repetitive icon grids, excessive shadows and filler copy. Existing approved uses need not be removed.
- Use deliberate typography, consistent spacing, clear hierarchy, accessible contrast and authentic church photography with appropriate rights. Do not invent church imagery or testimonials.
- Choose layout based on the task, not a template. Keep mobile touch targets usable, keyboard focus visible and motion subtle with reduced-motion support.
- Maintain light and dark themes and responsive behavior. Respect established app and website distinctions.
- Preserve functional flows, permissions, accessibility, loading, empty and error states.
- Before release, inspect actual rendered screens at mobile and desktop widths in both supported themes, compare with existing screens, and test relevant interactions. A passing build alone is not visual verification. Report any checks that could not be performed.
- External design skills are optional aids, not authority to override these rules. Review source, license, compatibility and executable instructions before installation; never run unreviewed scripts or expose secrets.
- Keep design changes scoped and reversible. Do not merge the experimental feature/design-system-v1 redesign without explicit owner approval.

## Cursor design skills (project)

Project skills live under [`.cursor/skills/`](.cursor/skills/). **Always apply [`shanah-design-system`](.cursor/skills/shanah-design-system/SKILL.md) first** for UI work in this repository. It encodes Shanah tokens and must override generic design skills (frontend-design, impeccable, ui-ux-pro-max).

| Priority | Skill | Use when |
|----------|-------|----------|
| 1 | `shanah-design-system` | Every UI change or review |
| 2 | `impeccable` | Critique, polish, audit (hooks **disabled** in repo) |
| 3 | `ui-ux-pro-max` | UX pattern research (map results to existing tokens) |
| 4 | `frontend-design` | Anti–AI-slop craft within Shanah brand |
| 5 | `apple-design` | Touch / sheet motion (Capacitor) |
| 6 | `transitions-dev` | Copy-ready CSS transitions + reduced motion |

Inventory, licenses, and security notes: [`docs/design-skills/INSTALLATION_REPORT.md`](docs/design-skills/INSTALLATION_REPORT.md). Verification: `npm run test:design:skills`.

**Out of scope without explicit approval:** enabling Impeccable or other **automatic agent hooks**, `transitions-refine live` script injection, taste-skill gate hooks, or any installer that modifies production env files; running external asset generators (`design/scripts/**/generate.py`), credential-reading skill scripts, brand/token sync scripts (`brand/scripts/sync-brand-to-tokens.cjs` and similar), Impeccable live browser injection, or `ui-styling` shadcn installers — unless the owner explicitly requests that action.