# Shanah City — agent workspace guide

This repository has **no application redesign mandate**. Agents working here must preserve existing layouts, navigation, data models, and production configuration unless the user explicitly requests a product change.

## Design skills (Cursor)

Project-level UI guidance lives under [`.cursor/skills/`](.cursor/skills/). **Always read [`shanah-design-system`](.cursor/skills/shanah-design-system/SKILL.md) first** on any UI/UX task. Other design skills apply only when their scope matches the request and must not override Shanah brand tokens.

| Priority | Skill | When to use |
|----------|-------|-------------|
| 1 | `shanah-design-system` | Every UI change in this repo |
| 2 | `frontend-design` | New surfaces; anti–AI-slop craft (within Shanah brand) |
| 3 | `apple-design` | Mobile gestures, sheets, spring motion (Capacitor / touch) |
| 4 | `transitions-dev` | Purposeful CSS transitions; respect `prefers-reduced-motion` |
| 5 | `impeccable` | Critique, polish, audit — **no automatic hooks** |
| 6 | `ui-ux-pro-max` | Design-system research (optional data install) |

Install inventory, licenses, and security notes: [`docs/design-skills/INSTALLATION_REPORT.md`](docs/design-skills/INSTALLATION_REPORT.md).

## UI release gate

Before marking UI work complete: run the app locally (or staging), visually inspect at mobile and desktop breakpoints, and verify accessibility basics (focus, contrast, reduced motion).

## Out of scope for agents unless asked

- Running `npx impeccable install` hooks, `taste-skill` gate hooks, or `transitions-refine live` injection without explicit approval
- Changing `.env`, secrets, or production Vercel settings
- Repo-wide visual redesigns