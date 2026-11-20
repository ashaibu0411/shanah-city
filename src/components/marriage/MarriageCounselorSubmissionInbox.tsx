"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarriagePrepNotificationListView, MarriagePrepUserNotificationRecord } from "@/lib/marriage-prep-notification-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Category = "all" | "submissions" | "unread";
const submissionKinds = new Set<string>([
  "counselor_assessment_submitted",
  "counselor_homework_submitted",
  "counselor_homework_both_submitted",
  "counselor_homework_review_pending",
  "counselor_homework_resubmitted",
  "counselor_self_paced_ready",
]);

/** Permanent, private counselor inbox. Does not rely on OS push delivery. */
export function MarriageCounselorSubmissionInbox() {
  const [data, setData] = useState<MarriagePrepNotificationListView | null>(null);
  const [category, setCategory] = useState<Category>("submissions");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/marriage/notifications", { cache: "no-store" });
      const result = await readJsonResponse<{ notifications?: MarriagePrepNotificationListView; error?: string }>(response);
      if (!response.ok) throw new Error(result.error || "Unable to load counselor notifications.");
      setData(result.notifications ?? { unreadCount: 0, items: [] });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load counselor notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Refresh while visible so submissions appear without reopening the page.
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      const response = await fetch("/api/marriage/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId: id }),
      });
      if (!response.ok) throw new Error("Could not mark this alert read.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update alert.");
    } finally {
      setBusyId(null);
    }
  }

  const counselorItems = useMemo(() => (data?.items ?? []).filter(n => n.kind.startsWith("counselor_")), [data]);
  const submissions = counselorItems.filter(n => submissionKinds.has(n.kind));
  const unread = counselorItems.filter(n => !n.readAt);
  const shown: MarriagePrepUserNotificationRecord[] = category === "submissions" ? submissions : category === "unread" ? unread : counselorItems;

  return (
    <section className="marriage-c3m-panel space-y-4" aria-label="Counselor notification inbox">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="marriage-c3m-section-title">Counselor notification inbox</h2>
          <p className="marriage-c3m-muted mt-1 text-sm">Private submission and review history for your assigned couples. Alerts remain here even when a phone notification is missed.</p>
        </div>
        <button type="button" className="min-h-[44px] rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-white/20 dark:bg-night-900 dark:text-sand-100" onClick={() => void refresh()} disabled={loading}>
          Refresh alerts
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 p-4 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100"><p className="text-sm font-semibold">Submission alerts</p><p className="mt-1 text-2xl font-extrabold">{submissions.length}</p></div>
        <div className="rounded-xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><p className="text-sm font-semibold">Unread alerts</p><p className="mt-1 text-2xl font-extrabold">{unread.length}</p></div>
        <div className="col-span-2 rounded-xl bg-slate-100 p-4 text-slate-950 sm:col-span-1 dark:bg-white/10 dark:text-sand-100"><p className="text-sm font-semibold">Recent counselor updates</p><p className="mt-1 text-2xl font-extrabold">{counselorItems.length}</p></div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter counselor notifications">
        {([["submissions", "Submissions"], ["unread", "Unread"], ["all", "All updates"]] as const).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}
            className={"min-h-[44px] rounded-full px-4 py-2 text-sm font-bold " + (category === key ? "bg-blue-700 text-white" : "border border-stone-300 bg-white text-slate-800 dark:border-white/20 dark:bg-night-900 dark:text-sand-100")}>
            {label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
      {loading ? <p role="status" className="text-sm">Loading counselor alerts…</p> : shown.length === 0 ? (
        <p role="status" className="rounded-xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-white/5 dark:text-sand-200">No alerts in this view. If a couple has submitted work but you see nothing here, confirm that the journey has an active counselor assignment and that you are signed in with the assigned account.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map(item => (
            <li key={item.id} className={"rounded-xl border p-4 " + (item.readAt ? "border-stone-200 dark:border-white/10" : "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold text-slate-950 dark:text-sand-100">{item.title}</p>
                {!item.readAt && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-900">New</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-sand-200">{item.body}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-sand-400">{new Date(item.createdAt).toLocaleString()}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Link href={item.actionPath} className="inline-flex min-h-[44px] items-center text-sm font-bold text-blue-700 underline dark:text-blue-300" onClick={() => { if (!item.readAt) void markRead(item.id); }}>Open assigned journey</Link>
                {!item.readAt && <button type="button" disabled={busyId !== null} onClick={() => void markRead(item.id)} className="min-h-[44px] text-sm font-bold text-slate-700 underline disabled:opacity-50 dark:text-sand-200">Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs leading-relaxed text-slate-500 dark:text-sand-400">This shows application-recorded alerts, not confirmation that an operating-system push appeared on a phone. Private counseling responses are only available after opening the authorized journey.</p>
    </section>
  );
}
