import type { AssignmentListPageInfo } from "@/lib/marriage-counselor-assignment-list-pagination";
import type { CoordinatorRosterFilter } from "@/lib/marriage-counselor-assignment-ui";

export type AssignmentListFetchParams = {
  search?: string;
  cursor?: string | null;
  coordinatorFilter?: CoordinatorRosterFilter;
  limit?: number;
};

export function buildCounselorAssignmentListUrl(
  view: string,
  params: AssignmentListFetchParams = {},
): string {
  const qs = new URLSearchParams({ view });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.coordinatorFilter && params.coordinatorFilter !== "all") {
    qs.set("coordinatorFilter", params.coordinatorFilter);
  }
  if (params.limit) qs.set("limit", String(params.limit));
  return `/api/marriage/counselor/assignment-requests?${qs.toString()}`;
}

export type AssignmentListResponse<T> = {
  rows: T[];
  pageInfo: AssignmentListPageInfo;
};
