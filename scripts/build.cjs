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

// One-time verified AudioDollar upload: production catalog must not go live
// until the source-matched MP3 is securely stored in Vercel Blob.
if (process.env.VERCEL_ENV === "production") {
  try {
    run("node scripts/story-music-audiodollar-one-time-upload.mjs");
  } catch (error) {
    console.error("AudioDollar production audio upload blocked the release.", error);
    process.exit(1);
  }
}
