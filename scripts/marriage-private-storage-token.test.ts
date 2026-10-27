import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const marriageBlobSrc = readFileSync(join(root, "src/lib/marriage-blob.ts"), "utf8");
const marriageStorageSrc = readFileSync(join(root, "src/lib/marriage-private-storage.ts"), "utf8");
const useBlobSrc = readFileSync(join(root, "src/lib/use-blob.ts"), "utf8");

assert.doesNotMatch(
  marriageBlobSrc,
  /process\.env\.BLOB_READ_WRITE_TOKEN/,
  "marriage blob module must not read media token env",
);
assert.doesNotMatch(marriageStorageSrc, /isBlobConfigured/, "marriage storage must not use media blob gate");
assert.doesNotMatch(marriageStorageSrc, /from "@\/lib\/use-blob"/, "marriage storage must not import use-blob");
assert.match(marriageStorageSrc, /marriageBlobRequestOptions\(\)/, "marriage storage uses marriage blob options");
assert.match(marriageStorageSrc, /\.\.\.blobAuth/, "put/get spread marriage blob auth options");
assert.match(marriageStorageSrc, /await del\(blobPath, blobAuth\)/, "delete passes marriage blob auth");
assert.match(marriageStorageSrc, /if \(!blobAuth\) return null/, "missing marriage creds fail closed on read");
assert.match(marriageStorageSrc, /MARRIAGE_BLOB_READ_WRITE_TOKEN/, "config hint names marriage token");

assert.match(useBlobSrc, /BLOB_READ_WRITE_TOKEN/, "public media blob helper unchanged");

async function main() {
  process.env.MARRIAGE_BLOB_READ_WRITE_TOKEN = "marriage-rw-token-test";
  process.env.BLOB_READ_WRITE_TOKEN = "media-rw-token-test";
  delete process.env.MARRIAGE_BLOB_STORE_ID;

  const {
    isMarriageBlobConfigured,
    marriageBlobRequestOptions,
    getMarriageBlobReadWriteToken,
  } = await import("../src/lib/marriage-blob.ts");

  assert.equal(isMarriageBlobConfigured(), true);
  assert.equal(getMarriageBlobReadWriteToken(), "marriage-rw-token-test");
  assert.deepEqual(marriageBlobRequestOptions(), { token: "marriage-rw-token-test" });

  process.env.MARRIAGE_BLOB_STORE_ID = "store_marriage_test";
  assert.deepEqual(marriageBlobRequestOptions(), {
    token: "marriage-rw-token-test",
    storeId: "store_marriage_test",
  });

  delete process.env.MARRIAGE_BLOB_READ_WRITE_TOKEN;
  assert.equal(isMarriageBlobConfigured(), false);
  assert.equal(marriageBlobRequestOptions(), null);

  process.env.NODE_ENV = "production";
  process.env.VERCEL = "1";
  process.env.BLOB_READ_WRITE_TOKEN = "media-rw-token-test";

  const { isMarriagePrivateStorageWritable, readPrivateMarriageAssetBytes } = await import(
    "../src/lib/marriage-private-storage.ts"
  );

  assert.equal(
    isMarriagePrivateStorageWritable(),
    false,
    "production must not treat media token as marriage storage",
  );
  assert.equal(
    await readPrivateMarriageAssetBytes("private://blob/marriage/private/signatures/test.png"),
    null,
    "missing marriage token must not read private blob refs",
  );

  console.log("marriage-private-storage-token.test.ts: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
