const { execSync } = require("child_process");
const { executeBuildScript } = require("./build-steps.cjs");

function run(command, env) {
  execSync(command, { stdio: "inherit", env: env ?? process.env });
}

const result = executeBuildScript(process.env, {
  run,
  failBuild(error) {
    console.error(
      error instanceof Error ? error.message : "Build migration guard failed.",
    );
    process.exit(1);
  },
});

if (!result.ok) {
  process.exit(1);
}

// One-time rollout: production must upload and verify all nine new
// CC BY 4.0 audio files BEFORE Vercel marks this catalog release ready.
// This script is idempotent and fails the deployment closed on any error.
// Remove this build hook after successful production verification.
if (process.env.VERCEL_ENV === "production") {
  try {
    run("node scripts/story-music-troy-one-time-upload.mjs");
  } catch (error) {
    console.error("Modern Christian music audio upload failed; keeping prior production release.", error);
    process.exit(1);
  }
}
