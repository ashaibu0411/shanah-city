# Shanah City — DESIGN.md (agent-facing)

Extracted from live tokens; update when brand tokens change in `globals.css` / `tailwind.config.ts`.

## Color

- Paper background: `--color-bg` #f8f7f4
- Surface: `--color-surface` #ffffff
- Ink: `--color-ink` #191c24
- Accent: `--color-accent` #c45d3e (clay family)
- Premium navy: `--premium-navy` #10264a
- Premium gold: `--premium-gold` #c9a66b

Tailwind semantic families: `night`, `sand`, `clay`, `gold`, `sage`.

## Type

- Display: `font-display` → Georgia fallback
- UI body: `font-sans` → system-ui stack

## Shape & elevation

- Prefer modest radius consistent with existing `Card` / inputs
- Shadows: `shadow-app-sm` / `shadow-app-md` when elevation is needed — not on every tile

## Modes

- `darkMode: "class"` on `html.dark` — pair tokens from `globals.css` dark block