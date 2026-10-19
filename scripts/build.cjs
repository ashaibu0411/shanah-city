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
