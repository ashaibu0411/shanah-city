const { execSync } = require("child_process");
const {
  getDirectDatabaseUrl,
  enforceStagingMigrateGuardIfNeeded,
} = require("./build-migrate-guard.cjs");

function run(command, env) {
  execSync(command, { stdio: "inherit", env: env ?? process.env });
}

try {
  enforceStagingMigrateGuardIfNeeded(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Staging migrate guard failed.");
  process.exit(1);
}

const directUrl = getDirectDatabaseUrl(process.env);
if (directUrl) {
  run("npx prisma migrate deploy", {
    ...process.env,
    DATABASE_URL: directUrl,
  });
} else if (process.env.DATABASE_URL?.trim()) {
  run("npx prisma migrate deploy");
} else {
  console.log("Skipping prisma migrate deploy (DATABASE_URL not set).");
}

run("npx next build");
