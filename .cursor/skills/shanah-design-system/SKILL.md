---
name: shanah-design-system
description: Canonical Shanah City UI rules — porcelain/warm church app aesthetic, Tailwind tokens, typography, motion, and anti–AI-slop constraints. Use for every frontend change, review, or new component in shanah-city (Next.js, Capacitor mobile).
---

# Shanah City design system (canonical)

**This skill wins over all other design skills in this repository.** Do not introduce new palettes, fonts, or layout systems unless the user explicitly approves a brand change.

## Product context

Shanah City is a church community app: worship, groups, giving, kids ministry, messaging, and leadership tools. The UI should feel **warm, trustworthy, and human** — not a generic SaaS template or AI landing page.

## Tokens (source of truth)

Read before editing UI:

- `src/app/globals.css` — CSS variables (`--color-*`, `--premium-navy`, `--premium-gold`, chat tokens)
- `tailwind.config.ts` — `night`, `sand`, `clay`, `gold`, `sage` scales; `font-display` / `font-sans`; `app-sm` / `app-md` shadows
- Existing components in `src/components/ui` — match patterns, spacing, and `Card` / `Button` usage

### Palette (do not replace)

| Role | Guidance |
|------|----------|
| Background | Warm paper (`#f8f7f4`, sand scales), not cold gray or cream #F4F1EA “AI default” |
| Ink / text | `night-900` / `--color-ink`, muted `night-600` |
| Accent | Clay terracotta (`clay-500` `#c45d3e`) — church warmth, not purple gradient heroes |
| Premium / leadership | Navy `#10264a` and gold `#c9a66b` / `gold-*` where premium home patterns already use them |

### Typography

- **Display:** `font-display` (serif stack via `--font-display`)
- **Body:** `font-sans` (via `--font-sans`)
- Do **not** add Inter, Roboto, Space Grotesk, or random Google fonts without approval
- Prefer sentence case; avoid ALL CAPS eyebrows and “accent one word in the headline” tropes

### Layout & components

- Reuse existing section rhythms (premium home CSS layers are intentional — do not flatten)
- **Avoid** nesting cards inside cards, gratuitous gradients, and heavy drop shadows on every block
- Prefer real church photography and existing media assets over stock AI illustrations
- Mobile-first: respect `mobile-native-density.css` and touch targets (min ~44px)

### Motion

- Use existing utilities (`fade-in`, `pulse-soft`) and purposeful state feedback
- Honor `prefers-reduced-motion`
- No staggered fade-up on every section; no decorative parallax

## Anti–AI-slop checklist (Shanah-specific)

Reject or revise when you see:

- Purple/indigo gradient heroes, “AI beige” empty states
- Identical rounded cards in a grid with the same soft shadow repeated
- Middle-dot meta strings (`A · B · C`) and fake dashboard stat rows
- Terracotta **only** because it is trendy — it must match **clay** tokens above

## Scope rules

- **Refinement:** preserve navigation, information architecture, and feature behavior
- **New UI:** must look like adjacent Shanah screens (check a similar route first)
- **Accessibility:** visible focus, labels on inputs, contrast on clay/navy text pairings

## Visual verification (required)

After UI edits: run dev server or use browser tools; screenshot mobile (~390px) and desktop; confirm dark mode if the surface supports `html.dark`.

## Conflict resolution

If `frontend-design`, `impeccable`, or `ui-ux-pro-max` suggest a **new global aesthetic**, defer to this skill and treat external skills as **tactics** (hierarchy, copy, a11y) only.