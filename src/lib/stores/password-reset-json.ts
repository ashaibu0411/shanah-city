import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const TOKENS_FILE = path.join(process.cwd(), "data", "password-reset-tokens.json");

export type PasswordResetRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function createPasswordResetToken(userId: string) {
  const tokens = await readJson<PasswordResetRecord[]>(TOKENS_FILE, []);
  const now = Date.now();
  const active = tokens.filter(
    (record) => record.userId !== userId && new Date(record.expiresAt).getTime() > now,
  );

  const token = randomBytes(32).toString("hex");
  const record: PasswordResetRecord = {
    id: `reset-${Date.now()}`,
    userId,
    token,
    expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now).toISOString(),
  };

  active.unshift(record);
  await writeJson(TOKENS_FILE, active.slice(0, 200));
  return record;
}

export async function consumePasswordResetToken(token: string) {
  const tokens = await readJson<PasswordResetRecord[]>(TOKENS_FILE, []);
  const index = tokens.findIndex((record) => record.token === token);
  if (index === -1) return null;

  const record = tokens[index];
  if (new Date(record.expiresAt) < new Date()) {
    tokens.splice(index, 1);
    await writeJson(TOKENS_FILE, tokens);
    return null;
  }

  tokens.splice(index, 1);
  await writeJson(TOKENS_FILE, tokens);
  return record;
}

export async function deletePasswordResetTokensForUser(userId: string) {
  const tokens = await readJson<PasswordResetRecord[]>(TOKENS_FILE, []);
  await writeJson(
    TOKENS_FILE,
    tokens.filter((record) => record.userId !== userId),
  );
}
