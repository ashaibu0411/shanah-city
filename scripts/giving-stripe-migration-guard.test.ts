import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { isMissingRecoveryAuditTableError } from "../src/lib/giving-stripe-recovery-migration-guard";

assert.equal(
  isMissingRecoveryAuditTableError(new Prisma.PrismaClientKnownRequestError("missing", { code: "P2021", clientVersion: "test" })),
  true,
);
assert.equal(
  isMissingRecoveryAuditTableError(new Prisma.PrismaClientKnownRequestError("missing", { code: "P2022", clientVersion: "test" })),
  true,
);
assert.equal(isMissingRecoveryAuditTableError(new Error("other")), false);

import { readFileSync } from "node:fs";
const route = readFileSync("src/app/api/admin/giving/recover/checkout/route.ts", "utf8");
assert.match(route, /isGivingGiftRecoveryAuditTableReady/);
assert.match(route, /503/);

console.log("giving-stripe-migration-guard.test.ts OK");
