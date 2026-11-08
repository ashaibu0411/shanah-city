const { execSync } = require("child_process");
const { executeBuildScript } = require("./build-steps.cjs");

function run(command, env) {
  execSync(command, { stdio: "inherit", env: env ?? process.env });
}

// Temporary one-time HMG approved audio upload. Never run on preview/staging.
// Remove this hook immediately after production Blob ingest is verified.
if (process.env.VERCEL_ENV === "production") {
  run("node scripts/story-music-hmg-one-time-upload.mjs");
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
