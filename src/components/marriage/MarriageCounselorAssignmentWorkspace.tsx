"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageAdministrativeCoordinatorSection } from "@/components/marriage/MarriageAdministrativeCoordinatorSection";
import { MarriageAssignmentListPageFooter } from "@/components/marriage/MarriageAssignmentListPageFooter";
import type { AssignmentListPageInfo } from "@/lib/marriage-counselor-assignment-list-pagination";
import {
  buildCounselorAssignmentListUrl,
  type AssignmentListResponse,
} from "@/lib/marriage-counselor-assignment-list-client";
import {
  counselorAssignmentHistoryStatusLabel,
  counselorAssignmentRequestTypeLabel,
  counselorAssignmentWorkflowStatusLabel,
  counselorAssignmentUiCapabilities,
  type AdministrativeCoordinatorRosterRow,
  type CoordinatorRosterFilter,
} from "@/lib/marriage-counselor-assignment-ui";
import { readJsonResponse } from "@/lib/read-json-response";

type Capabilities = {
  canSubmitRequest: boolean;
  canApprove: boolean;
  canAccessAdminPage: boolean;
};

type CounselorOption = { userId: string; displayName: string };
type AssignmentAdminOption = { userId: string; displayName: string };

type AdminJourneyRow = {
  journeyId: string;
  coupleNames: string;
  programType: string;
  activeCounselorName: string | null;
  workflowStatus: {
    pendingRequest: { id: string; status: string; requestType: string } | null;
    approvedAwaitingExecution: { restorationRequired: boolean } | null;
    activeCounselorUserId: string | null;
    permissions: { canSubmitRequest: boolean; canApprove: boolean };
  };
};

type QueueRow = {
  request: {
    id: string;
    requestType: string;
    requestedAt: string;
    requestedByUserId: string;
    requestedCounselorUserId: string | null;
    status: string;
    executedAt?: string | null;
    reviewedAt?: string | null;
  };
  journeyId: string;
  coupleNames: string;
  requestedCounselorName: string | null;
  requesterName: string | null;
  previousCounselorName: string | null;
};

