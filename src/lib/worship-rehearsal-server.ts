import type { WorshipRehearsalRecording } from "@/lib/worship-types";
import {
  addWorshipRehearsalRecording,
  deleteWorshipRehearsalRecording,
  getWorshipRehearsalRecording,
  listWorshipRehearsalRecordings,
} from "@/lib/stores/worship-rehearsal-json";

export function createRehearsalRecordingId() {
  return `rehearsal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getRehearsalRecordings(serviceDate: string, serviceTime: string) {
  return listWorshipRehearsalRecordings({ serviceDate, serviceTime });
}

export async function saveRehearsalRecording(recording: WorshipRehearsalRecording) {
  return addWorshipRehearsalRecording(recording);
}

export async function removeRehearsalRecording(id: string) {
  return deleteWorshipRehearsalRecording(id);
}

export async function findRehearsalRecording(id: string) {
  return getWorshipRehearsalRecording(id);
}
