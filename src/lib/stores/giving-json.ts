import { promises as fs } from "fs";
import path from "path";
import type { GivingFund, GivingMethod, GivingRecord } from "@/lib/giving-types";
import { normalizeGivingEmail } from "@/lib/giving-types";

const DATA_DIR = path.join(process.cwd(), "data");
const GIVING_FILE = path.join(DATA_DIR, "giving-records.json");

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

async function readRecords() {
  return readJson<GivingRecord[]>(GIVING_FILE, []);
}

function sortRecords(records: GivingRecord[]) {
  return [...records].sort(
    (left, right) =>
      right.givenOn.localeCompare(left.givenOn) ||
      right.createdAt.localeCompare(left.createdAt),
  );
}

export async function listGivingRecords(options?: {
  since?: string;
  until?: string;
  userId?: string;
  fund?: string;
  donorEmail?: string;
  guestsOnly?: boolean;
}) {
  let records = sortRecords(await readRecords());

  if (options?.since) {
    records = records.filter((record) => record.givenOn >= options.since!);
  }
  if (options?.until) {
    records = records.filter((record) => record.givenOn <= options.until!);
  }
  if (options?.userId) {
    records = records.filter((record) => record.userId === options.userId);
  }
  if (options?.fund) {
    records = records.filter((record) => record.fund === options.fund);
  }
  const donorEmail = normalizeGivingEmail(options?.donorEmail);
  if (donorEmail) {
    records = records.filter(
      (record) => normalizeGivingEmail(record.donorEmail) === donorEmail,
    );
  }
  if (options?.guestsOnly) {
    records = records.filter((record) => !record.userId);
  }

  return records;
}

export async function createGivingRecord(input: {
  userId?: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency?: string;
  fund: GivingFund;
  method: GivingMethod;
  givenOn: string;
  campusId?: string;
  notes?: string;
  source?: GivingRecord["source"];
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  recordedBy: string;
  recordedByName: string;
}) {
  const records = await readRecords();
  const now = new Date().toISOString();
  const record: GivingRecord = {
    id: `give-${Date.now()}`,
    userId: input.userId,
    donorName: input.donorName,
    donorEmail: normalizeGivingEmail(input.donorEmail),
    amount: input.amount,
    currency: input.currency ?? "USD",
    fund: input.fund,
    method: input.method,
    givenOn: input.givenOn,
    campusId: input.campusId,
    notes: input.notes,
    source: input.source ?? "manual",
    stripeSessionId: input.stripeSessionId,
    stripeInvoiceId: input.stripeInvoiceId,
    recordedBy: input.recordedBy,
    recordedByName: input.recordedByName,
    thankYouSentAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  records.push(record);
  await writeJson(GIVING_FILE, records);
  return record;
}

export async function updateGivingRecord(
  id: string,
  update: Partial<
    Pick<
      GivingRecord,
      | "userId"
      | "donorName"
      | "donorEmail"
      | "amount"
      | "fund"
      | "method"
      | "givenOn"
      | "campusId"
      | "notes"
    >
  >,
) {
  const records = await readRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;

  records[index] = {
    ...records[index],
    ...update,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(GIVING_FILE, records);
  return records[index];
}

export async function deleteGivingRecord(id: string) {
  const records = await readRecords();
  const next = records.filter((record) => record.id !== id);
  if (next.length === records.length) return false;
  await writeJson(GIVING_FILE, next);
  return true;
}

export async function getGivingRecordById(id: string) {
  const records = await readRecords();
  return records.find((record) => record.id === id) ?? null;
}

export async function markThankYouSent(id: string) {
  const records = await readRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  records[index] = {
    ...records[index],
    thankYouSentAt: now,
    updatedAt: now,
  };
  await writeJson(GIVING_FILE, records);
  return records[index];
}

export async function getGivingRecordByStripeSessionId(stripeSessionId: string) {
  const records = await readRecords();
  return records.find((record) => record.stripeSessionId === stripeSessionId) ?? null;
}

export async function getGivingRecordByStripeInvoiceId(stripeInvoiceId: string) {
  const records = await readRecords();
  return records.find((record) => record.stripeInvoiceId === stripeInvoiceId) ?? null;
}

export async function linkGivingRecordsToUser(email: string, userId: string) {
  const donorEmail = normalizeGivingEmail(email);
  if (!donorEmail) return 0;

  const records = await readRecords();
  let linked = 0;

  for (const record of records) {
    if (record.userId) continue;
    if (normalizeGivingEmail(record.donorEmail) !== donorEmail) continue;
    record.userId = userId;
    record.updatedAt = new Date().toISOString();
    linked += 1;
  }

  if (linked > 0) {
    await writeJson(GIVING_FILE, records);
  }

  return linked;
}
