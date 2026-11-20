# Shanah City production build memory investigation

Date: November 19, 2026 (America/Denver). UTC CI logs span November 20.
Scope: recurring Vercel production OOM / SIGKILL during Next.js 15.5.23 build.
Source code baseline: GitHub branch main including PR #132.

## Observed evidence

| Environment | Execution | Build memory | Result |
| --- | --- | --- | --- |
| GitHub Actions profiler, run 44658187846, job 136029542007 | npm run diagnose:build-memory; Webpack worker disabled only for profiling | **3,035.61 MB peak process RSS**, **1,392.97 MB peak heap**, 3.42s GC time | **Success**; 290 static pages generated |
| GitHub Actions baseline, run 44658740980, job 136031385666 | node scripts/build-memory-baseline.cjs; normal Next.js worker configuration | **3,090 MiB peak sampled aggregate process-tree RSS**, 3 processes maximum | **Success**; 290 static pages generated |
| Vercel initial production failure, dpl_EkRGXDcBR4umShnXEHKd3UHuRxNR | 4 cores / 8 GB Standard Build Machine, restored build cache | Vercel reported build-container OOM and SIGKILL | **Failed** during optimized compile |
| Vercel redeployment, dpl_6YtwGrutPLGXSKrrRJoC8oFUr5Wh | 8 cores / 16 GB Enhanced Build Machine, build cache skipped | No public per-process peak measurement in the logs inspected | **READY** |
| Vercel PR #129 initial failure, dpl_BQdm1N7v278iFbfB8Y9wY4rLkhyB | 4 cores / 8 GB Standard Build Machine, restored build cache | Vercel reported OOM and SIGKILL | **Failed** |
| Vercel PR #129 retry, dpl_8Mtk3PrLPWFTXwcwUakSAtG4f3Tg | 8 cores / 16 GB Enhanced Build Machine, build cache skipped | No per-process peak measurement | **READY** |
| Vercel PR #132 successful deployment, dpl_HcwLCAvXV51VQZB7UD9swHptSz6U | 8 cores / 16 GB Enhanced Build Machine, restored cache | No per-process peak measurement | **READY** |

**Measurement limitations:** profiler RSS is a single build process; baseline sums process-tree RSS, including shared pages (may overcount), sampled every 3 seconds (may miss short spikes). CI runners do not include Vercel's exact production environment, cache, network, or build orchestration. These values cannot be directly treated as Vercel container peak memory or prove a memory leak.

## Assessment

1. Successful isolated normal and debug builds both consume roughly 3 GiB, so changing only `experimental.webpackBuildWorker` is **not** an evidence-backed production fix.
2. Multiple documented failures are on Vercel's **8 GB Standard** build tier; successful redeployments are on **16 GB Enhanced**. This is a meaningful correlation, not proof that 16 GB is always necessary.
3. Both the machine size and cache state differ between failed standard builds and first enhanced retries. That prevents attributing the outcome solely to machine memory or cache.
4. Vercel has explicitly detected **out-of-memory** events; do not treat these as ordinary code syntax errors.
5. Current code already uses `experimental.webpackMemoryOptimizations: true` and `experimental.cpus: 1`. Keep lint/type checks and migrations enabled.

## Repeatable diagnosis

After merging the manual workflow, use GitHub Actions > **Next.js build memory comparison (manual)** > **Run workflow**. It executes two isolated builds: the Next.js official heap profiler and normal process-tree RSS sampler. Both run without production secrets, production migrations, or stored heap snapshot artifacts.

- Profiler command: `npm run diagnose:build-memory`
- Normal baseline: `node scripts/build-memory-baseline.cjs`
- Neither command replaces standard `npm run build`.
- Do not upload or commit heap snapshots or output containing secrets.
- Compare against prior numbers after major dependency or routing changes.

## Next decisions

1. Check Vercel project **Build Machine** settings and billing before requesting a fixed Enhanced machine; do **not** silently enable a paid resource tier.
2. For future OOM failures, capture actual Vercel build machine size, cache restored/skipped, first failure timestamp, and whether the failing step is compilation, type checking or page generation. Compare against successful builds.
3. Test a Vercel standard-size build with a fresh cache (without changing production settings) if a safe per-deployment capability is available, to separate cache effects from RAM effects.
4. If repeated Standard 8 GB failures continue but 16 GB consistently succeeds, review Enhanced Build pricing and decide whether predictable releases justify the extra cost.
5. Only after Vercel-specific peak memory data identifies a costly route or dependency, optimize that import/build workload. Do not remove essential app modules or safety checks speculatively.

## Safety

This investigation and the manual workflow add no new notification endpoints, alter no access controls, and do not touch user records. The production build command continues to run its pre-existing database migration guards.
