import { promises as fs } from "fs";
import path from "path";
import type { CoupleLinkRecord, CoupleLinkStatus } from "@/lib/couple-link-types";
import { normalizeCoupleUserIds } from "@/lib/couple-link-utils";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-links.json");

async function readLinks() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CoupleLinkRecord[];
  } catch {
    return [];
  }
}

async function writeLinks(links: CoupleLinkRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(links, null, 2));
}

export async function getCoupleLinksForUser(userId: string) {
  const links = await readLinks();
  return links
    .filter((link) => link.userAId === userId || link.userBId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getActiveCoupleLinkForUser(userId: string) {
  const links = await getCoupleLinksForUser(userId);
  return links.find((link) => link.status === "active") ?? null;
}

export async function createCoupleLink(input: {
  userAId: string;
  userBId: string;
  requestedBy: string;
}) {
  const links = await readLinks();
  const [userAId, userBId] = normalizeCoupleUserIds(input.userAId, input.userBId);
  const record: CoupleLinkRecord = {
    id: `couple-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userAId,
    userBId,
    requestedBy: input.requestedBy,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  links.push(record);
  await writeLinks(links);
  return record;
}

export async function updateCoupleLinkStatus(
  id: string,
  status: CoupleLinkStatus,
  acceptedAt?: string | null,
) {
  const links = await readLinks();
  const index = links.findIndex((link) => link.id === id);
  if (index === -1) throw new Error("Link not found.");
  links[index] = {
    ...links[index],
    status,
    acceptedAt:
      status === "active" ? acceptedAt ?? new Date().toISOString() : undefined,
  };
  await writeLinks(links);
  return links[index];
}

export async function deleteCoupleLink(id: string) {
  const links = await readLinks();
  await writeLinks(links.filter((link) => link.id !== id));
}

export async function getCoupleLinkById(id: string) {
  const links = await readLinks();
  return links.find((link) => link.id === id) ?? null;
}
