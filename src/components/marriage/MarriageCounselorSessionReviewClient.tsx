"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageCounselorStructuredFeedback } from "@/lib/marriage-self-paced-types";
import { SELF_PACED_ASYNC_DISCLAIMER } from "@/lib/marriage-counseling-delivery-mode";
import { readJsonResponse } from "@/lib/read-json-response";

const EMPTY_FEEDBACK: MarriageCounselorStructuredFeedback = {
  strengths: "",
  concerns: "",
  discussionTopics: "",
  biblicalGuidance: "",
  practicalExercises: "",
  individualRecommendations: "",
  jointRecommendations: "",
  homeworkNotes: "",
  finalComments: "",
  sharedFeedback: "",
  counselorInternalNotes: "",
  partnerSpecific: {},
};

type Workspace = {
  sessionTitle: string;
  enrichment: boolean;
  review?: { workflowStatus: string } | null;
  moduleBlocks: Array<{
    moduleId: string;
    title: string;
    partnerA: { name: string; submitted: boolean };
    partnerB: { name: string; submitted: boolean };
    comparisons: Array<{
      prompt: string;
      category: string;
      partnerADisplay: string;
      partnerBDisplay: string;
    }>;
  }>;
  clarifications: Array<{ authorRole: string; body: string; createdAt: string }>;
  audit: Array<{ action: string; newStatus: string | null; createdAt: string }>;
  sessionHomework: Array<{
    id: string;
    title: string;
    partners: Array<{ name: string; reviewStatus: string; submittedAt: string | null }>;
  }>;
  premaritalProgress: { sessionsCompleted: number; sessionsTotal: number } | null;
  certificateSummary: { eligible: boolean; blockerCount: number; blockers: string[] } | null;
  homeworkAssignPath: string;
};

