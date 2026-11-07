const {
  enforceStagingMigrateGuardIfNeeded,
  enforceProductionMigrateGuardIfNeeded,
  isVercelPreviewBuild,
  resolvePrismaMigrateDeployPlan,
} = require("./build-migrate-guard.cjs");

/**
 * Vercel build migrate + next orchestration (testable; no subprocesses by default).
 * @param {NodeJS.ProcessEnv} env
 * @param {{ run: (command: string, runEnv?: NodeJS.ProcessEnv) => void, failBuild: (error: unknown) => void }} deps
 */
function executeBuildScript(env, { run, failBuild }) {
  const invocations = [];

  const trackRun = (command, runEnv) => {
    invocations.push({
      command,
      runEnv: runEnv ? { ...runEnv } : undefined,
    });
    run(command, runEnv);
  };

  if (!isVercelPreviewBuild(env)) {
    try {
      enforceStagingMigrateGuardIfNeeded(env);
    } catch (error) {
      failBuild(error);
      return { ok: false, invocations, failedAt: "staging_guard" };
    }

    try {
      enforceProductionMigrateGuardIfNeeded(env);
    } catch (error) {
      failBuild(error);
      return { ok: false, invocations, failedAt: "production_guard" };
    }

    const migratePlan = resolvePrismaMigrateDeployPlan(env);
    if (migratePlan.run) {
      if (migratePlan.mode === "direct") {
        trackRun("npx prisma migrate deploy", {
          ...env,
          DATABASE_URL: migratePlan.directUrl,
        });
      } else {
        trackRun("npx prisma migrate deploy");
      }
    }
  }

  // One isolated staging acceptance run; never enabled on the Shanah City production project.
  // These tests use mocked AI responses and synthetic permission data only.
  if (env.ASK_SHEPHERD_STAGING_ACCEPTANCE === "1") {
    trackRun("npm run test:ask-shepherd");
    trackRun("npm run test:app:nav");
    trackRun("npm run test:temperament:shepherding");
  }

  trackRun("npx next build");
  return { ok: true, invocations };
}

module.exports = {
  executeBuildScript,
};
