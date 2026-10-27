# Marriage Prep Stage 2 — Pastoral content review

Stage 2 remains **disabled in production** until `MARRIAGE_HUB_STAGE2_ENABLED` and `NEXT_PUBLIC_MARRIAGE_STAGE2` are deliberately set after pastoral sign-off. Enabling the feature flag alone is **not** approval to ship sensitive modules.

## Requires explicit pastoral approval before production enable

| Module ID | Title | Why it needs review |
|-----------|--------|---------------------|
| `s2-mod-06-intimacy` | Intimacy & physical connection | Adult intimacy education: emotional/physical affection, desire differences, family planning, opt-in gate, private reflection items, and likert content on sexual/emotional intimacy. **Hidden until** `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1`. Implementation: `src/lib/marriage-stage2-content/mod-06-intimacy.ts`, gated by `marriageStage2IntimacyModuleAccessible()` in `src/lib/marriage-stage2-feature.ts`. |

## Enabled with Stage 2 flag (non-intimacy) — still review recommended

These modules ship substantive content when Stage 2 is turned on in staging. Pastoral review is recommended before production, but they are not blocked by a separate env gate:

| Module ID | Title | Notes |
|-----------|--------|--------|
| `s2-temperament-discovery` | Temperament discovery | Assessment-style; sharing rules apply. |
| `s2-mod-02-family-background` | Family background | Upbringing, family patterns. |
| `s2-mod-03-communication` | Communication | Conversation cards. |
| `s2-mod-04-conflict-lab` | Conflict lab | Scenario practice; includes abuse disclaimer in summary. |
| `s2-mod-05-financial` | Financial stewardship | Money values and planning. |
| `s2-mod-07` … `s2-mod-12` | Growth track (7–12) | Expanded content in `src/lib/marriage-stage2-content/mod-07-12-growth.ts`. |

## Registry consistency

- Canonical registry: `src/lib/marriage-stage2-module-registry.ts` + `src/lib/marriage-stage2-content/index.ts`.
- Intimacy module must remain excluded from couple navigation until intimacy approval env is set.

## Approval checklist (Senior Pastor / designee)

1. Read full question text and lesson copy for `s2-mod-06-intimacy` in source (not summaries only).
2. Confirm opt-in / skip / private-reflection behavior matches church policy.
3. Confirm counselor escalation language (private counselor conversation) is accurate.
4. Sign off in writing; only then set `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` on staging, validate, then production.
5. Stage 2 master flag may be enabled only after steps 1–4 for intimacy and general Stage 2 review for modules 1–5 and 7–12.

## Current production posture

- Stage 2: **off** (default env).
- Intimacy module: **off** even if Stage 2 is enabled in a dev/staging experiment without intimacy approval.
