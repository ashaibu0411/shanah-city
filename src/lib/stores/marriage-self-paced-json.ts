/**
 * JSON-file fallback for self-paced review (local dev / isolated tests).
 */
import { promises as fs } from "fs";
import path from "path";
import type {
  MarriageSelfPacedSessionReviewRecord,
  MarriageSessionClarificationMessageRecord,
} from "@/lib/marriage-self-paced-types";

const FILE =
  process.env.MARRIAGE_SELF_PACED_DATA_FILE?.trim() ||
  path.join(process.cwd(), "data", "marriage-self-paced.json");

type FileShape = {
  reviews: MarriageSelfPacedSessionReviewRecord[];
  clarifications: MarriageSessionClarificationMessageRecord[];
  deliveryModeAudits: unknown[];
  sessionAudits: unknown[];
};

async function readFile(): Promise<FileShape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as FileShape;
  } catch {
    return { reviews: [], clarifications: [], deliveryModeAudits: [], sessionAudits: [] };
  }
}

async function writeFile(data: FileShape) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function getSelfPacedSessionReview(journeyId: string, sessionKey: string) {
  const data = await readFile();
  return (
    data.reviews.find((r) => r.journeyId === journeyId && r.sessionKey === sessionKey) ?? null
  );
}

export async function listSelfPacedSessionReviewsForJourney(journeyId: string) {
  const data = await readFile();
  return data.reviews.filter((r) => r.journeyId === journeyId);
}

export async function listSelfPacedReviewsForCounselor(counselorUserId: string) {
  const { listJourneysForCounselor } = await import("@/lib/stores/marriage-counseling-json");
  const journeys = await listJourneysForCounselor(counselorUserId);
  const ids = new Set(journeys.map((j) => j.id));
  const data = await readFile();
  return data.reviews.filter((r) => ids.has(r.journeyId));
}

export async function saveSelfPacedSessionReview(record: MarriageSelfPacedSessionReviewRecord) {
  const data = await readFile();
  const idx = data.reviews.findIndex(
    (r) => r.journeyId === record.journeyId && r.sessionKey === record.sessionKey,
  );
  if (idx >= 0) data.reviews[idx] = record;
  else data.reviews.push(record);
  await writeFile(data);
  return record;
}

export async function appendSelfPacedSessionAudit() {
  /* audit optional in JSON mode */
}

export async function appendCounselingDeliveryModeAudit() {
  /* audit optional in JSON mode */
}

export async function listClarificationMessages(journeyId: string, sessionKey: string) {
  const data = await readFile();
  return data.clarifications.filter((m) => m.journeyId === journeyId && m.sessionKey === sessionKey);
}

export async function saveClarificationMessage(record: MarriageSessionClarificationMessageRecord) {
  const data = await readFile();
  data.clarifications.push(record);
  await writeFile(data);
  return record;
}
