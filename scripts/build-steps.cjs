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

  trackRun("npx next build");
  return { ok: true, invocations };
}

module.exports = {
  executeBuildScript,
};
