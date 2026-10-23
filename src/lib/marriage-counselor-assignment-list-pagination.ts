import type { CoordinatorRosterFilter } from "@/lib/marriage-counselor-assignment-ui";

export const ASSIGNMENT_LIST_DEFAULT_LIMIT = 25;
export const ASSIGNMENT_LIST_MAX_LIMIT = 50;

export type AssignmentListSortCursor = {
  /** Primary sort key (ISO timestamp or normalized label). */
  k: string;
  /** Stable tie-breaker (record id). */
  id: string;
};

export type AssignmentListPageInfo = {
  totalCount: number;
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  /** True when the client has loaded every matching record. */
  allRecordsLoaded: boolean;
};

export type AssignmentListQuery = {
  limit: number;
  cursor: AssignmentListSortCursor | null;
  search: string;
  coordinatorFilter: CoordinatorRosterFilter;
};

export type PaginatedRows<T> = {
  rows: T[];
  pageInfo: AssignmentListPageInfo;
};

export function encodeAssignmentListCursor(cursor: AssignmentListSortCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAssignmentListCursor(raw: string | null | undefined): AssignmentListSortCursor | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(Buffer.from(trimmed, "base64url").toString("utf8")) as AssignmentListSortCursor;
    if (!parsed?.k || !parsed?.id) return null;
    return { k: String(parsed.k), id: String(parsed.id) };
  } catch {
    return null;
  }
}

export function parseAssignmentListQuery(searchParams: URLSearchParams): AssignmentListQuery {
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), ASSIGNMENT_LIST_MAX_LIMIT)
    : ASSIGNMENT_LIST_DEFAULT_LIMIT;
  const coordinatorRaw = searchParams.get("coordinatorFilter")?.trim().toLowerCase();
  const coordinatorFilter: CoordinatorRosterFilter =
    coordinatorRaw === "assigned" || coordinatorRaw === "unassigned" ? coordinatorRaw : "all";
  return {
    limit,
    cursor: decodeAssignmentListCursor(searchParams.get("cursor")),
    search: searchParams.get("search")?.trim() ?? "",
    coordinatorFilter,
  };
}

export function compareAssignmentSortKeys(a: AssignmentListSortCursor, b: AssignmentListSortCursor): number {
  const byK = a.k.localeCompare(b.k);
  if (byK !== 0) return byK;
  return a.id.localeCompare(b.id);
}

/** Stable ascending pagination (use descending sort keys in caller when needed). */
export function paginateSortedRecords<T>(
  sortedAsc: T[],
  limit: number,
  cursor: AssignmentListSortCursor | null,
  keyOf: (row: T) => AssignmentListSortCursor,
): PaginatedRows<T> {
  const totalCount = sortedAsc.length;
  let startIndex = 0;
  if (cursor) {
    startIndex = sortedAsc.findIndex((row) => {
      const keys = keyOf(row);
      return compareAssignmentSortKeys(keys, cursor) > 0;
    });
    if (startIndex === -1) {
      return {
        rows: [],
        pageInfo: {
          totalCount,
          limit,
          hasMore: false,
          nextCursor: null,
          allRecordsLoaded: true,
        },
      };
    }
  }
  const rows = sortedAsc.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + rows.length < totalCount;
  const last = rows.at(-1);
  return {
    rows,
    pageInfo: {
      totalCount,
      limit,
      hasMore,
      nextCursor: hasMore && last ? encodeAssignmentListCursor(keyOf(last)) : null,
      allRecordsLoaded: !hasMore,
    },
  };
}

function compareAssignmentSortKeysDesc(a: AssignmentListSortCursor, b: AssignmentListSortCursor): number {
  return compareAssignmentSortKeys(b, a);
}

/** Descending sort: pass rows sorted high-to-low; cursor walks forward in that order. */
export function paginateDescendingSortedRecords<T>(
  sortedDesc: T[],
  limit: number,
  cursor: AssignmentListSortCursor | null,
  keyOf: (row: T) => AssignmentListSortCursor,
): PaginatedRows<T> {
  const totalCount = sortedDesc.length;
  let startIndex = 0;
  if (cursor) {
    startIndex = sortedDesc.findIndex((row) => compareAssignmentSortKeysDesc(keyOf(row), cursor) > 0);
    if (startIndex === -1) {
      return {
        rows: [],
        pageInfo: {
          totalCount,
          limit,
          hasMore: false,
          nextCursor: null,
          allRecordsLoaded: true,
        },
      };
    }
  }
  const rows = sortedDesc.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + rows.length < totalCount;
  const last = rows.at(-1);
  return {
    rows,
    pageInfo: {
      totalCount,
      limit,
      hasMore,
      nextCursor: hasMore && last ? encodeAssignmentListCursor(keyOf(last)) : null,
      allRecordsLoaded: !hasMore,
    },
  };
}
