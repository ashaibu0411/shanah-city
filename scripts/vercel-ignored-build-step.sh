#!/usr/bin/env bash
# Vercel Ignored Build Step for project "shanah-city".
# Exit 1 → build proceeds. Exit 0 → deployment CANCELED (ignored).
#
# Configure in Vercel → shanah-city → Settings → Git → Ignored Build Step:
#   bash scripts/vercel-ignored-build-step.sh
#
# Or rely on ignoreCommand in vercel.json (same script).
set -euo pipefail

REF="${VERCEL_GIT_COMMIT_REF:-}"
ENV="${VERCEL_ENV:-}"

echo "vercel-ignored-build-step: VERCEL_ENV=${ENV} VERCEL_GIT_COMMIT_REF=${REF}"

# Production deployments always build (main → production).
if [[ "${ENV}" == "production" ]]; then
  echo "✅ production deployment — build"
  exit 1
fi

case "${REF}" in
  main|staging)
    echo "✅ protected branch — build"
    exit 1
    ;;
  feature/premium-homepage-v4)
    # Owner-approved temporary preview for Premium Homepage V4 review (PR #163).
    echo "✅ allowed preview branch — build"
    exit 1
    ;;
  *)
    echo "⏭ other preview branch — skip (save build minutes)"
    exit 0
    ;;
esac