export function MarriageCounselorSessionReviewClient({
  journeyId,
  sessionKey,
}: {
  journeyId: string;
  sessionKey: string;
}) {
  const [feedback, setFeedback] = useState<MarriageCounselorStructuredFeedback>(EMPTY_FEEDBACK);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [clarify, setClarify] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/marriage/counselor/self-paced?journeyId=${encodeURIComponent(journeyId)}&sessionKey=${encodeURIComponent(sessionKey)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<{
      review?: { workflowStatus: string; feedbackDraft?: MarriageCounselorStructuredFeedback | null };
      workspace?: Workspace;
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load session.");
      return;
    }
    setStatus(data.review?.workflowStatus ?? "");
    if (data.review?.feedbackDraft) setFeedback({ ...EMPTY_FEEDBACK, ...data.review.feedbackDraft });
    if (data.workspace) setWorkspace(data.workspace);
  }, [journeyId, sessionKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/marriage/counselor/self-paced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, journeyId, sessionKey, feedback, ...extra }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed.");
      return;
    }
    await load();
  }

  function field(
    key: keyof MarriageCounselorStructuredFeedback,
    label: string,
    rows = 3,
  ) {
    if (key === "optionalMeetingRecommended") return null;
    if (key === "partnerSpecific") return null;
    return (
      <label className="block text-sm">
        <span className="font-semibold">{label}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-stone-200 p-2 text-sm dark:border-white/10 dark:bg-night-900"
          rows={rows}
          value={String(feedback[key] ?? "")}
          onChange={(e) => setFeedback((f) => ({ ...f, [key]: e.target.value }))}
        />
      </label>
    );
  }

  const approveLabel = workspace?.enrichment ? "Acknowledge enrichment completion" : "Approve session completion";

  return (
    <div className={marriagePremium.counselorDashboardPage}>
      <div className={marriagePremium.counselorDashboardInset}>
        <Link href="/marriage/counselor" className="text-sm font-semibold text-clay-700">
          ← Counselor workspace
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">
          {workspace?.sessionTitle ?? "Session review"}
        </h1>
        <p className={marriagePremium.cardMuted}>
          {sessionKey.replace(/-/g, " ")} · {status || "…"}
          {workspace?.enrichment ? " · Stage 2 enrichment" : ""}
        </p>
        <p className="mt-2 text-xs text-night-600">{SELF_PACED_ASYNC_DISCLAIMER}</p>

        {workspace?.premaritalProgress ? (
          <div className={`${marriagePremium.card} mt-4 text-sm`}>
            <p className="font-semibold">Premarital progress</p>
            <p className="mt-1">
              {workspace.premaritalProgress.sessionsCompleted} of {workspace.premaritalProgress.sessionsTotal}{" "}
              sessions complete
            </p>
            {workspace.certificateSummary ? (
              <p className="mt-1 text-xs text-night-600">
                Certificate: {workspace.certificateSummary.eligible ? "eligible" : `${workspace.certificateSummary.blockerCount} blockers`}
              </p>
            ) : null}
          </div>
        ) : null}

        {workspace?.moduleBlocks.length ? (
          <section className={`${marriagePremium.card} mt-4`}>
            <h2 className={marriagePremium.sectionLabel}>Assessments & comparisons</h2>
            {workspace.moduleBlocks.map((mod) => (
              <div key={mod.moduleId} className="mt-4 border-t border-stone-200 pt-4 dark:border-white/10">
                <p className="font-semibold">{mod.title}</p>
                <p className="text-xs text-night-500">
                  {mod.partnerA.name}: {mod.partnerA.submitted ? "submitted" : "pending"} · {mod.partnerB.name}:{" "}
                  {mod.partnerB.submitted ? "submitted" : "pending"}
                </p>
                {mod.comparisons.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {mod.comparisons.map((c, i) => (
                      <li key={i} className="rounded-lg bg-stone-50 p-2 dark:bg-white/5">
                        <p className="font-medium">{c.prompt}</p>
                        <p className="text-xs capitalize text-night-500">{c.category.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs">
                          <span className="font-semibold">{mod.partnerA.name}:</span> {c.partnerADisplay}
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">{mod.partnerB.name}:</span> {c.partnerBDisplay}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-night-500">Comparison unlocks after both partners submit.</p>
                )}
              </div>
            ))}
          </section>
        ) : null}

        {workspace?.sessionHomework.length ? (
          <section className={`${marriagePremium.card} mt-4`}>
            <h2 className={marriagePremium.sectionLabel}>Session homework</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {workspace.sessionHomework.map((h) => (
                <li key={h.id}>
                  <Link href={`/marriage/counselor/journey/${journeyId}/homework`} className="font-semibold text-clay-700">
                    {h.title}
                  </Link>
                  {h.partners.map((p) => (
                    <p key={p.name} className="text-xs text-night-500">
                      {p.name}: {p.reviewStatus.replace(/_/g, " ")}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link href={workspace?.homeworkAssignPath ?? `#`} className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
          Assign / manage homework
        </Link>

        {workspace?.clarifications.length ? (
          <section className={`${marriagePremium.card} mt-4`}>
            <h2 className={marriagePremium.sectionLabel}>Clarification</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {workspace.clarifications.map((m, i) => (
                <li key={i} className="rounded-lg bg-stone-50 p-2 dark:bg-white/5">
                  <p className="text-xs font-bold capitalize">{m.authorRole}</p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ul>
            <textarea
              className="mt-3 w-full rounded-lg border border-stone-200 p-2 text-sm dark:border-white/10 dark:bg-night-900"
              rows={2}
              placeholder="Counselor follow-up question"
              value={clarify}
              onChange={(e) => setClarify(e.target.value)}
            />
            <button
              type="button"
              className={`${marriagePremium.secondaryCta} mt-2`}
              disabled={busy}
              onClick={() => void post("post_clarification", { body: clarify })}
            >
              Post clarification
            </button>
          </section>
        ) : null}

        {workspace?.audit.length ? (
          <section className="mt-4">
            <h2 className={marriagePremium.sectionLabel}>Session timeline</h2>
            <ul className="mt-2 space-y-1 text-xs text-night-600">
              {workspace.audit.map((a, i) => (
                <li key={i}>
                  {a.createdAt?.slice(0, 16)} · {a.action.replace(/_/g, " ")}
                  {a.newStatus ? ` → ${a.newStatus}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={`${marriagePremium.card} mt-6 space-y-4`}>
          <h2 className={marriagePremium.sectionLabel}>Feedback (draft → publish)</h2>
          {field("strengths", "Areas of strength")}
          {field("concerns", "Areas of concern")}
          {field("discussionTopics", "Recommended discussion topics")}
          {field("biblicalGuidance", "Biblical / pastoral guidance", 4)}
          {field("practicalExercises", "Practical exercises")}
          {field("jointRecommendations", "Joint recommendations", 4)}
          {field("homeworkNotes", "Homework notes")}
          {field("sharedFeedback", "Shared feedback (both partners)", 4)}
          {field("finalComments", "Final comments")}
          {field("counselorInternalNotes", "Counselor-only notes (never published)", 3)}
        </div>

        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={busy} className={marriagePremium.primaryCta} onClick={() => void post("save_feedback_draft")}>
            Save draft
          </button>
          <button type="button" disabled={busy} className={marriagePremium.secondaryCta} onClick={() => void post("publish_feedback")}>
            Publish to couple
          </button>
          <button type="button" disabled={busy} className={marriagePremium.secondaryCta} onClick={() => void post("approve_session")}>
            {approveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
