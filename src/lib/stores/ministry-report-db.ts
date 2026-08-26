import { prisma } from "@/lib/db";
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

function mapReport(record: {
  id: string;
  reportMonth: string;
  groupId: string;
  groupName: string;
  templateKey: string;
  responses: unknown;
  leaderNotes: string | null;
  status: string;
  submittedAt: Date | null;
  submittedBy: string | null;
  submittedByName: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewerNotes: string | null;
  actionSteps: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): MinistryLeaderReport {
  return {
    id: record.id,
    reportMonth: record.reportMonth,
    groupId: record.groupId,
    groupName: record.groupName,
    templateKey: record.templateKey,
    responses: parseResponses(record.responses),
    leaderNotes: record.leaderNotes ?? undefined,
    status: record.status as MinistryReportStatus,
    submittedAt: record.submittedAt?.toISOString(),
    submittedBy: record.submittedBy ?? undefined,
    submittedByName: record.submittedByName ?? undefined,
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy ?? undefined,
    reviewedByName: record.reviewedByName ?? undefined,
    reviewerNotes: record.reviewerNotes ?? undefined,
    actionSteps: record.actionSteps ?? undefined,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listMinistryReports(options?: {
  reportMonth?: string;
  groupId?: string;
  status?: MinistryReportStatus;
  since?: string;
  until?: string;
}) {
  const where: {
    reportMonth?: string | { gte?: string; lte?: string };
    groupId?: string;
    status?: string;
  } = {};

  if (options?.reportMonth) {
    where.reportMonth = options.reportMonth;
  } else if (options?.since || options?.until) {
    where.reportMonth = {};
    if (options.since) where.reportMonth.gte = options.since;
    if (options.until) where.reportMonth.lte = options.until;
  }

  if (options?.groupId) where.groupId = options.groupId;
  if (options?.status) where.status = options.status;

  const records = await prisma.ministryLeaderReport.findMany({
    where,
    orderBy: [{ reportMonth: "desc" }, { groupName: "asc" }],
  });

  return records.map(mapReport);
}

export async function getMinistryReport(reportMonth: string, groupId: string) {
  const record = await prisma.ministryLeaderReport.findUnique({
    where: {
      reportMonth_groupId: { reportMonth, groupId },
    },
  });
  return record ? mapReport(record) : null;
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

  const now = new Date();
  const existing = await prisma.ministryLeaderReport.findUnique({
    where: {
      reportMonth_groupId: {
        reportMonth: input.reportMonth,
        groupId: input.groupId,
      },
    },
  });

  if (existing?.status === "submitted" && input.status === "draft") {
    throw new Error("This report is already submitted.");
  }
  if (existing?.status === "reviewed" && input.status !== "reviewed") {
    throw new Error("This report has been reviewed. Ask pastoral staff to return it for edits.");
  }

  const data = {
    groupName: input.groupName,
    templateKey,
    responses,
    leaderNotes: input.leaderNotes ?? null,
    status: input.status,
    updatedAt: now,
    submittedAt: input.status === "submitted" ? now : input.status === "draft" ? null : existing?.submittedAt ?? null,
    submittedBy:
      input.status === "submitted" ? input.actor.id : input.status === "draft" ? null : existing?.submittedBy ?? null,
    submittedByName:
      input.status === "submitted"
        ? input.actor.name
        : input.status === "draft"
          ? null
          : existing?.submittedByName ?? null,
  };

  if (existing) {
    const record = await prisma.ministryLeaderReport.update({
      where: { id: existing.id },
      data,
    });
    return mapReport(record);
  }

  const record = await prisma.ministryLeaderReport.create({
    data: {
      id: `ministry-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reportMonth: input.reportMonth,
      groupId: input.groupId,
      ...data,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
    },
  });

  return mapReport(record);
}

export async function reviewMinistryReport(input: {
  reportMonth: string;
  groupId: string;
  action: "review" | "return";
  reviewerNotes?: string;
  actionSteps?: string;
  actor: { id: string; name: string };
}) {
  const existing = await prisma.ministryLeaderReport.findUnique({
    where: {
      reportMonth_groupId: {
        reportMonth: input.reportMonth,
        groupId: input.groupId,
      },
    },
  });

  if (!existing) return null;

  if (
    existing.status !== "submitted" &&
    existing.status !== "reviewed" &&
    existing.status !== "returned"
  ) {
    throw new Error("Only submitted reports can be reviewed.");
  }

  const now = new Date();
  const record = await prisma.ministryLeaderReport.update({
    where: { id: existing.id },
    data: {
      status: input.action === "review" ? "reviewed" : "returned",
      reviewerNotes: input.reviewerNotes ?? existing.reviewerNotes,
      actionSteps: input.actionSteps ?? existing.actionSteps,
      reviewedAt: now,
      reviewedBy: input.actor.id,
      reviewedByName: input.actor.name,
      updatedAt: now,
    },
  });

  return mapReport(record);
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
