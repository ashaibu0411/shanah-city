import { randomBytes } from "crypto";

/** Unique id for household rows (avoids duplicate-key failures when adding quickly). */
export function createFamilyMemberId() {
  return `fam-${Date.now()}-${randomBytes(4).toString("hex")}`;
}
