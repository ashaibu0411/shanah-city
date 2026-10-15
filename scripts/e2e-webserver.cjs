const { spawn } = require("child_process");
const path = require("path");

const port = process.env.E2E_PORT || "3099";
const dataDir = path.join(process.cwd(), ".e2e-isolated", "data");

const env = { ...process.env };
delete env.DATABASE_URL;
delete env.DIRECT_URL;
delete env.DIRECT_DATABASE_URL;
Object.assign(env, {
  PORT: port,
  NODE_ENV: "test",
  MARRIAGE_E2E_ISOLATED: "1",
  AUTH_DATA_DIR: dataDir,
  GROUPS_DATA_DIR: dataDir,
  MARRIAGE_COUNSELING_DATA_FILE: path.join(dataDir, "marriage-counseling.json"),
  MARRIAGE_CURRICULUM_DATA_FILE: path.join(dataDir, "marriage-curriculum.json"),
  MARRIAGE_COUNSELOR_USER_IDS: "marriage-e2e-counselor",
  MARRIAGE_HUB_STAGE2_ENABLED: "1",
  NEXT_PUBLIC_MARRIAGE_STAGE2: "1",
});

const child = spawn("npx", ["next", "dev", "-p", port], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
