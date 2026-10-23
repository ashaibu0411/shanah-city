"use client";

import { useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageAssignmentListPageFooter } from "@/components/marriage/MarriageAssignmentListPageFooter";
import type { AssignmentListPageInfo } from "@/lib/marriage-counselor-assignment-list-pagination";
import {
  type AdministrativeCoordinatorRosterRow,
  type CoordinatorRosterFilter,
} from "@/lib/marriage-counselor-assignment-ui";

type AssignmentAdminOption = { userId: string; displayName: string };

type Props = {
  rows: AdministrativeCoordinatorRosterRow[];
  pageInfo: AssignmentListPageInfo | null;
  search: string;
  assignmentFilter: CoordinatorRosterFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: CoordinatorRosterFilter) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  eligibleAdmins: AssignmentAdminOption[];
  busyId: string | null;
  onAssign: (journeyId: string, coordinatorUserId: string, isReassign: boolean) => Promise<void>;
  onRemove: (journeyId: string, coupleNames: string) => Promise<void>;
};

export function MarriageAdministrativeCoordinatorSection({
  rows,
  pageInfo,
  search,
  assignmentFilter,
  onSearchChange,
  onFilterChange,
  onLoadMore,
  loadingMore,
  eligibleAdmins,
  busyId,
  onAssign,
  onRemove,
}: Props) {
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState("");

  return (
    <section className="mt-8" aria-labelledby="admin-coordinators-heading">
      <h2 id="admin-coordinators-heading" className={marriagePremium.sectionLabel}>
        Administrative coordinators
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1`}>
        Assign an administrative coordinator so they can submit counselor assignment requests. This
        does not grant clinical counseling access.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block flex-1 min-w-[200px] text-sm font-semibold">
          Search couples
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Couple or coordinator name"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
            autoComplete="off"
          />
        </label>
        <label className="block text-sm font-semibold sm:min-w-[180px]">
          Coordinator status
          <select
            value={assignmentFilter}
            onChange={(e) => onFilterChange(e.target.value as CoordinatorRosterFilter)}
            className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
          >
            <option value="all">All couples</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <p className={`${marriagePremium.cardMuted} mt-4`}>
          {pageInfo?.totalCount === 0
            ? "No active marriage journeys match your filters."
            : "No couples on this page."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const open = expandedJourney === row.journeyId;
            const hasCoordinator = Boolean(row.coordinatorUserId);
            return (
              <li key={row.journeyId} className={marriagePremium.card}>
                <p className="font-semibold">{row.coupleNames}</p>
                <p className="text-sm capitalize text-night-600 dark:text-sand-400">
                  {row.programType}
                </p>
                <p className="mt-2 text-sm">
                  Administrative coordinator:{" "}
                  <strong>{row.coordinatorName ?? "Unassigned"}</strong>
                </p>
                {hasCoordinator && row.assignedAt && (
                  <p className="text-sm text-night-600 dark:text-sand-400">
                    Assigned {new Date(row.assignedAt).toLocaleString()}
                    {row.assignedByName ? ` by ${row.assignedByName}` : ""}
                  </p>
                )}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    className={marriagePremium.secondaryCta}
                    aria-expanded={open}
                    disabled={Boolean(busyId) || eligibleAdmins.length === 0}
                    onClick={() => {
                      setExpandedJourney(open ? null : row.journeyId);
                      setSelectedAdmin(row.coordinatorUserId ?? "");
                    }}
                  >
                    {open
                      ? "Close"
                      : hasCoordinator
                        ? "Reassign coordinator"
                        : "Assign coordinator"}
                  </button>
                  {hasCoordinator && (
                    <button
                      type="button"
                      className={marriagePremium.secondaryCta}
                      disabled={busyId === `remove-${row.journeyId}`}
                      onClick={() => void onRemove(row.journeyId, row.coupleNames)}
                    >
                      Remove coordinator
                    </button>
                  )}
                </div>

                {open && (
                  <div className="mt-4 space-y-3 border-t border-night-900/8 pt-4 dark:border-white/10">
                    {eligibleAdmins.length === 0 ? (
                      <p className="text-sm text-night-600 dark:text-sand-400">
                        No eligible assignment admins are configured. Set{" "}
                        <code className="text-xs">MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS</code>.
                      </p>
                    ) : (
                      <>
                        <label className="block text-sm font-semibold">
                          Assignment admin
                          <select
                            className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
                            value={selectedAdmin}
                            onChange={(e) => setSelectedAdmin(e.target.value)}
                          >
                            <option value="">Select admin…</option>
                            {eligibleAdmins.map((a) => (
                              <option key={a.userId} value={a.userId}>
                                {a.displayName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!selectedAdmin || busyId === row.journeyId}
                          className={marriagePremium.primaryCta}
                          onClick={() =>
                            void onAssign(row.journeyId, selectedAdmin, hasCoordinator)
                          }
                        >
                          {hasCoordinator ? "Confirm reassignment" : "Confirm assignment"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <MarriageAssignmentListPageFooter
        pageInfo={pageInfo}
        loadedCount={rows.length}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        label="couples"
      />
    </section>
  );
}
