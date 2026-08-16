import { prisma } from "@/lib/db";
import type { FinanceCountCell, FinanceWeeklySheet } from "@/lib/finance-types";
import { mergeFinanceGrid, normalizeFinanceLines, sumFinanceLines } from "@/lib/finance-types";

function parseLines(value: unknown): FinanceCountCell[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (cell): cell is FinanceCountCell =>
        typeof cell === "object" &&
        cell !== null &&
        typeof (cell as FinanceCountCell).fund === "string" &&
        typeof (cell as FinanceCountCell).method === "string" &&
        typeof (cell as FinanceCountCell).amount === "number",
    )
    .map((cell) => ({
      fund: cell.fund,
      method: cell.method,
      amount: cell.amount,
    }));
}

function mapSheet(record: {
  id: string;
  weekEnding: string;
  lines: unknown;
  notes: string | null;
  totalAmount: number;
  status: string;
  submittedAt: Date | null;
  submittedBy: string | null;
  submittedByName: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): FinanceWeeklySheet {
  return {
    id: record.id,
    weekEnding: record.weekEnding,
    lines: mergeFinanceGrid(parseLines(record.lines)),
    notes: record.notes ?? undefined,
    totalAmount: record.totalAmount,
    status: record.status as FinanceWeeklySheet["status"],
    submittedAt: record.submittedAt?.toISOString(),
    submittedBy: record.submittedBy ?? undefined,
    submittedByName: record.submittedByName ?? undefined,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listFinanceSheets(options?: {
  since?: string;
  until?: string;
  status?: FinanceWeeklySheet["status"];
}) {
  const where: {
    weekEnding?: { gte?: string; lte?: string };
    status?: string;
  } = {};

  if (options?.since || options?.until) {
    where.weekEnding = {};
    if (options.since) where.weekEnding.gte = options.since;
    if (options.until) where.weekEnding.lte = options.until;
  }

  if (options?.status) {
    where.status = options.status;
  }

  const records = await prisma.financeWeeklySheet.findMany({
    where,
    orderBy: { weekEnding: "desc" },
  });

  return records.map(mapSheet);
}

export async function getFinanceSheetByWeek(weekEnding: string) {
  const record = await prisma.financeWeeklySheet.findUnique({ where: { weekEnding } });
  return record ? mapSheet(record) : null;
}

export async function saveFinanceSheet(input: {
  weekEnding: string;
  lines: FinanceCountCell[];
  notes?: string;
  status: FinanceWeeklySheet["status"];
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const normalized = normalizeFinanceLines(input.lines);
  const totalAmount = sumFinanceLines(normalized);
  const existing = await prisma.financeWeeklySheet.findUnique({
    where: { weekEnding: input.weekEnding },
  });

  if (existing?.status === "submitted" && input.status === "draft") {
    throw new Error("This week is already submitted. Admin can reopen it first.");
  }

  const data = {
    lines: normalized,
    notes: input.notes ?? null,
    totalAmount,
    status: input.status,
    updatedAt: now,
    submittedAt: input.status === "submitted" ? now : existing?.submittedAt ?? null,
    submittedBy: input.status === "submitted" ? input.actor.id : existing?.submittedBy ?? null,
    submittedByName:
      input.status === "submitted" ? input.actor.name : existing?.submittedByName ?? null,
  };

  if (existing) {
    const record = await prisma.financeWeeklySheet.update({
      where: { id: existing.id },
      data,
    });
    return mapSheet(record);
  }

  const record = await prisma.financeWeeklySheet.create({
    data: {
      id: `finance-${Date.now()}`,
      weekEnding: input.weekEnding,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
      ...data,
    },
  });

  return mapSheet(record);
}

export async function reopenFinanceSheet(weekEnding: string) {
  const existing = await prisma.financeWeeklySheet.findUnique({ where: { weekEnding } });
  if (!existing) return null;

  const record = await prisma.financeWeeklySheet.update({
    where: { id: existing.id },
    data: {
      status: "draft",
      submittedAt: null,
      submittedBy: null,
      submittedByName: null,
      updatedAt: new Date(),
    },
  });

  return mapSheet(record);
}

export async function deleteFinanceSheet(weekEnding: string) {
  try {
    await prisma.financeWeeklySheet.delete({ where: { weekEnding } });
    return true;
  } catch {
    return false;
  }
}
