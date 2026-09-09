import { promises as fs } from "fs";
import path from "path";
import type { CoupleMentorRequestRecord } from "@/lib/couple-mentor-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-mentor-requests.json");

async function readRequests() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CoupleMentorRequestRecord[];
  } catch {
    return [];
  }
}

async function writeRequests(requests: CoupleMentorRequestRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(requests, null, 2));
}

export async function getMentorRequestById(id: string) {
  const requests = await readRequests();
  return requests.find((entry) => entry.id === id) ?? null;
}

export async function getOpenMentorRequestForCouple(coupleLinkId: string) {
  const requests = await readRequests();
  return (
    requests.find(
      (entry) =>
        entry.coupleLinkId === coupleLinkId &&
        (entry.status === "open" || entry.status === "matched"),
    ) ?? null
  );
}

export async function listMentorRequestsForCoupleLinks(coupleLinkIds: string[]) {
  const requests = await readRequests();
  return requests
    .filter((entry) => coupleLinkIds.includes(entry.coupleLinkId))
    .sort(
      (a, b) =>
        a.status.localeCompare(b.status) || b.createdAt.localeCompare(a.createdAt),
    );
}

export async function createMentorRequest(input: {
  coupleLinkId: string;
  requesterId: string;
  requesterName: string;
  note?: string;
}) {
  const requests = await readRequests();
  const now = new Date().toISOString();
  const record: CoupleMentorRequestRecord = {
    id: `mentor-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    note: input.note?.trim() || undefined,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  requests.push(record);
  await writeRequests(requests);
  return record;
}

export async function matchMentorRequest(input: {
  id: string;
  mentorLinkId: string;
  matchedBy: string;
  matchedByName: string;
}) {
  const requests = await readRequests();
  const index = requests.findIndex((entry) => entry.id === input.id);
  if (index === -1) throw new Error("Request not found.");
  requests[index] = {
    ...requests[index],
    status: "matched",
    mentorLinkId: input.mentorLinkId,
    matchedBy: input.matchedBy,
    matchedByName: input.matchedByName,
    matchedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeRequests(requests);
  return requests[index];
}

export async function closeMentorRequest(id: string) {
  const requests = await readRequests();
  const index = requests.findIndex((entry) => entry.id === id);
  if (index === -1) throw new Error("Request not found.");
  requests[index] = {
    ...requests[index],
    status: "closed",
    updatedAt: new Date().toISOString(),
  };
  await writeRequests(requests);
  return requests[index];
}
