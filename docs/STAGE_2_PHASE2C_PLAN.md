# Stage 2 — Phase 2C implementation plan (modules 7–12)

**Status:** Planning only — do not implement until Phase 2B staging sign-off.

## Registry audit (current)

| ID | Title | Section | Activity kind | Content today |
|----|--------|---------|---------------|---------------|
| `s2-mod-07-faith-values` | Faith, spirituality & values | growth | agreement_builder | Stub (1 intro question) |
| `s2-mod-08-roles` | Roles & responsibilities | agreements | ranking | Stub |
| `s2-mod-09-parenting` | Parenting & family planning | agreements | scenario | Stub |
| `s2-mod-10-trust-digital` | Trust, boundaries & digital life | agreements | agreement_builder | Stub |
| `s2-mod-11-life-vision` | Life goals & long-term vision | growth | agreement_builder | Stub |
| `s2-mod-12-enrichment` | Marriage health & enrichment | growth | reflection | Stub |

Also in registry (Phase 2A catalog, not Phase 2C core six): `s2-scenario-library`, `s2-learning-reflection`.

## Shared Phase 2C requirements (all modules)

- Reuse Phase 2B journey: **LEARN → REFLECT → ANSWER → COMPARE → DISCUSS → PRACTICE → AGREE → REVIEW**.
- `MarriageStage2ModuleRunner`, lesson progress, submit review, consent UI, counselor lesson counts.
- ~55–100 items per module; required core + optional depth; save/resume.
- Server-side privacy: private / financial / counselor / explicit consent unchanged.
- Content files: `src/lib/marriage-stage2-content/mod-07-*.ts` … `mod-12-*.ts`, registered in `marriage-stage2-content/index.ts`.
- Publish curriculum after each module batch to freeze snapshots.
- Tests: extend `marriage-stage2-phase2b.ts` per module + targeted Playwright paths.

---

## Module 7 — Faith, spirituality & shared values

**Outline (8–10 lessons):** worship together; prayer rhythms; doctrine vs preference; church involvement; serving; handling doubt; interfaith or mixed tradition (optional); values hierarchy; spiritual leadership in home; legacy of faith.

**Activities:** likert on spiritual practices; ranking core values; agreement builders on church attendance and giving time; scenario (schedule conflict: service vs family event); private reflection on doubts; shared goal for one spiritual habit.

**Privacy:** Doubt/faith wounds → `private_reflection`; sensitive family faith history → `explicit_consent_to_share`.

**Integration:** growth section; counselor sees lesson completion; comparison on shared agreements only.

---

## Module 8 — Marriage roles & responsibilities

**Outline:** gifting vs gender defaults; household labor; breadwinner pressure; emotional labor; decision domains; seasons (new job, new baby); supporting aging parents; rest and Sabbath.

**Activities:** ranking household tasks by preference/strength; scenario library for “who handles X”; joint agreement on decision rights; workload audit worksheet (hours estimate, no shaming).

**Privacy:** Resentment journal → private; financial role stress → optional private.

**Integration:** agreements section; link to Module 5 financial themes without duplicating budget grid.

---

## Module 9 — Parenting & family planning

**Outline:** desire for children; timing; infertility grief (skip paths); discipline philosophy; screen time; grandparents; schooling; special needs; blended family.

**Activities:** scenarios for public discipline disagreement; agreement on “united front” rule; family planning timeline (shared + private medical skip); optional lessons gated when `no_children` path selected.

**Privacy:** Medical/fertility → `private_reflection` / counselor; high sensitivity on past loss → explicit consent.

**Content warning:** Past trauma — pastoral resources, not clinical diagnosis.

---

## Module 10 — Trust, boundaries & digital life

**Outline:** Transparency vs surveillance; phones and passwords; social media; opposite-sex friendships; pornography (pastoral, non-graphic); gambling; financial secrecy; work boundaries; recovery after breach.

**Activities:** agreement builders on digital boundaries; scenarios for notification jealousy; trust repair steps (link conflict lab patterns); private disclosure of concerns → counselor_with_consent.

**Privacy:** Never expose partner’s private disclosures in compare; no automated sharing of device contents.

---

## Module 11 — Life goals & long-term vision

**Outline:** 1 / 5 / 10 year vision; career vs family; geography; ministry calling; education; retirement; legacy; handling divergent ambitions.

**Activities:** vision board prompts (text); ranking life priorities; joint “one year” SMART goal; partner prediction on priorities; action plan integration (Stage 2 action plans API).

**Integration:** ties to `create_action_plan` / shared goals on dashboard.

---

## Module 12 — Marriage health & ongoing enrichment

**Outline:** Monthly check-in ritual; appreciation habits; conflict tune-ups; date rhythm; mentor couples; when to seek counseling; anniversary review; spiritual renewal.

**Activities:** recurring reflection templates; enrichment calendar builder; likert on current health; agreement to quarterly review; optional link to Module 1 temperament refresh.

**Integration:** enrichment program track; counselor assigns as follow-up after premarital completion.

---

## Phase 2C delivery order (recommended)

1. Module 7 (faith/values) — low technical risk, high pastoral review need  
2. Module 8 (roles) — ranking UX reuse  
3. Module 10 (trust/digital) — consent-heavy  
4. Module 11 (vision) — action plan tie-in  
5. Module 9 (parenting) — skip paths + warnings  
6. Module 12 (enrichment) — capstone + counselor workflows  

## Blockers before coding

- Staging sign-off on Phase 2B (`docs/STAGE_2_STAGING_ACCEPTANCE.md`).
- Pastoral review copy for Modules 7, 9, 10.
- Published curriculum version on staging that includes Phase 2B freeze.
