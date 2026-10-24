/**
 * Unified marriage counseling persistence: Prisma when DATABASE_URL is set, else JSON files.
 */
import { useDatabase } from "@/lib/use-database";
import * as json from "@/lib/stores/marriage-counseling-json";
import * as db from "@/lib/stores/marriage-counseling-db";
import * as homeworkJson from "@/lib/stores/marriage-session-homework-json";
import * as homeworkDb from "@/lib/stores/marriage-session-homework-db";

export function marriageStore() {
  if (!useDatabase()) return { ...json, ...homeworkJson };
  return { ...json, ...homeworkJson, ...db, ...homeworkDb };
}
