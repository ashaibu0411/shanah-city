export type GivingFund =
  | "tithe"
  | "offering"
  | "missions"
  | "building"
  | "special"
  | "other";

export type GivingMethod =
  | "zeffy"
  | "paypal"
  | "cashapp"
  | "venmo"
  | "zelle"
  | "cash"
  | "check"
  | "in-person"
  | "website"
  | "other";

export type GivingRecord = {
  id: string;
  userId?: string | null;
  donorName: string;
  donorEmail?: string | null;
  amount: number;
  currency: string;
  fund: GivingFund;
  method: GivingMethod;
  givenOn: string;
  campusId?: string | null;
  notes?: string | null;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
};

export type GivingReportSummary = {
  totalAmount: number;
  count: number;
  byFund: Record<string, number>;
  byMethod: Record<string, number>;
};

export const GIVING_FUND_OPTIONS: { value: GivingFund; label: string }[] = [
  { value: "tithe", label: "Tithe" },
  { value: "offering", label: "Offering" },
  { value: "missions", label: "Missions" },
  { value: "building", label: "Building" },
  { value: "special", label: "Special project" },
  { value: "other", label: "Other" },
];

export const GIVING_METHOD_OPTIONS: { value: GivingMethod; label: string }[] = [
  { value: "zeffy", label: "Zeffy" },
  { value: "paypal", label: "PayPal" },
  { value: "cashapp", label: "Cash App" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "in-person", label: "In person" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

export function fundLabel(fund: string) {
  return GIVING_FUND_OPTIONS.find((option) => option.value === fund)?.label ?? fund;
}

export function methodLabel(method: string) {
  return GIVING_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

export function summarizeGivingRecords(records: GivingRecord[]): GivingReportSummary {
  const byFund: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  let totalAmount = 0;

  for (const record of records) {
    totalAmount += record.amount;
    byFund[record.fund] = (byFund[record.fund] ?? 0) + record.amount;
    byMethod[record.method] = (byMethod[record.method] ?? 0) + record.amount;
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    count: records.length,
    byFund,
    byMethod,
  };
}

export function givingRecordsToCsv(records: GivingRecord[]) {
  const headers = [
    "Date",
    "Donor",
    "Email",
    "Amount",
    "Currency",
    "Fund",
    "Method",
    "Campus",
    "Notes",
    "Recorded by",
    "Recorded at",
  ];

  const rows = records.map((record) => [
    record.givenOn,
    record.donorName,
    record.donorEmail ?? "",
    record.amount.toFixed(2),
    record.currency,
    fundLabel(record.fund),
    methodLabel(record.method),
    record.campusId ?? "",
    record.notes ?? "",
    record.recordedByName,
    record.createdAt,
  ]);

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
