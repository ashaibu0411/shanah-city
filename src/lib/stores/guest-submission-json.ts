import { promises as fs } from "fs";
import path from "path";
import type { GuestSubmission, GuestSubmissionStatus } from "@/lib/frontliners-types";

const DATA_DIR = path.join(process.cwd(), "data");
const GUEST_FILE = path.join(DATA_DIR, "guest-submissions.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function readGuests() {
  return readJson<GuestSubmission[]>(GUEST_FILE, []);
}

export async function listGuestSubmissions(options?: {
  status?: GuestSubmissionStatus;
  limit?: number;
}) {
  let guests = [...(await readGuests())].sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  );
  if (options?.status) {
    guests = guests.filter((guest) => guest.status === options.status);
  }
  if (options?.limit) {
    guests = guests.slice(0, options.limit);
  }
  return guests;
}

export async function addGuestSubmission(input: {
  name: string;
  email?: string;
  phone?: string;
  visitDate?: string;
  serviceTime?: string;
  isFirstVisit?: boolean;
  notes?: string;
}) {
  const guests = await readGuests();
  const guest: GuestSubmission = {
    id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    visitDate: input.visitDate?.trim() || undefined,
    serviceTime: input.serviceTime?.trim() || undefined,
    isFirstVisit: input.isFirstVisit ?? true,
    notes: input.notes?.trim() || undefined,
    status: "new",
    submittedAt: new Date().toISOString(),
  };
  guests.unshift(guest);
  await writeJson(GUEST_FILE, guests);
  return guest;
}

export async function updateGuestSubmission(
  id: string,
  update: {
    status?: GuestSubmissionStatus;
    reviewedBy?: string;
    reviewedByName?: string;
  },
) {
  const guests = await readGuests();
  const index = guests.findIndex((guest) => guest.id === id);
  if (index === -1) return null;

  guests[index] = {
    ...guests[index],
    status: update.status ?? guests[index].status,
    reviewedAt: update.status ? new Date().toISOString() : guests[index].reviewedAt,
    reviewedBy: update.reviewedBy ?? guests[index].reviewedBy,
    reviewedByName: update.reviewedByName ?? guests[index].reviewedByName,
  };
  await writeJson(GUEST_FILE, guests);
  return guests[index];
}
