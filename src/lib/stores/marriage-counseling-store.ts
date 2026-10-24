/**
 * Unified marriage counseling persistence: Prisma when DATABASE_URL is set, else JSON files.
 */
import { useDatabase } from "@/lib/use-database";
import * as json from "@/lib/stores/marriage-counseling-json";
import * as db from "@/lib/stores/marriage-counseling-db";
import * as homeworkJson from "@/lib/stores/marriage-session-homework-json";
import * as homeworkDb from "@/lib/stores/marriage-session-homework-db";
import * as certificateJson from "@/lib/stores/marriage-certificate-json";
import * as certificateDb from "@/lib/stores/marriage-certificate-db";

export function marriageStore() {
  if (!useDatabase()) return { ...json, ...homeworkJson, ...certificateJson };
  return { ...json, ...homeworkJson, ...certificateJson, ...db, ...homeworkDb, ...certificateDb };
}
