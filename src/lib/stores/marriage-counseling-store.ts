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
import * as selfPacedJson from "@/lib/stores/marriage-self-paced-json";
import * as selfPacedDb from "@/lib/stores/marriage-self-paced-db";

export function marriageStore() {
  if (!useDatabase())
    return { ...json, ...homeworkJson, ...certificateJson, ...selfPacedJson };
  return {
    ...json,
    ...homeworkJson,
    ...certificateJson,
    ...selfPacedJson,
    ...db,
    ...homeworkDb,
    ...certificateDb,
    ...selfPacedDb,
  };
}
