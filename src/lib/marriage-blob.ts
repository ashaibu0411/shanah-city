/**
 * Marriage Prep private Blob credentials — isolated from {@link isBlobConfigured} media storage.
 * Never read BLOB_READ_WRITE_TOKEN here.
 */

export function getMarriageBlobReadWriteToken(): string | null {
  const token = process.env.MARRIAGE_BLOB_READ_WRITE_TOKEN?.trim();
  return token || null;
}

/** Optional when Vercel OIDC + project BLOB_STORE_ID would otherwise override explicit tokens. */
export function getMarriageBlobStoreId(): string | null {
  const storeId = process.env.MARRIAGE_BLOB_STORE_ID?.trim();
  return storeId || null;
}

export function isMarriageBlobConfigured(): boolean {
  return getMarriageBlobReadWriteToken() !== null;
}

/** Options passed to @vercel/blob put/get/del for Marriage Prep private objects only. */
export function marriageBlobRequestOptions(): { token: string; storeId?: string } | null {
  const token = getMarriageBlobReadWriteToken();
  if (!token) return null;
  const storeId = getMarriageBlobStoreId();
  return storeId ? { token, storeId } : { token };
}
