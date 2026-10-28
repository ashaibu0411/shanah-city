import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { E2E_DATA, E2E_USERS } from "./e2e-isolated-data";

type MarriageJsonStore = {
  journeys: Array<{ id: string; counselorUserId?: string | null; [key: string]: unknown }>;
  [key: string]: unknown;
};

/** Assign the E2E counselor directly on an isolated JSON journey (mirrors approved assignment). */
export function assignE2eCounselorToJourney(journeyId: string) {
  const path = join(E2E_DATA, "marriage-counseling.json");
  const store = JSON.parse(readFileSync(path, "utf8")) as MarriageJsonStore;
  const journey = store.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error(`E2E journey not found: ${journeyId}`);
  journey.counselorUserId = E2E_USERS.counselor.id;
  journey.updatedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(store, null, 2));
}
