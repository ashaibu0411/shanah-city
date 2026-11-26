---
name: frontend-design
description: Distinctive, intentional visual design for new UI work; anti–AI-slop typography and layout craft. Use when building or reshaping interfaces. In shanah-city, always subordinate to shanah-design-system for colors, fonts, and brand.
license: See anthropics/skills (frontend-design); complete terms in upstream LICENSE.txt
source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
source_version: upstream main (2026)
---

# Frontend design (Anthropic)

> **Shanah City:** Read `shanah-design-system` first. Do not change global palette, fonts, or navigation. Apply this skill for hierarchy, copy, spacing discipline, and avoiding templated patterns **within** existing tokens.

Approach work like a design lead: deliberate choices specific to the brief; reject cliché templates.

## Ground designs in subject matter

Identify audience and job-to-be-done. For Shanah City: church community, pastoral tone, mobile Sunday use — not fintech or generic SaaS.

## Principles (selected)

- Hero treatment must fit content — not default “big stat + gradient accent” unless the brief requires it
- Typography carries personality; use **Shanah** `font-display` / `font-sans`, not Inter/Roboto swaps
- Line length ~80 characters max in reading flows
- Avoid: single highlighted word in headlines, ALL CAPS labels, fake numbered steps, middle-dot meta rows
- Motion: one purposeful moment per view; no fade-slide on every card; honor `prefers-reduced-motion`
- Copy: active voice, sentence case, concrete CTAs

## AI-slop tells to avoid

Warm cream + terracotta **only when it matches Shanah clay tokens** — not as a default unrelated palette. Avoid identical card grids, hairline SaaS chrome, purple gradients, and decorative arrows on every link.

## Process

1. Plan tokens, type, layout in prose (wireframe in ASCII if helpful)
2. Self-critique plan against generic defaults
3. Implement; verify visually at mobile + desktop
4. Remove one decorative element before shipping (restraint)

## Restraint

Build responsive, focus-visible, accessible UI. Critique with screenshots when possible before release.