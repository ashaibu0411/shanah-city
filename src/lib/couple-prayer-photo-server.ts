import { promises as fs } from "fs";
import path from "path";

const PHOTO_DIR = path.join(process.cwd(), "data", "couple-prayer-photos");
const META_FILE = path.join(PHOTO_DIR, "meta.json");

type PhotoMeta = { id: string; coupleLinkId: string; contentType: string; ext: string };

async function readMeta(): Promise<PhotoMeta[]> {
  try {
    return JSON.parse(await fs.readFile(META_FILE, "utf-8")) as PhotoMeta[];
  } catch {
    return [];
  }
}

async function writeMeta(entries: PhotoMeta[]) {
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(entries, null, 2));
}

function filePath(meta: PhotoMeta) {
  return path.join(PHOTO_DIR, `${meta.id}${meta.ext}`);
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveCouplePrayerPhoto(coupleLinkId: string, file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Image must be under 5 MB.");
  }

  const id = `cpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/gif"
          ? ".gif"
          : ".jpg";

  const meta: PhotoMeta = { id, coupleLinkId, contentType: file.type, ext };
  const entries = await readMeta();
  entries.push(meta);
  await writeMeta(entries);
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(filePath(meta), Buffer.from(bytes));
  return id;
}

export async function readCouplePrayerPhoto(coupleLinkId: string, photoKey: string) {
  const entries = await readMeta();
  const meta = entries.find((e) => e.id === photoKey);
  if (!meta || meta.coupleLinkId !== coupleLinkId) return null;
  try {
    const buffer = await fs.readFile(filePath(meta));
    return { buffer, contentType: meta.contentType };
  } catch {
    return null;
  }
}
