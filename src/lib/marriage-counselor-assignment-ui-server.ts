import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { getPublicDisplayName } from "@/lib/member-display-name";
import {
  assertSeniorPastor,
  canSubmitCounselorAssignmentRequest,
  isSeniorPastor,
} from "@/lib/marriage-counselor-assignment-authority";
import { getCounselorAssignmentRequestStatus } from "@/lib/marriage-counselor-assignment-request-server";
import {
  filterAdministrativeCoordinatorRoster,
  type AdministrativeCoordinatorRosterRow,
} from "@/lib/marriage-counselor-assignment-ui";
import {
  ASSIGNMENT_LIST_MAX_LIMIT,
  decodeAssignmentListCursor,
  paginateDescendingSortedRecords,
  paginateSortedRecords,
  type AssignmentListQuery,
  type PaginatedRows,
} from "@/lib/marriage-counselor-assignment-list-pagination";
import { assignmentAdminIdsFromEnv } from "@/lib/marriage-journey-administrative-coordinator-policy";
import { listActiveJourneysForAssignmentAdminViewer } from "@/lib/marriage-journey-administrative-coordinator-server";
import {
  resolveAssignedCounselorDisplayName,
  resolveCoupleDisplayNames,
} from "@/lib/marriage-counselor-journey-names";
import type { MarriageCounselorAssignmentRequestRecord } from "@/lib/marriage-counseling-types";
import {
  isPhase3mAssignmentDisplayDiagnosticActive,
} from "@/lib/marriage-phase3m-assignment-display-diagnostic";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

const UNKNOWN_MEMBER_LABEL = "Unknown member";

async function resolveUserDisplayName(userId: string | null | undefined): Promise<string | null> {
  if (!userId?.trim()) return null;
  const user = await getUserById(userId);
  if (!user) return UNKNOWN_MEMBER_LABEL;
  const label = getPublicDisplayName(user).trim();
  const resolved = label || UNKNOWN_MEMBER_LABEL;
  if (isPhase3mAssignmentDisplayDiagnosticActive()) {
    console.info(
      JSON.stringify({
        tag: "phase3m-assignment-display-resolve",
        lookupSucceeded: true,
        nameNonEmpty: Boolean(user.name?.trim()),
        displayNameNonEmpty: Boolean(user.displayName?.trim()),
        publicLabelNonEmpty: Boolean(label),
        resolvedAsUnknown: resolved === UNKNOWN_MEMBER_LABEL,
      }),
    );
  }
  return resolved;
}

export type EnrichedAssignmentRequestRow = {
  request: MarriageCounselorAssignmentRequestRecord;
  journeyId: string;
  coupleNames: string;
  requestedCounselorName: string | null;
  requesterName: string | null;
  previousCounselorName: string | null;
};

async function enrichRequestRow(
  request: MarriageCounselorAssignmentRequestRecord,
): Promise<EnrichedAssignmentRequestRow> {
  const journey = await store().getJourneyById(request.journeyId);
  if (!journey) throw new Error("Journey not found.");
  return {
    request,
    journeyId: journey.id,
    coupleNames: await resolveCoupleDisplayNames(journey),
    requestedCounselorName: await resolveAssignedCounselorDisplayName(
      request.requestedCounselorUserId,
    ),
    requesterName: await resolveUserDisplayName(request.requestedByUserId),
    previousCounselorName: await resolveAssignedCounselorDisplayName(
      request.previousCounselorUserId,
    ),
  };
}

