# Vercel Ignored Build Step — shanah-city

## Symptom

GitHub shows **Vercel – shanah-city** with `Canceled by Ignored Build Step` for feature branches. Staging (`shanah-city-staging`) may still deploy.

## Current policy (repo)

Script: [`scripts/vercel-ignored-build-step.sh`](../scripts/vercel-ignored-build-step.sh), referenced from [`vercel.json`](../vercel.json) as `ignoreCommand`.

| Condition | Exit | Result |
|-----------|------|--------|
| `VERCEL_ENV=production` | 1 | Build (production) |
| Branch `main` or `staging` | 1 | Build |
| Branch `feature/premium-homepage-v4` | 1 | Build (owner preview for PR #163) |
| Any other preview branch | 0 | Canceled (ignored) |

To allow another one-off preview branch, add a `case` arm in the script and remove it after review — do not leave `*` → build (wastes minutes).

## Dashboard sync (shanah-city project)

1. [Vercel → shanah-city → Settings → Git → Ignored Build Step](https://vercel.com/zaqnombre-9816s-projects/shanah-city/settings/git)
2. Choose **Run my Bash script**
3. Command: `bash scripts/vercel-ignored-build-step.sh`
4. Save (must match `vercel.json` `ignoreCommand`)

Staging project may use a different rule; this doc applies only to **shanah-city** (production Git connection).

## Redeploy after changing the script

Push to the branch or **Redeploy** from the Vercel deployment page. The script runs from the commit being deployed.