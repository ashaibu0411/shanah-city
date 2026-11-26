---
name: apple-design
description: Fluid, physical motion and touch interaction patterns (WWDC-style) for web and Capacitor. Use for sheets, drag, springs, press feedback, reduced motion. Subordinate to shanah-design-system for visual branding.
license: Upstream skill by emilkowalski/skills — follow repository LICENSE
source: https://github.com/emilkowalski/skills/tree/main/skills/apple-design
---

# Apple design (web translation)

> **Shanah City:** Visual branding stays on Shanah tokens. Use this skill for **motion and touch** on mobile web / Capacitor, not for replacing colors or typography.

## When to apply

- Bottom sheets, swipe dismiss, drag-to-close
- Press-down feedback (`:active` scale), interruptible transitions
- Spring-like easing where CSS allows; prefer short durations on buttons
- `prefers-reduced-motion`: remove non-essential motion

## Core rules

1. **Response** — feedback on pointer-down, not only on release; minimize input latency
2. **Direct manipulation** — content tracks finger 1:1; respect grab offset
3. **Projection & interruption** — transitions must be reversible mid-gesture when feasible
4. **Restraint** — delight without constant bounce; church app = calm operational UI

## CSS example (press)

```css
.button:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

## Do not

- Introduce iOS chrome that conflicts with Shanah navigation
- Replace existing component library patterns wholesale