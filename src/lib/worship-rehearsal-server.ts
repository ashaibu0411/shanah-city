import type { WorshipRehearsalRecording } from "@/lib/worship-types";
import * as rehearsalDb from "@/lib/stores/worship-rehearsal-db";
import * as rehearsalJson from "@/lib/stores/worship-rehearsal-json";
import { useDatabase } from "@/lib/use-database";

const store = () => (useDatabase() ? rehearsalDb : rehearsalJson);

export function createRehearsalRecordingId() {
  return `rehearsal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getRehearsalRecordings(serviceDate: string, serviceTime: string) {
  return store().listWorshipRehearsalRecordings({ serviceDate, serviceTime });
}

export async function saveRehearsalRecording(recording: WorshipRehearsalRecording) {
  return store().addWorshipRehearsalRecording(recording);
}

export async function removeRehearsalRecording(id: string) {
  return store().deleteWorshipRehearsalRecording(id);
}

export async function findRehearsalRecording(id: string) {
  return store().getWorshipRehearsalRecording(id);
}
