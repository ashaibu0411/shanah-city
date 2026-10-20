const { spawn } = require("child_process");
const path = require("path");

const port = process.env.E2E_PORT || "3099";
const dataDir = path.join(process.cwd(), ".e2e-isolated", "data");

const env = { ...process.env };
Object.assign(env, {
  PORT: port,
  E2E_PORT: port,
  NODE_ENV: "test",
  MARRIAGE_E2E_ISOLATED: "1",
  SHANAH_MARRIAGE_E2E_LOCAL: "1",
  MARRIAGE_E2E_BIND_HOST: "127.0.0.1",
  SHANAH_E2E_DISABLE_DATABASE: "1",
  AUTH_DATA_DIR: dataDir,
  GROUPS_DATA_DIR: dataDir,
  MARRIAGE_COUNSELING_DATA_FILE: path.join(dataDir, "marriage-counseling.json"),
  MARRIAGE_CURRICULUM_DATA_FILE: path.join(dataDir, "marriage-curriculum.json"),
  DATABASE_URL: "",
  DIRECT_URL: "",
  DIRECT_DATABASE_URL: "",
  MARRIAGE_COUNSELOR_USER_IDS: "marriage-e2e-counselor",
  MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS:
    "marriage-e2e-admin-a,marriage-e2e-admin-b",
  MARRIAGE_HUB_STAGE2_ENABLED: "1",
  NEXT_PUBLIC_MARRIAGE_STAGE2: "1",
});

const child = spawn("npx", ["next", "dev", "-p", port], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
