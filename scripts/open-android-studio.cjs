const { execSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const androidDir = path.join(repoRoot, "android");

function isValidAndroidStudioRoot(installRoot) {
  return (
    fs.existsSync(path.join(installRoot, "product-info.json")) ||
    fs.existsSync(path.join(installRoot, "plugins"))
  );
}

function findAndroidStudioInstalls() {
  const installs = [];
  const explicit =
    process.env.CAPACITOR_ANDROID_STUDIO_PATH ||
    process.env.ANDROID_STUDIO_PATH;

  if (explicit) {
    const exe = explicit.endsWith(".exe")
      ? explicit
      : path.join(explicit, "bin", "studio64.exe");
    if (fs.existsSync(exe)) {
      installs.push(path.dirname(path.dirname(exe)));
    }
  }

  const searchRoots = [
    "C:\\Program Files\\Android",
    "C:\\Program Files (x86)\\Android",
    path.join(process.env.LOCALAPPDATA || "", "Programs"),
  ];

  for (const root of searchRoots) {
    if (!fs.existsSync(root)) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!/android studio/i.test(entry.name)) continue;
      installs.push(path.join(root, entry.name));
    }
  }

  return [...new Set(installs)]
    .filter(isValidAndroidStudioRoot)
    .map((root) => ({
      root,
      exe: path.join(root, "bin", "studio64.exe"),
    }))
    .filter((entry) => fs.existsSync(entry.exe));
}

function openAndroidFolder() {
  try {
    execSync(`explorer "${androidDir}"`, { stdio: "ignore", shell: true });
  } catch {
    console.log(`Open this folder manually: ${androidDir}`);
  }
}

const installs = findAndroidStudioInstalls();

if (installs.length === 0) {
  console.error(`
Android Studio was not found, or the install is incomplete.

If Android Studio opens from the Start menu, set this in .env.local and retry:
  CAPACITOR_ANDROID_STUDIO_PATH=C:\\Program Files\\Android\\Android Studio2\\bin\\studio64.exe

Or open the project manually:
  File → Open → ${androidDir}
`);
  openAndroidFolder();
  process.exit(1);
}

const install = installs[0];

console.log(`
Opening Android Studio...

Install: ${install.root}
Project: ${androidDir}
`);

const child = spawn(install.exe, [androidDir], {
  detached: true,
  stdio: "ignore",
  shell: false,
});

child.on("error", (error) => {
  console.error(`Could not launch Android Studio: ${error.message}`);
  console.log(`Open manually: File → Open → ${androidDir}`);
  process.exit(1);
});

child.unref();
