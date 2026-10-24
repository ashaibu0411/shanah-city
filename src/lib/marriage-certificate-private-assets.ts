import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const PRIVATE_PREFIX = "private://signatures/";
const SIGNATURES_DIR =
  process.env.MARRIAGE_CERTIFICATE_SIGNATURES_DIR?.trim() ||
  path.join(process.cwd(), "data", "marriage-private", "signatures");

export function isPrivateSignaturePath(assetPath: string | null | undefined) {
  return Boolean(assetPath?.startsWith(PRIVATE_PREFIX));
}

export async function savePrivateSignaturePng(bytes: Buffer) {
  await mkdir(SIGNATURES_DIR, { recursive: true });
  const fileName = `${randomUUID()}.png`;
  const absolute = path.join(SIGNATURES_DIR, fileName);
  await writeFile(absolute, bytes);
  return `${PRIVATE_PREFIX}${fileName}`;
}

export async function readPrivateSignatureBytes(assetPath: string | null | undefined) {
  if (!isPrivateSignaturePath(assetPath)) return null;
  const fileName = assetPath!.slice(PRIVATE_PREFIX.length);
  if (!fileName || fileName.includes("..")) return null;
  try {
    return await readFile(path.join(SIGNATURES_DIR, fileName));
  } catch {
    return null;
  }
}

export async function deletePrivateSignatureFile(assetPath: string | null | undefined) {
  if (!isPrivateSignaturePath(assetPath)) return;
  const fileName = assetPath!.slice(PRIVATE_PREFIX.length);
  if (!fileName || fileName.includes("..")) return;
  try {
    await unlink(path.join(SIGNATURES_DIR, fileName));
  } catch {
    /* already removed */
  }
}
