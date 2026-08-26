import { promises as fs } from "fs";
import path from "path";
import {
  getReportTemplateForGroup,
  isReportableMinistryGroup,
  mergeResponses,
  resolveReportTemplateKey,
  validateReportResponses,
  type MinistryLeaderReport,
  type MinistryReportResponses,
  type MinistryReportStatus,
  type MinistryReportSummary,
} from "@/lib/ministry-report-types";
import { getGroups } from "@/lib/group-server";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "ministry-leader-reports.json");

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

async function readReports() {
  return readJson<MinistryLeaderReport[]>(REPORTS_FILE, []);
}

function sortReports(reports: MinistryLeaderReport[]) {
  return [...reports].sort((left, right) => {
    const monthCompare = right.reportMonth.localeCompare(left.reportMonth);
    if (monthCompare !== 0) return monthCompare;
    return left.groupName.localeCompare(right.groupName);
  });
}

function parseResponses(value: unknown): MinistryReportResponses {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const responses: MinistryReportResponses = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number") {
      responses[key] = entry;
    } else if (typeof entry === "string") {
      responses[key] = entry;
    }
  }
  return responses;
}

export async function listMinistryReports(options?: {
  reportMonth?: string;
  groupId?: string;
  status?: MinistryReportStatus;
  since?: string;
  until?: string;
}) {
  let reports = sortReports(await readReports());

  if (options?.reportMonth) {
    reports = reports.filter((report) => report.reportMonth === options.reportMonth);
  }
  if (options?.groupId) {
    reports = reports.filter((report) => report.groupId === options.groupId);
  }
  if (options?.status) {
    reports = reports.filter((report) => report.status === options.status);
  }
  if (options?.since) {
    reports = reports.filter((report) => report.reportMonth >= options.since!);
  }
  if (options?.until) {
    reports = reports.filter((report) => report.reportMonth <= options.until!);
  }

  return reports.map((report) => ({
    ...report,
    responses: parseResponses(report.responses),
  }));
}

export async function getMinistryReport(reportMonth: string, groupId: string) {
  const reports = await readReports();
  const report = reports.find(
    (entry) => entry.reportMonth === reportMonth && entry.groupId === groupId,
  );
  return report ? { ...report, responses: parseResponses(report.responses) } : null;
}

export async function saveMinistryReport(input: {
  reportMonth: string;
  groupId: string;
  groupName: string;
  responses: MinistryReportResponses;
  leaderNotes?: string;
  status: MinistryReportStatus;
  actor: { id: string; name: string };
}) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === input.groupId);
  const template = group
    ? getReportTemplateForGroup(group)
    : getReportTemplateForGroup({ id: input.groupId, name: input.groupName });
  const templateKey = group
    ? resolveReportTemplateKey(group)
    : resolveReportTemplateKey({ id: input.groupId, name: input.groupName });
  const responses = mergeResponses(template, input.responses);

  if (input.status === "submitted") {
    validateReportResponses(template, responses);
  }

  const reports = await readReports();
  const index = reports.findIndex(
    (entry) => entry.reportMonth === input.reportMonth && entry.groupId === input.groupId,
  );
  const now = new Date().toISOString();

  if (index >= 0) {
    const existing = reports[index];
    if (existing.status === "submitted" && input.status === "draft") {
      throw new Error("This report is already submitted.");
    }
    if (existing.status === "reviewed" && input.status !== "reviewed") {
      throw new Error("This report has been reviewed. Ask pastoral staff to return it for edits.");
    }

    reports[index] = {
      ...existing,
      groupName: input.groupName,
      templateKey,
      responses,
      leaderNotes: input.leaderNotes,
      status: input.status,
      updatedAt: now,
      submittedAt:
        input.status === "submitted"
          ? now
          : input.status === "draft"
            ? undefined
            : existing.submittedAt,
      submittedBy:
        input.status === "submitted"
          ? input.actor.id
          : input.status === "draft"
            ? undefined
            : existing.submittedBy,
      submittedByName:
        input.status === "submitted"
          ? input.actor.name
          : input.status === "draft"
            ? undefined
            : existing.submittedByName,
    };
    await writeJson(REPORTS_FILE, reports);
    return reports[index];
  }

  const report: MinistryLeaderReport = {
    id: `ministry-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reportMonth: input.reportMonth,
    groupId: input.groupId,
    groupName: input.groupName,
    templateKey,
    responses,
    leaderNotes: input.leaderNotes,
    status: input.status,
    submittedAt: input.status === "submitted" ? now : undefined,
    submittedBy: input.status === "submitted" ? input.actor.id : undefined,
    submittedByName: input.status === "submitted" ? input.actor.name : undefined,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
    createdAt: now,
    updatedAt: now,
  };

  reports.push(report);
  await writeJson(REPORTS_FILE, reports);
  return report;
}

export async function reviewMinistryReport(input: {
  reportMonth: string;
  groupId: string;
  action: "review" | "return";
  reviewerNotes?: string;
  actionSteps?: string;
  actor: { id: string; name: string };
}) {
  const reports = await readReports();
  const index = reports.findIndex(
    (entry) => entry.reportMonth === input.reportMonth && entry.groupId === input.groupId,
  );
  if (index === -1) return null;

  const existing = reports[index];
  if (existing.status !== "submitted" && existing.status !== "reviewed" && existing.status !== "returned") {
    throw new Error("Only submitted reports can be reviewed.");
  }

  const now = new Date().toISOString();
  reports[index] = {
    ...existing,
    status: input.action === "review" ? "reviewed" : "returned",
    reviewerNotes: input.reviewerNotes ?? existing.reviewerNotes,
    actionSteps: input.actionSteps ?? existing.actionSteps,
    reviewedAt: now,
    reviewedBy: input.actor.id,
    reviewedByName: input.actor.name,
    updatedAt: now,
  };

  await writeJson(REPORTS_FILE, reports);
  return reports[index];
}

export async function summarizeMinistryReports(reportMonth: string): Promise<MinistryReportSummary> {
  const [reports, groups] = await Promise.all([
    listMinistryReports({ reportMonth }),
    getGroups(),
  ]);

  const reportableGroups = groups.filter((group) => isReportableMinistryGroup(group));
  const reportMap = new Map(reports.map((report) => [report.groupId, report]));

  const rows = reportableGroups.map((group) => {
    const report = reportMap.get(group.id);
    if (!report) {
      return {
        groupId: group.id,
        groupName: group.name,
        status: "missing" as const,
      };
    }
    return {
      groupId: group.id,
      groupName: group.name,
      status: report.status,
      submittedAt: report.submittedAt,
      submittedByName: report.submittedByName,
    };
  });

  const submitted = rows.filter(
    (row) => row.status === "submitted" || row.status === "reviewed" || row.status === "returned",
  ).length;
  const reviewed = rows.filter((row) => row.status === "reviewed").length;
  const missing = rows.filter((row) => row.status === "missing").length;

  return {
    reportMonth,
    total: rows.length,
    submitted,
    reviewed,
    missing,
    groups: rows.sort((left, right) => left.groupName.localeCompare(right.groupName)),
  };
}
