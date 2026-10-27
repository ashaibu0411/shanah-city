import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, get, put } from "@vercel/blob";
import {
  isMarriageBlobConfigured,
  marriageBlobRequestOptions,
} from "@/lib/marriage-blob";

/** Logical refs only — never expose blob URLs to clients or logs. */
export const PRIVATE_BLOB_REF_PREFIX = "private://blob/";
export const PRIVATE_LOCAL_SIGNATURE_PREFIX = "private://signatures/";
export const PRIVATE_LOCAL_ISSUED_PREFIX = "private://issued/";

const LOCAL_SIGNATURES_DIR =
  process.env.MARRIAGE_CERTIFICATE_SIGNATURES_DIR?.trim() ||
  path.join(process.cwd(), "data", "marriage-private", "signatures");

const LOCAL_ISSUED_PDF_DIR =
  process.env.MARRIAGE_CERTIFICATE_ISSUED_PDF_DIR?.trim() ||
  path.join(process.cwd(), "data", "marriage-private", "issued-certificates");

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_MAGIC = Buffer.from("%PDF");

export function isProductionMarriageStorageContext() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

/** True when signature / issued PDF writes are allowed in this environment. */
export function isMarriagePrivateStorageWritable() {
  if (isMarriageBlobConfigured()) return true;
  return !isProductionMarriageStorageContext();
}

export function marriagePrivateStorageConfigHint() {
  return (
    "Configure MARRIAGE_BLOB_READ_WRITE_TOKEN on Vercel (dedicated Private Blob store for Marriage Prep, read-write token). " +
    "When the project also sets BLOB_STORE_ID for public media, set MARRIAGE_BLOB_STORE_ID to the marriage store id. " +
    "Signature and issued certificate files use private access and are retrieved only via authenticated server routes."
  );
}

export function assertMarriagePrivateStorageWritable() {
  if (isMarriagePrivateStorageWritable()) return;
  throw new Error(`Private marriage storage is not configured. ${marriagePrivateStorageConfigHint()}`);
}

export function isPrivateBlobRef(assetPath: string | null | undefined) {
  return Boolean(assetPath?.startsWith(PRIVATE_BLOB_REF_PREFIX));
}

export function isPrivateLocalSignatureRef(assetPath: string | null | undefined) {
  return Boolean(assetPath?.startsWith(PRIVATE_LOCAL_SIGNATURE_PREFIX));
}

export function isPrivateLocalIssuedRef(assetPath: string | null | undefined) {
  return Boolean(assetPath?.startsWith(PRIVATE_LOCAL_ISSUED_PREFIX));
}

export function isPrivateMarriageAssetRef(assetPath: string | null | undefined) {
  return (
    isPrivateBlobRef(assetPath) ||
    isPrivateLocalSignatureRef(assetPath) ||
    isPrivateLocalIssuedRef(assetPath)
  );
}

export function validatePngSignatureBytes(bytes: Buffer, maxBytes: number) {
  if (bytes.length > maxBytes) throw new Error("Signature image is too large.");
  if (bytes.length < PNG_MAGIC.length || !bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    throw new Error("Signature must be a valid PNG image.");
  }
}

function blobPathnameFromRef(ref: string) {
  if (!isPrivateBlobRef(ref)) return null;
  const pathname = ref.slice(PRIVATE_BLOB_REF_PREFIX.length);
  if (!pathname || pathname.includes("..")) return null;
  return pathname;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value?.length) chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function marriageBlobAuthOptions() {
  const auth = marriageBlobRequestOptions();
  if (!auth) return null;
  return auth;
}

