/** True when server can read/write Vercel Blob (requires read-write token, not store id alone). */
export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function useBlobStorage() {
  return isBlobConfigured();
}
