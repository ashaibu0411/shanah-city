export const FINANCE_GROUP_ID = "group-finance";

export const FINANCE_COUNT_FUNDS = [
  { key: "tithe", label: "Tithe" },
  { key: "offering", label: "Offering" },
  { key: "missions", label: "Missions" },
  { key: "special", label: "Special / other" },
] as const;

export const FINANCE_COUNT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "check", label: "Check" },
  { key: "zelle", label: "Zelle" },
  { key: "venmo", label: "Venmo" },
  { key: "paypal", label: "PayPal" },
  { key: "cashapp", label: "Cash App" },
  { key: "online", label: "Online (Zeffy / card)" },
] as const;

export type FinanceCountFund = (typeof FINANCE_COUNT_FUNDS)[number]["key"];
export type FinanceCountMethod = (typeof FINANCE_COUNT_METHODS)[number]["key"];

export type FinanceCountCell = {
  fund: FinanceCountFund;
  method: FinanceCountMethod;
  amount: number;
};

export type FinanceWeeklySheet = {
  id: string;
  weekEnding: string;
  lines: FinanceCountCell[];
  notes?: string | null;
  totalAmount: number;
  status: "draft" | "submitted";
  submittedAt?: string | null;
  submittedBy?: string | null;
  submittedByName?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceWeeklySummary = {
  totalAmount: number;
  sheetCount: number;
  byFund: Record<string, number>;
  byMethod: Record<string, number>;
};

export function emptyFinanceGrid(): FinanceCountCell[] {
  const lines: FinanceCountCell[] = [];
  for (const fund of FINANCE_COUNT_FUNDS) {
    for (const method of FINANCE_COUNT_METHODS) {
      lines.push({ fund: fund.key, method: method.key, amount: 0 });
    }
  }
  return lines;
}

export function mergeFinanceGrid(existing?: FinanceCountCell[]) {
  const map = new Map<string, number>();
  for (const cell of existing ?? []) {
    map.set(`${cell.fund}:${cell.method}`, cell.amount);
  }

  return emptyFinanceGrid().map((cell) => ({
    ...cell,
    amount: map.get(`${cell.fund}:${cell.method}`) ?? 0,
  }));
}

export function normalizeFinanceLines(lines: FinanceCountCell[]) {
  return mergeFinanceGrid(lines).filter((cell) => cell.amount > 0);
}

export function sumFinanceLines(lines: FinanceCountCell[]) {
  const total = lines.reduce((sum, cell) => sum + (cell.amount || 0), 0);
  return Math.round(total * 100) / 100;
}

export function summarizeFinanceSheets(sheets: FinanceWeeklySheet[]): FinanceWeeklySummary {
  const byFund: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  let totalAmount = 0;

  for (const sheet of sheets) {
    totalAmount += sheet.totalAmount;
    for (const cell of sheet.lines) {
      byFund[cell.fund] = (byFund[cell.fund] ?? 0) + cell.amount;
      byMethod[cell.method] = (byMethod[cell.method] ?? 0) + cell.amount;
    }
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    sheetCount: sheets.length,
    byFund,
    byMethod,
  };
}

export function financeFundLabel(key: string) {
  return FINANCE_COUNT_FUNDS.find((fund) => fund.key === key)?.label ?? key;
}

export function financeMethodLabel(key: string) {
  return FINANCE_COUNT_METHODS.find((method) => method.key === key)?.label ?? key;
}

export function financeSheetsToCsv(sheets: FinanceWeeklySheet[]) {
  const headers = [
    "Week ending",
    "Status",
    "Fund",
    "Method",
    "Amount",
    "Notes",
    "Submitted by",
    "Submitted at",
  ];

  const rows: string[][] = [];
  for (const sheet of sheets) {
    const grid = mergeFinanceGrid(sheet.lines);
    for (const cell of grid) {
      if (cell.amount <= 0) continue;
      rows.push([
        sheet.weekEnding,
        sheet.status,
        financeFundLabel(cell.fund),
        financeMethodLabel(cell.method),
        cell.amount.toFixed(2),
        sheet.notes ?? "",
        sheet.submittedByName ?? sheet.createdByName,
        sheet.submittedAt ?? "",
      ]);
    }
    if (sheet.lines.every((cell) => cell.amount <= 0)) {
      rows.push([
        sheet.weekEnding,
        sheet.status,
        "",
        "",
        "0.00",
        sheet.notes ?? "",
        sheet.submittedByName ?? sheet.createdByName,
        sheet.submittedAt ?? "",
      ]);
    }
  }

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    )
    .join("\n");
}

export function mostRecentSundayIso(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
