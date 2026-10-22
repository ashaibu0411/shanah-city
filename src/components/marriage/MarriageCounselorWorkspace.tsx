"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarriageCounselorSessionTopicField } from "@/components/marriage/MarriageCounselorSessionTopicField";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import {
  formatMarriageSessionScheduledAt,
  MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE,
} from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";

type AdminRow = {
  access: "administrative";
  journeyId: string;
  coupleNames: string;
  assignedCounselorName: string | null;
  journeyStatus: string;
  programType: string;
  moduleCount: number;
  completedModules: number;
};

type ClinicalRow = {
  access: "clinical";
  journeyId: string;
  coupleNames: string;
  programType: string;
  moduleProgress: Array<{ moduleId: string; title: string; bothSubmitted: boolean }>;
  authorizedAnswers: Array<{ moduleTitle: string; prompt: string; userName: string; withheld: boolean; answer?: string }>;
  sessions: Array<{ id: string; scheduledAt: string; schedulingTimeZone?: string; topic?: string }>;
  homeworkDue: Array<{ id: string; title: string }>;
};

type DashboardRow = AdminRow | ClinicalRow;

export function MarriageCounselorWorkspace() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [error, setError] = useState("");
  const [sessionForm, setSessionForm] = useState({ journeyId: "", scheduledAt: "", topic: "", zoomUrl: "" });

  const clinicalRows = rows.filter((r): r is ClinicalRow => r.access === "clinical");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marriage/counselor", { cache: "no-store" });
      const data = await readJsonResponse<{ rows: DashboardRow[]; error?: string }>(res);
      if (!res.ok) setError(data.error ?? "Access denied.");
      else setRows(data.rows);
    })();
  }, []);

  async function createSession() {
    const res = await fetch("/api/marriage/counselor/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        journeyId: sessionForm.journeyId,
        scheduledAtLocal: sessionForm.scheduledAt,
        schedulingTimeZone: MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE,
        topic: sessionForm.topic,
        zoomUrl: sessionForm.zoomUrl,
        homework: sessionForm.topic
          ? [{ title: `Follow-up: ${sessionForm.topic}`, dueAt: sessionForm.scheduledAt }]
          : [],
      }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Could not create session.");
    else window.location.reload();
  }

  if (error && rows.length === 0) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Counselor workspace</h1>
      <p className={marriagePremium.cardMuted}>
        Assigned counselors see consented answers only. Pastoral overview shows progress without clinical content.
      </p>

      {clinicalRows.length > 0 && (
        <div className={`${marriagePremium.card} mt-6`}>
          <p className="font-semibold">Schedule session</p>
          <select
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            value={sessionForm.journeyId}
            onChange={(e) => setSessionForm((s) => ({ ...s, journeyId: e.target.value }))}
          >
            <option value="">Select assigned couple</option>
            {clinicalRows.map((r) => (
              <option key={r.journeyId} value={r.journeyId}>
                {r.coupleNames || r.journeyId}
              </option>
            ))}
          </select>
          <div className="mt-2">
            <input
              type="datetime-local"
              aria-label="Session date and time"
              className="w-full rounded-xl border border-[#E8E2DA] px-3 py-2 text-sm dark:border-white/10"
              value={sessionForm.scheduledAt}
              onChange={(e) => setSessionForm((s) => ({ ...s, scheduledAt: e.target.value }))}
            />
            <p className="mt-1 text-xs text-night-500">
              Enter time in America/Denver (church scheduling timezone).
            </p>
          </div>
          <div className="mt-2">
            <MarriageCounselorSessionTopicField
              value={sessionForm.topic}
              onChange={(topic) => setSessionForm((s) => ({ ...s, topic }))}
              inputClassName="w-full rounded-xl border border-[#E8E2DA] px-3 py-2 text-sm dark:border-white/10"
            />
          </div>
          <input
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Zoom URL (optional)"
            value={sessionForm.zoomUrl}
            onChange={(e) => setSessionForm((s) => ({ ...s, zoomUrl: e.target.value }))}
          />
          <button type="button" className={`${marriagePremium.primaryCta} mt-3`} onClick={() => createSession()}>
            Create session &amp; homework
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {rows.map((row) =>
          row.access === "administrative" ? (
            <li key={row.journeyId} className={marriagePremium.card}>
              <p className="font-semibold">{row.coupleNames || "Couple"}</p>
              <p className="text-xs capitalize text-night-500">
                {row.programType} · {row.journeyStatus}
              </p>
              <p className="mt-1 text-sm">Counselor: {row.assignedCounselorName ?? "Unassigned"}</p>
              <p className="mt-1 text-sm">
                Modules both submitted: {row.completedModules}/{row.moduleCount}
              </p>
              <Link
                href={`/marriage/counselor/journey/${row.journeyId}`}
                className={`${marriagePremium.primaryCta} mt-3 text-sm`}
              >
                Overview
              </Link>
            </li>
          ) : (
            <li key={row.journeyId} className={marriagePremium.card}>
              <p className="font-semibold">{row.coupleNames || "Couple"}</p>
              <p className="text-xs capitalize text-night-500">{row.programType}</p>
              <p className="mt-2 text-sm">
                Modules both submitted:{" "}
                {row.moduleProgress.filter((m) => m.bothSubmitted).length}/{row.moduleProgress.length}
              </p>
              {row.homeworkDue.length > 0 && (
                <p className="mt-1 text-sm text-amber-800">
                  Homework due: {row.homeworkDue.map((h) => h.title).join(", ")}
                </p>
              )}
              {row.sessions.slice(0, 2).map((s) => (
                <p key={s.id} className="mt-1 text-xs text-night-600">
                  Session {s.topic ?? ""} —{" "}
                  {formatMarriageSessionScheduledAt(s.scheduledAt, s.schedulingTimeZone)}
                </p>
              ))}
              {row.authorizedAnswers.length > 0 && (
                <div className="mt-3 rounded-xl bg-stone-50 p-3 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase">Consented responses</p>
                  {row.authorizedAnswers.slice(0, 3).map((a, i) => (
                    <p key={i} className="mt-1 text-xs">
                      {a.userName}: {a.moduleTitle} —{" "}
                      {a.withheld ? "Withheld (consent required)" : a.prompt.slice(0, 40)}
                    </p>
                  ))}
                </div>
              )}
              <Link
                href={`/marriage/counselor/journey/${row.journeyId}`}
                className={`${marriagePremium.primaryCta} mt-3 text-sm`}
              >
                Open clinical dashboard
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