export function MarriageCounselorAssignmentWorkspace() {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [counselors, setCounselors] = useState<CounselorOption[]>([]);
  const [adminRows, setAdminRows] = useState<AdminJourneyRow[]>([]);
  const [pending, setPending] = useState<QueueRow[]>([]);
  const [history, setHistory] = useState<QueueRow[]>([]);
  const [coordinatorRows, setCoordinatorRows] = useState<AdministrativeCoordinatorRosterRow[]>([]);
  const [coordinatorPageInfo, setCoordinatorPageInfo] = useState<AssignmentListPageInfo | null>(
    null,
  );
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [coordinatorFilter, setCoordinatorFilter] = useState<CoordinatorRosterFilter>("all");
  const [coordinatorLoadingMore, setCoordinatorLoadingMore] = useState(false);
  const [adminPageInfo, setAdminPageInfo] = useState<AssignmentListPageInfo | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoadingMore, setAdminLoadingMore] = useState(false);
  const [pendingPageInfo, setPendingPageInfo] = useState<AssignmentListPageInfo | null>(null);
  const [pendingLoadingMore, setPendingLoadingMore] = useState(false);
  const [historyPageInfo, setHistoryPageInfo] = useState<AssignmentListPageInfo | null>(null);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [assignmentAdmins, setAssignmentAdmins] = useState<AssignmentAdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [formCounselor, setFormCounselor] = useState<string>("");
  const [formMode, setFormMode] = useState<"assign" | "reassign" | "remove">("assign");
  const [selfApproveConfirm, setSelfApproveConfirm] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const uiCaps = useMemo(
    () =>
      caps
        ? counselorAssignmentUiCapabilities({
            canSubmitRequest: caps.canSubmitRequest,
            canApprove: caps.canApprove,
            canAcknowledgeRestoration: false,
          })
        : null,
    [caps],
  );

  async function fetchListPage<T>(
    view: string,
    params: {
      search?: string;
      cursor?: string | null;
      coordinatorFilter?: CoordinatorRosterFilter;
    } = {},
  ): Promise<AssignmentListResponse<T>> {
    const res = await fetch(buildCounselorAssignmentListUrl(view, params), { cache: "no-store" });
    const data = await readJsonResponse<AssignmentListResponse<T> & { error?: string }>(res);
    if (!res.ok) throw new Error(data.error ?? "Could not load list.");
    return { rows: data.rows ?? [], pageInfo: data.pageInfo };
  }

  const load = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const capRes = await fetch(
        "/api/marriage/counselor/assignment-requests?view=capabilities",
        { cache: "no-store" },
      );
      const capData = await readJsonResponse<Capabilities & { error?: string }>(capRes);
      if (!capRes.ok) throw new Error(capData.error ?? "Access denied.");
      setCaps(capData);

      const tasks: Promise<void>[] = [];

      if (capData.canSubmitRequest || capData.canApprove) {
        tasks.push(
          (async () => {
            const res = await fetch(
              "/api/marriage/counselor/assignment-requests?view=eligible_counselors",
              { cache: "no-store" },
            );
            const data = await readJsonResponse<{ counselors: CounselorOption[]; error?: string }>(
              res,
            );
            if (res.ok) setCounselors(data.counselors ?? []);
          })(),
        );
      }

      if (capData.canSubmitRequest || capData.canApprove) {
        tasks.push(
          (async () => {
            const page = await fetchListPage<AdminJourneyRow>("admin_journeys");
            setAdminRows(page.rows);
            setAdminPageInfo(page.pageInfo);
          })(),
        );
      }

      if (capData.canApprove) {
        tasks.push(
          (async () => {
            const [pendingPage, historyPage, coordPage, adminRes] = await Promise.all([
              fetchListPage<QueueRow>("senior_pastor_pending"),
              fetchListPage<QueueRow>("senior_pastor_history"),
              fetchListPage<AdministrativeCoordinatorRosterRow>("administrative_coordinators"),
              fetch(
                "/api/marriage/counselor/assignment-requests?view=eligible_assignment_admins",
                { cache: "no-store" },
              ),
            ]);
            setPending(pendingPage.rows);
            setPendingPageInfo(pendingPage.pageInfo);
            setHistory(historyPage.rows);
            setHistoryPageInfo(historyPage.pageInfo);
            setCoordinatorRows(coordPage.rows);
            setCoordinatorPageInfo(coordPage.pageInfo);
            const adminData = await readJsonResponse<{ admins: AssignmentAdminOption[] }>(
              adminRes,
            );
            if (adminRes.ok) setAssignmentAdmins(adminData.admins ?? []);
          })(),
        );
      }

      await Promise.all(tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !caps?.canApprove) return;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const page = await fetchListPage<AdministrativeCoordinatorRosterRow>(
            "administrative_coordinators",
            { search: coordinatorSearch, coordinatorFilter },
          );
          setCoordinatorRows(page.rows);
          setCoordinatorPageInfo(page.pageInfo);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not refresh coordinator roster.");
        }
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [coordinatorSearch, coordinatorFilter, loading, caps?.canApprove]);

  useEffect(() => {
    if (loading || !(caps?.canSubmitRequest || caps?.canApprove)) return;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const page = await fetchListPage<AdminJourneyRow>("admin_journeys", { search: adminSearch });
          setAdminRows(page.rows);
          setAdminPageInfo(page.pageInfo);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not refresh couples list.");
        }
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [adminSearch, loading, caps?.canSubmitRequest, caps?.canApprove]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (!res.ok) return;
      const data = await readJsonResponse<{ user?: { id?: string } | null }>(res);
      if (data.user?.id) setViewerId(data.user.id);
    })();
  }, []);

  async function postAction(body: Record<string, unknown>, busyKey: string) {
    setBusyId(busyKey);
    setError("");
    try {
      const res = await fetch("/api/marriage/counselor/assignment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function assignCoordinator(
    journeyId: string,
    coordinatorUserId: string,
    isReassign: boolean,
  ) {
    const msg = isReassign
      ? "Reassign this couple to a different administrative coordinator? The previous admin will lose access immediately."
      : "Assign this administrative coordinator? They will be able to submit counselor assignment requests for this couple.";
    if (!window.confirm(msg)) return;
    const ok = await postAction(
      {
        action: "assign_administrative_coordinator",
        journeyId,
        coordinatorUserId,
      },
      journeyId,
    );
    if (ok) setSuccess("Administrative coordinator updated.");
  }

  async function removeCoordinator(journeyId: string, coupleNames: string) {
    if (
      !window.confirm(
        `Remove the administrative coordinator for ${coupleNames}? They will lose access to this couple immediately.`,
      )
    ) {
      return;
    }
    const ok = await postAction(
      { action: "remove_administrative_coordinator", journeyId },
      `remove-${journeyId}`,
    );
    if (ok) setSuccess("Administrative coordinator removed.");
  }

  async function submitForJourney(journeyId: string, hasCounselor: boolean) {
    if (formMode === "remove") {
      if (!window.confirm("Submit a request to remove the assigned counselor?")) return;
      await postAction(
        { action: "submit", journeyId, counselorUserId: null, requestType: "remove" },
        journeyId,
      );
      setExpandedJourney(null);
      return;
    }
    if (!formCounselor) {
      setError("Select a counselor.");
      return;
    }
    const requestType =
      formMode === "reassign" || hasCounselor ? "reassign" : ("assign" as const);
    if (
      requestType === "reassign" &&
      !window.confirm(
        "Reassignment invalidates previous answer-sharing consent for this journey. Continue?",
      )
    ) {
      return;
    }
    await postAction(
      { action: "submit", journeyId, counselorUserId: formCounselor, requestType },
      journeyId,
    );
    setExpandedJourney(null);
  }

  async function approveRequest(row: QueueRow) {
    const isSelf = viewerId && row.request.requestedByUserId === viewerId;
    if (isSelf && !selfApproveConfirm) {
      setError("Confirm that you are approving your own request.");
      return;
    }
    const reassign = row.request.requestType === "reassign";
    const msg = reassign
      ? "Approve this reassignment? Previous answer-sharing consent will be invalidated."
      : "Approve this counselor assignment request?";
    if (!window.confirm(msg)) return;
    await postAction(
      {
        action: "approve",
        requestId: row.request.id,
        acknowledgeApproval: isSelf ? true : undefined,
      },
      row.request.id,
    );
    setSelfApproveConfirm(false);
  }

  async function rejectRequest(row: QueueRow) {
    const note = window.prompt("Optional note for the admin team:");
    if (note === null) return;
    if (!window.confirm("Reject this request?")) return;
    await postAction(
      { action: "reject", requestId: row.request.id, decisionNote: note || undefined },
      row.request.id,
    );
  }

  if (loading) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className={marriagePremium.cardMuted} aria-busy="true">
            Loading counselor assignments…
          </p>
        </div>
      </div>
    );
  }

  if (!caps?.canAccessAdminPage) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <div className={marriagePremium.card} role="alert">
            <p className="text-sm text-red-800">You are not authorized to view this page.</p>
            <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
              Back to hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Link href="/marriage" className="text-sm font-semibold text-clay-700 dark:text-clay-300">
          ← Marriage hub
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Counselor assignments
        </h1>
        <p className={`${marriagePremium.cardMuted} mt-1`}>
          Assignments require Senior Pastor approval before a counselor receives clinical access.
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-800 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-sm text-emerald-800 dark:text-emerald-300" role="status">
            {success}
          </p>
        )}

        {uiCaps?.showCoordinatorManagement && (
          <MarriageAdministrativeCoordinatorSection
            rows={coordinatorRows}
            pageInfo={coordinatorPageInfo}
            search={coordinatorSearch}
            assignmentFilter={coordinatorFilter}
            onSearchChange={setCoordinatorSearch}
            onFilterChange={setCoordinatorFilter}
            loadingMore={coordinatorLoadingMore}
            onLoadMore={() => {
              void (async () => {
                if (!coordinatorPageInfo?.nextCursor) return;
                setCoordinatorLoadingMore(true);
                try {
                  const page = await fetchListPage<AdministrativeCoordinatorRosterRow>(
                    "administrative_coordinators",
                    {
                      search: coordinatorSearch,
                      coordinatorFilter,
                      cursor: coordinatorPageInfo.nextCursor,
                    },
                  );
                  setCoordinatorRows((prev) => [...prev, ...page.rows]);
                  setCoordinatorPageInfo(page.pageInfo);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not load more.");
                } finally {
                  setCoordinatorLoadingMore(false);
                }
              })();
            }}
            eligibleAdmins={assignmentAdmins}
            busyId={busyId}
            onAssign={assignCoordinator}
            onRemove={removeCoordinator}
          />
        )}

        {uiCaps?.showApprovalDashboard && (
          <section className="mt-8" aria-labelledby="sp-approvals-heading">
            <h2 id="sp-approvals-heading" className={marriagePremium.sectionLabel}>
              Counselor approvals
            </h2>
            {pending.length === 0 ? (
              <p className={`${marriagePremium.cardMuted} mt-3`}>
                {pendingPageInfo?.totalCount === 0 ? "No pending requests." : "No pending requests on this page."}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pending.map((row) => (
                  <li key={row.request.id} className={marriagePremium.card}>
                    <p className="font-semibold">{row.coupleNames}</p>
                    <p className="text-sm text-night-600 dark:text-sand-400">
                      {counselorAssignmentRequestTypeLabel(
                        row.request.requestType as "assign" | "reassign" | "remove",
                      )}{" "}
                      · Requested {new Date(row.request.requestedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm">
                      Proposed:{" "}
                      <strong>{row.requestedCounselorName ?? "Remove assignment"}</strong>
                    </p>
                    <p className="text-sm text-night-600 dark:text-sand-400">
                      Admin: {row.requesterName ?? "Staff"}
                    </p>
                    {row.request.requestType === "reassign" && (
                      <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                        Reassignment invalidates prior answer-sharing consent.
                      </p>
                    )}
                    {viewerId === row.request.requestedByUserId && (
                      <label className="mt-3 flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selfApproveConfirm}
                          onChange={(e) => setSelfApproveConfirm(e.target.checked)}
                          className="mt-1"
                        />
                        <span>I am approving a request I submitted.</span>
                      </label>
                    )}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={busyId === row.request.id}
                        className={marriagePremium.primaryCta}
                        onClick={() => void approveRequest(row)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.request.id}
                        className={marriagePremium.secondaryCta}
                        onClick={() => void rejectRequest(row)}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <MarriageAssignmentListPageFooter
              pageInfo={pendingPageInfo}
              loadedCount={pending.length}
              loadingMore={pendingLoadingMore}
              label="pending requests"
              onLoadMore={() => {
                void (async () => {
                  if (!pendingPageInfo?.nextCursor) return;
                  setPendingLoadingMore(true);
                  try {
                    const page = await fetchListPage<QueueRow>("senior_pastor_pending", {
                      cursor: pendingPageInfo.nextCursor,
                    });
                    setPending((prev) => [...prev, ...page.rows]);
                    setPendingPageInfo(page.pageInfo);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not load more.");
                  } finally {
                    setPendingLoadingMore(false);
                  }
                })();
              }}
            />

            <h3 className={`${marriagePremium.sectionLabel} mt-8`}>Approval history</h3>
            {history.length === 0 ? (
              <p className={`${marriagePremium.cardMuted} mt-2`}>No recent decisions.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {history.map((row) => (
                  <li
                    key={`${row.request.id}-hist`}
                    className="rounded-xl border border-night-900/8 px-3 py-2 text-sm dark:border-white/10"
                  >
                    <span className="font-semibold">{row.coupleNames}</span> —{" "}
                    {counselorAssignmentHistoryStatusLabel(
                      row.request.status as "pending",
                      row.request.executedAt,
                    )}
                    {row.request.reviewedAt && (
                      <span className="text-night-500 dark:text-sand-500">
                        {" "}
                        · {new Date(row.request.reviewedAt).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <MarriageAssignmentListPageFooter
              pageInfo={historyPageInfo}
              loadedCount={history.length}
              loadingMore={historyLoadingMore}
              label="history records"
              onLoadMore={() => {
                void (async () => {
                  if (!historyPageInfo?.nextCursor) return;
                  setHistoryLoadingMore(true);
                  try {
                    const page = await fetchListPage<QueueRow>("senior_pastor_history", {
                      cursor: historyPageInfo.nextCursor,
                    });
                    setHistory((prev) => [...prev, ...page.rows]);
                    setHistoryPageInfo(page.pageInfo);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not load more.");
                  } finally {
                    setHistoryLoadingMore(false);
                  }
                })();
              }}
            />
          </section>
        )}

        {uiCaps?.showAdminWorkspace && (
          <section className="mt-10" aria-labelledby="admin-couples-heading">
            <h2 id="admin-couples-heading" className={marriagePremium.sectionLabel}>
              Couples &amp; counselor status
            </h2>
            {(caps?.canApprove || caps?.canSubmitRequest) && (
              <label className="mt-3 block max-w-md text-sm font-semibold">
                Search couples
                <input
                  type="search"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
                  autoComplete="off"
                />
              </label>
            )}
            {adminRows.length === 0 ? (
              <p className={`${marriagePremium.cardMuted} mt-3`}>
                {uiCaps.showApprovalDashboard
                  ? "No active marriage journeys."
                  : "No couples are assigned to you yet. The Senior Pastor assigns administrative coordinators before you can submit counselor assignment requests for a couple."}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {adminRows.map((row) => {
                  const wf = counselorAssignmentWorkflowStatusLabel({
                    pendingRequest: row.workflowStatus.pendingRequest
                      ? {
                          status: row.workflowStatus.pendingRequest.status as "pending",
                        }
                      : null,
                    approvedAwaitingExecution: row.workflowStatus.approvedAwaitingExecution,
                    activeCounselorUserId: row.workflowStatus.activeCounselorUserId,
                  });
                  const canSubmit = row.workflowStatus.permissions.canSubmitRequest;
                  const open = expandedJourney === row.journeyId;
                  return (
                    <li key={row.journeyId} className={marriagePremium.card}>
                      <p className="font-semibold">{row.coupleNames}</p>
                      <p className="text-sm capitalize text-night-600 dark:text-sand-400">
                        {row.programType}
                      </p>
                      <p className="mt-1 text-sm">
                        Active counselor: {row.activeCounselorName ?? "None"}
                      </p>
                      <p className="text-sm font-medium text-clay-800 dark:text-clay-200">{wf}</p>
                      {canSubmit && (
                        <button
                          type="button"
                          className={`${marriagePremium.secondaryCta} mt-3`}
                          aria-expanded={open}
                          onClick={() => {
                            setExpandedJourney(open ? null : row.journeyId);
                            setFormCounselor("");
                            setFormMode(row.activeCounselorName ? "reassign" : "assign");
                          }}
                        >
                          {open ? "Close request form" : "Submit assignment request"}
                        </button>
                      )}
                      {open && canSubmit && (
                        <div className="mt-4 space-y-3 border-t border-night-900/8 pt-4 dark:border-white/10">
                          <label className="block text-sm font-semibold">
                            Request type
                            <select
                              className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
                              value={formMode}
                              onChange={(e) =>
                                setFormMode(e.target.value as "assign" | "reassign" | "remove")
                              }
                            >
                              <option value="assign">Assign counselor</option>
                              <option value="reassign">Reassign counselor</option>
                              <option value="remove">Remove counselor</option>
                            </select>
                          </label>
                          {formMode !== "remove" && (
                            <label className="block text-sm font-semibold">
                              Counselor
                              <select
                                className="mt-1 w-full min-h-[44px] rounded-xl border border-night-900/12 bg-white px-3 dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
                                value={formCounselor}
                                onChange={(e) => setFormCounselor(e.target.value)}
                              >
                                <option value="">Select…</option>
                                {counselors.map((c) => (
                                  <option key={c.userId} value={c.userId}>
                                    {c.displayName}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {formMode === "reassign" && (
                            <p className="text-xs text-amber-900 dark:text-amber-200">
                              Reassignment invalidates previous answer-sharing consent.
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={busyId === row.journeyId}
                            className={marriagePremium.primaryCta}
                            onClick={() =>
                              void submitForJourney(row.journeyId, Boolean(row.activeCounselorName))
                            }
                          >
                            Submit for Senior Pastor approval
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <MarriageAssignmentListPageFooter
              pageInfo={adminPageInfo}
              loadedCount={adminRows.length}
              loadingMore={adminLoadingMore}
              label="couples"
              onLoadMore={() => {
                void (async () => {
                  if (!adminPageInfo?.nextCursor) return;
                  setAdminLoadingMore(true);
                  try {
                    const page = await fetchListPage<AdminJourneyRow>("admin_journeys", {
                      search: adminSearch,
                      cursor: adminPageInfo.nextCursor,
                    });
                    setAdminRows((prev) => [...prev, ...page.rows]);
                    setAdminPageInfo(page.pageInfo);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not load more.");
                  } finally {
                    setAdminLoadingMore(false);
                  }
                })();
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
