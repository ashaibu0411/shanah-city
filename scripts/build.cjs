const { execSync } = require("child_process");

function run(command, env) {
  execSync(command, { stdio: "inherit", env: env ?? process.env });
}

function getDirectDatabaseUrl() {
  if (process.env.DIRECT_URL?.trim()) {
    return process.env.DIRECT_URL.trim();
  }
  if (process.env.DIRECT_DATABASE_URL?.trim()) {
    return process.env.DIRECT_DATABASE_URL.trim();
  }

  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) {
    return null;
  }
  if (pooled.includes("-pooler.")) {
    return pooled.replace("-pooler.", ".");
  }
  if (pooled.includes("-pooler")) {
    return pooled.replace("-pooler", "");
  }
  return pooled;
}

const directUrl = getDirectDatabaseUrl();
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
