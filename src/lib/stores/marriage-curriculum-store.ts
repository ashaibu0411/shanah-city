import { useDatabase } from "@/lib/use-database";
import * as json from "@/lib/stores/marriage-curriculum-json";
import * as db from "@/lib/stores/marriage-curriculum-db";

export function marriageCurriculumStore() {
  if (!useDatabase()) return json;
  return { ...json, ...db, seedModulesSnapshot: json.seedModulesSnapshot };
}
