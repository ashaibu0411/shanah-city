import { promises as fs } from "fs";
import path from "path";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

/** Committed JSON under `data/` in the deployment bundle (read-only on Vercel). */
export function bundledDataDir() {
  return BUNDLED_DATA_DIR;
}

/** Writable store: local `data/`, or `/tmp` on serverless so reads/writes do not touch EROFS paths. */
export function writableDataDir() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "shanah-city-data");
  }
  return BUNDLED_DATA_DIR;
}

export function isReadOnlyFilesystemError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /EROFS|read-only file system/i.test(message);
}

export async function readJsonFromData<T>(filename: string, fallback: T): Promise<T> {
  const dirs = [writableDataDir(), BUNDLED_DATA_DIR];
  const tried = new Set<string>();
  for (const dir of dirs) {
    const file = path.join(dir, filename);
    if (tried.has(file)) continue;
    tried.add(file);
    try {
      const raw = await fs.readFile(file, "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      continue;
    }
  }
  return fallback;
}

export async function writeJsonToData<T>(filename: string, data: T): Promise<void> {
  const dir = writableDataDir();
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, filename);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}