export async function savePrivateMarriagePngSignature(bytes: Buffer) {
  validatePngSignatureBytes(bytes, 2 * 1024 * 1024);
  assertMarriagePrivateStorageWritable();

  const blobAuth = marriageBlobAuthOptions();
  if (blobAuth) {
    const pathname = `marriage/private/signatures/${randomUUID()}.png`;
    await put(pathname, bytes, {
      ...blobAuth,
      access: "private",
      contentType: "image/png",
      addRandomSuffix: false,
    });
    return `${PRIVATE_BLOB_REF_PREFIX}${pathname}`;
  }

  await mkdir(LOCAL_SIGNATURES_DIR, { recursive: true });
  const fileName = `${randomUUID()}.png`;
  await writeFile(path.join(LOCAL_SIGNATURES_DIR, fileName), bytes);
  return `${PRIVATE_LOCAL_SIGNATURE_PREFIX}${fileName}`;
}

export async function savePrivateIssuedFinalCertificatePdf(certificateId: string, bytes: Buffer) {
  if (bytes.length < PDF_MAGIC.length || !bytes.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    throw new Error("Issued certificate artifact must be a PDF.");
  }
  if (bytes.length > 8 * 1024 * 1024) throw new Error("Issued certificate PDF is too large.");
  assertMarriagePrivateStorageWritable();

  const blobAuth = marriageBlobAuthOptions();
  if (blobAuth) {
    const pathname = `marriage/private/certificates/final/${certificateId}.pdf`;
    await put(pathname, bytes, {
      ...blobAuth,
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    return `${PRIVATE_BLOB_REF_PREFIX}${pathname}`;
  }

  await mkdir(LOCAL_ISSUED_PDF_DIR, { recursive: true });
  const fileName = `${certificateId}.pdf`;
  await writeFile(path.join(LOCAL_ISSUED_PDF_DIR, fileName), bytes);
  return `${PRIVATE_LOCAL_ISSUED_PREFIX}${fileName}`;
}

export async function readPrivateMarriageAssetBytes(assetPath: string | null | undefined) {
  if (!assetPath?.trim()) return null;

  if (isPrivateLocalIssuedRef(assetPath)) {
    const fileName = assetPath.slice(PRIVATE_LOCAL_ISSUED_PREFIX.length);
    if (!fileName || fileName.includes("..")) return null;
    try {
      return await readFile(path.join(LOCAL_ISSUED_PDF_DIR, fileName));
    } catch {
      return null;
    }
  }

  const blobPath = blobPathnameFromRef(assetPath);
  if (blobPath) {
    const blobAuth = marriageBlobAuthOptions();
    if (!blobAuth) return null;
    try {
      const result = await get(blobPath, {
        ...blobAuth,
        access: "private",
        useCache: false,
      });
      if (!result || result.statusCode !== 200 || !result.stream) return null;
      return await streamToBuffer(result.stream);
    } catch {
      return null;
    }
  }

  if (isPrivateLocalSignatureRef(assetPath)) {
    const fileName = assetPath.slice(PRIVATE_LOCAL_SIGNATURE_PREFIX.length);
    if (!fileName || fileName.includes("..")) return null;
    try {
      return await readFile(path.join(LOCAL_SIGNATURES_DIR, fileName));
    } catch {
      return null;
    }
  }

  return null;
}

export async function deletePrivateMarriageAsset(assetPath: string | null | undefined) {
  if (!assetPath?.trim()) return;

  if (isPrivateLocalIssuedRef(assetPath)) {
    const fileName = assetPath.slice(PRIVATE_LOCAL_ISSUED_PREFIX.length);
    if (!fileName || fileName.includes("..")) return;
    try {
      await unlink(path.join(LOCAL_ISSUED_PDF_DIR, fileName));
    } catch {
      /* gone */
    }
    return;
  }

  const blobPath = blobPathnameFromRef(assetPath);
  if (blobPath) {
    const blobAuth = marriageBlobAuthOptions();
    if (!blobAuth) return;
    try {
      await del(blobPath, blobAuth);
    } catch {
      /* gone */
    }
    return;
  }

  if (isPrivateLocalSignatureRef(assetPath)) {
    const fileName = assetPath.slice(PRIVATE_LOCAL_SIGNATURE_PREFIX.length);
    if (!fileName || fileName.includes("..")) return;
    try {
      await unlink(path.join(LOCAL_SIGNATURES_DIR, fileName));
    } catch {
      /* gone */
    }
  }
}
