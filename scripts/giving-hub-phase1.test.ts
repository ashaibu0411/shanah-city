import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hubMethodIsPublic } from "../src/lib/giving-hub-server";

assert.equal(
  hubMethodIsPublic({ enabled: false, published: false, verifiedAt: null }),
  false,
);
assert.equal(
  hubMethodIsPublic({ enabled: true, published: true, verifiedAt: new Date() }),
  true,
);
assert.equal(
  hubMethodIsPublic({ enabled: true, published: true, verifiedAt: null }),
  false,
  "published without verifiedAt must fail closed",
);

const memberSync = readFileSync(join(process.cwd(), "src/lib/giving-stripe-member-sync.ts"), "utf8");
assert.doesNotMatch(memberSync, /listCustomerless/i);
assert.doesNotMatch(memberSync, /GivingHubOffPlatform/i);

const adminVerify = readFileSync(
  join(process.cwd(), "src/app/api/admin/giving/hub/methods/verify/route.ts"),
  "utf8",
);
assert.match(adminVerify, /canManageGivingRecords/);

const offPlatformPost = readFileSync(
  join(process.cwd(), "src/lib/giving-hub-offplatform-server.ts"),
  "utf8",
);
assert.doesNotMatch(offPlatformPost, /GivingRecord\.create/);
assert.doesNotMatch(offPlatformPost, /recordGiftFromCheckoutSession/);

const migration = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20261110130000_giving_hub_phase1/migration.sql",
  ),
  "utf8",
);
assert.match(migration, /finance@shanahcityt\.org/);
assert.match(migration, /shanahcenter/);
assert.match(migration, /published" BOOLEAN NOT NULL DEFAULT false/);

console.log("giving-hub-phase1.test.ts OK");
