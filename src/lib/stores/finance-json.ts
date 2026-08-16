import { promises as fs } from "fs";
import path from "path";
import type { FinanceCountCell, FinanceWeeklySheet } from "@/lib/finance-types";
import { mergeFinanceGrid, normalizeFinanceLines, sumFinanceLines } from "@/lib/finance-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FINANCE_FILE = path.join(DATA_DIR, "finance-weekly-sheets.json");

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

async function readSheets() {
  return readJson<FinanceWeeklySheet[]>(FINANCE_FILE, []);
}

function sortSheets(sheets: FinanceWeeklySheet[]) {
  return [...sheets].sort((left, right) => right.weekEnding.localeCompare(left.weekEnding));
}

export async function listFinanceSheets(options?: {
  since?: string;
  until?: string;
  status?: FinanceWeeklySheet["status"];
}) {
  let sheets = sortSheets(await readSheets());

  if (options?.since) {
    sheets = sheets.filter((sheet) => sheet.weekEnding >= options.since!);
  }
  if (options?.until) {
    sheets = sheets.filter((sheet) => sheet.weekEnding <= options.until!);
  }
  if (options?.status) {
    sheets = sheets.filter((sheet) => sheet.status === options.status);
  }

  return sheets.map((sheet) => ({
    ...sheet,
    lines: mergeFinanceGrid(sheet.lines),
  }));
}

export async function getFinanceSheetByWeek(weekEnding: string) {
  const sheets = await readSheets();
  const sheet = sheets.find((entry) => entry.weekEnding === weekEnding);
  return sheet ? { ...sheet, lines: mergeFinanceGrid(sheet.lines) } : null;
}

export async function saveFinanceSheet(input: {
  weekEnding: string;
  lines: FinanceCountCell[];
  notes?: string;
  status: FinanceWeeklySheet["status"];
  actor: { id: string; name: string };
}) {
  const sheets = await readSheets();
  const index = sheets.findIndex((sheet) => sheet.weekEnding === input.weekEnding);
  const now = new Date().toISOString();
  const normalized = normalizeFinanceLines(input.lines);
  const totalAmount = sumFinanceLines(normalized);

  if (index >= 0 && sheets[index].status === "submitted" && input.status === "draft") {
    throw new Error("This week is already submitted. Admin can reopen it first.");
  }

  if (index >= 0) {
    const existing = sheets[index];
    sheets[index] = {
      ...existing,
      lines: normalized,
      notes: input.notes,
      totalAmount,
      status: input.status,
      updatedAt: now,
      submittedAt: input.status === "submitted" ? now : existing.submittedAt,
      submittedBy: input.status === "submitted" ? input.actor.id : existing.submittedBy,
      submittedByName:
        input.status === "submitted" ? input.actor.name : existing.submittedByName,
    };
    await writeJson(FINANCE_FILE, sheets);
    return { ...sheets[index], lines: mergeFinanceGrid(sheets[index].lines) };
  }

  const sheet: FinanceWeeklySheet = {
    id: `finance-${Date.now()}`,
    weekEnding: input.weekEnding,
    lines: normalized,
    notes: input.notes,
    totalAmount,
    status: input.status,
    submittedAt: input.status === "submitted" ? now : undefined,
    submittedBy: input.status === "submitted" ? input.actor.id : undefined,
    submittedByName: input.status === "submitted" ? input.actor.name : undefined,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
    createdAt: now,
    updatedAt: now,
  };

  sheets.push(sheet);
  await writeJson(FINANCE_FILE, sheets);
  return { ...sheet, lines: mergeFinanceGrid(sheet.lines) };
}

export async function reopenFinanceSheet(weekEnding: string) {
  const sheets = await readSheets();
  const index = sheets.findIndex((sheet) => sheet.weekEnding === weekEnding);
  if (index === -1) return null;

  sheets[index] = {
    ...sheets[index],
    status: "draft",
    submittedAt: undefined,
    submittedBy: undefined,
    submittedByName: undefined,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(FINANCE_FILE, sheets);
  return { ...sheets[index], lines: mergeFinanceGrid(sheets[index].lines) };
}

export async function deleteFinanceSheet(weekEnding: string) {
  const sheets = await readSheets();
  const next = sheets.filter((sheet) => sheet.weekEnding !== weekEnding);
  if (next.length === sheets.length) return false;
  await writeJson(FINANCE_FILE, next);
  return true;
}