function matchesQueueSearch(row: EnrichedAssignmentRequestRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.coupleNames,
    row.requestedCounselorName ?? "",
    row.requesterName ?? "",
    row.request.requestType,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export async function getCounselorAssignmentUiCapabilities(viewer: PublicMember) {
  const canSubmit = await canSubmitCounselorAssignmentRequest(viewer);
  const canApprove = await isSeniorPastor(viewer);
  return {
    canSubmitRequest: canSubmit,
    canApprove,
    canAccessAdminPage: canSubmit || canApprove,
  };
}

export type AdminJourneyRow = {
  journeyId: string;
  coupleNames: string;
  programType: string;
  activeCounselorUserId: string | null;
  activeCounselorName: string | null;
  workflowStatus: Awaited<ReturnType<typeof getCounselorAssignmentRequestStatus>>;
};

function matchesCoupleSearch(
  input: { coupleNames: string; programType: string; activeCounselorName?: string | null },
  search: string,
) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [input.coupleNames, input.programType, input.activeCounselorName ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export async function listCounselorAssignmentAdminJourneyRowsPaginated(
  viewer: PublicMember,
  query: AssignmentListQuery,
): Promise<PaginatedRows<AdminJourneyRow>> {
  if (!(await canSubmitCounselorAssignmentRequest(viewer)) && !(await isSeniorPastor(viewer))) {
    throw new Error("Not authorized.");
  }
  const journeys = await listActiveJourneysForAssignmentAdminViewer(viewer);
  const rows: AdminJourneyRow[] = [];
  for (const journey of journeys) {
    const coupleNames = await resolveCoupleDisplayNames(journey);
    const status = await getCounselorAssignmentRequestStatus(viewer, journey.id);
    const activeCounselorName = await resolveAssignedCounselorDisplayName(
      status.activeCounselorUserId,
    );
    if (
      !matchesCoupleSearch(
        { coupleNames, programType: journey.programType, activeCounselorName },
        query.search,
      )
    ) {
      continue;
    }
    rows.push({
      journeyId: journey.id,
      coupleNames,
      programType: journey.programType,
      activeCounselorUserId: status.activeCounselorUserId,
      activeCounselorName,
      workflowStatus: status,
    });
  }
  rows.sort((a, b) => {
    const byName = a.coupleNames.localeCompare(b.coupleNames);
    if (byName !== 0) return byName;
    return a.journeyId.localeCompare(b.journeyId);
  });
  return paginateSortedRecords(rows, query.limit, query.cursor, (row) => ({
    k: row.coupleNames.toLowerCase(),
    id: row.journeyId,
  }));
}

export async function listSeniorPastorCounselorApprovalQueuePaginated(
  viewer: PublicMember,
  query: AssignmentListQuery,
): Promise<PaginatedRows<EnrichedAssignmentRequestRow>> {
  await assertSeniorPastor(viewer);
  const pending = await store().listAllPendingCounselorAssignmentRequests();
  const enriched: EnrichedAssignmentRequestRow[] = [];
  for (const request of pending) {
    const row = await enrichRequestRow(request);
    if (matchesQueueSearch(row, query.search)) enriched.push(row);
  }
  return paginateDescendingSortedRecords(enriched, query.limit, query.cursor, (row) => ({
    k: row.request.requestedAt,
    id: row.request.id,
  }));
}

export async function listSeniorPastorCounselorApprovalHistoryPaginated(
  viewer: PublicMember,
  query: AssignmentListQuery,
): Promise<PaginatedRows<EnrichedAssignmentRequestRow>> {
  await assertSeniorPastor(viewer);
  const history = await store().listCounselorAssignmentRequestHistory();
  const enriched: EnrichedAssignmentRequestRow[] = [];
  for (const request of history) {
    const row = await enrichRequestRow(request);
    if (matchesQueueSearch(row, query.search)) enriched.push(row);
  }
  return paginateDescendingSortedRecords(enriched, query.limit, query.cursor, (row) => ({
    k: row.request.reviewedAt ?? row.request.requestedAt,
    id: row.request.id,
  }));
}

export async function listEligibleAssignmentAdmins(viewer: PublicMember) {
  await assertSeniorPastor(viewer);
  const ids = assignmentAdminIdsFromEnv();
  const admins: { userId: string; displayName: string }[] = [];
  for (const userId of ids) {
    if (userId === viewer.id) continue;
    admins.push({
      userId,
      displayName: (await resolveUserDisplayName(userId)) ?? userId,
    });
  }
  admins.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return admins;
}

export async function listSeniorPastorAdministrativeCoordinatorRosterPaginated(
  viewer: PublicMember,
  query: AssignmentListQuery,
): Promise<PaginatedRows<AdministrativeCoordinatorRosterRow>> {
  await assertSeniorPastor(viewer);
  const journeys = await store().listAllActiveJourneys();
  const rows: AdministrativeCoordinatorRosterRow[] = [];
  for (const journey of journeys) {
    const coord = await store().getJourneyAdministrativeCoordinator(journey.id);
    rows.push({
      journeyId: journey.id,
      coupleNames: await resolveCoupleDisplayNames(journey),
      programType: journey.programType,
      coordinatorUserId: coord?.coordinatorUserId ?? null,
      coordinatorName: coord ? await resolveUserDisplayName(coord.coordinatorUserId) : null,
      assignedAt: coord?.assignedAt ?? null,
      assignedByUserId: coord?.assignedByUserId ?? null,
      assignedByName: coord ? await resolveUserDisplayName(coord.assignedByUserId) : null,
    });
  }
  const filtered = filterAdministrativeCoordinatorRoster(rows, {
    search: query.search,
    assignment: query.coordinatorFilter,
  });
  filtered.sort((a, b) => {
    const byName = a.coupleNames.localeCompare(b.coupleNames);
    if (byName !== 0) return byName;
    return a.journeyId.localeCompare(b.journeyId);
  });
  return paginateSortedRecords(filtered, query.limit, query.cursor, (row) => ({
    k: row.coupleNames.toLowerCase(),
    id: row.journeyId,
  }));
}

async function collectAllAssignmentListPages<T>(
  fetchPage: (viewer: PublicMember, query: AssignmentListQuery) => Promise<PaginatedRows<T>>,
  viewer: PublicMember,
  base: Partial<AssignmentListQuery> = {},
): Promise<T[]> {
  const all: T[] = [];
  let cursor = base.cursor ?? null;
  for (;;) {
    const page = await fetchPage(viewer, {
      limit: ASSIGNMENT_LIST_MAX_LIMIT,
      cursor,
      search: base.search ?? "",
      coordinatorFilter: base.coordinatorFilter ?? "all",
    });
    all.push(...page.rows);
    if (!page.pageInfo.nextCursor) break;
    cursor = decodeAssignmentListCursor(page.pageInfo.nextCursor);
    if (!cursor) break;
  }
  return all;
}

/** Test / script helper — walks every page (no silent truncation). */
export async function listCounselorAssignmentAdminJourneyRows(viewer: PublicMember) {
  return collectAllAssignmentListPages(listCounselorAssignmentAdminJourneyRowsPaginated, viewer);
}

export async function listSeniorPastorAdministrativeCoordinatorRoster(viewer: PublicMember) {
  return collectAllAssignmentListPages(
    listSeniorPastorAdministrativeCoordinatorRosterPaginated,
    viewer,
  );
}

export async function listSeniorPastorCounselorApprovalQueue(viewer: PublicMember) {
  return collectAllAssignmentListPages(listSeniorPastorCounselorApprovalQueuePaginated, viewer);
}

export async function listSeniorPastorCounselorApprovalHistory(viewer: PublicMember) {
  return collectAllAssignmentListPages(listSeniorPastorCounselorApprovalHistoryPaginated, viewer);
}
