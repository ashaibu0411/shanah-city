import { promises as fs } from "fs";
import path from "path";
import type { GivingFund, GivingMethod, GivingRecord } from "@/lib/giving-types";

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
    donorEmail: input.donorEmail,
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

export async function getGivingRecordByStripeSessionId(stripeSessionId: string) {
  const records = await readRecords();
  return records.find((record) => record.stripeSessionId === stripeSessionId) ?? null;
}

export async function getGivingRecordByStripeInvoiceId(stripeInvoiceId: string) {
  const records = await readRecords();
  return records.find((record) => record.stripeInvoiceId === stripeInvoiceId) ?? null;
}
