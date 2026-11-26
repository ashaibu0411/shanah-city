---
name: transitions-dev
description: Production-ready CSS transitions (modals, dropdowns, toasts, error shake, skeleton reveal) with prefers-reduced-motion guards. Use when adding motion tokens or replacing ad-hoc durations in Shanah UI.
license: transitions.dev LICENSE — commercial use allowed; do not redistribute library as competing kit
source: https://github.com/Jakubantalik/transitions.dev
source_skill_path: skills/transitions-dev/SKILL.md (upstream)
---

# Transitions.dev (Shanah adapter)

> **Shanah City:** Prefer existing `fade-in` / `pulse-soft` in `tailwind.config.ts` first. Pull snippets from [transitions.dev](https://transitions.dev/) when a specific pattern is needed.

## Install pattern (reference)

Upstream ships copy-paste CSS with `t-*` classes and motion custom properties. Each snippet includes `@media (prefers-reduced-motion: reduce)`.

## Common patterns

| Pattern | Use |
|---------|-----|
| Menu dropdown | Origin-aware open/close |
| Modal | Scale modal; softer close |
| Panel reveal | Slide + subtle blur |
| Error shake | Form validation feedback |
| Success check | Confirm actions sparingly |
| Skeleton reveal | Loading → content cross-fade |

## Workflow

1. Name the interaction (dropdown, modal, toast, etc.)
2. Open the matching card on transitions.dev and copy the CSS block
3. Namespace classes; avoid global animation duration spam
4. Test with reduced motion enabled

## Not installed in repo

Per-transition reference files (`01-card-resize.md`, …) live upstream. Optional CLI: `npx transitions-dev add <name>` (network; user approval for npx).

**Do not** run `npx transitions-refine live` without explicit approval (injects scripts into running app).