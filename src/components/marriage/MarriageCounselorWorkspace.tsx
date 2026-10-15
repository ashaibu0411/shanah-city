"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type DashboardRow = {
  journey: { id: string; programType: string };
  coupleLabel: string;
  moduleProgress: Array<{ moduleId: string; title: string; bothSubmitted: boolean; awaitingBoth: boolean }>;
  authorizedAnswers: Array<{ moduleTitle: string; prompt: string; userName: string }>;
  sessions: Array<{ id: string; scheduledAt: string; topic?: string; zoomUrl?: string; status?: string }>;
  assignments: Array<{ id: string; title: string; dueAt?: string }>;
  homeworkDue: Array<{ id: string; title: string; dueAt?: string }>;
};

export function MarriageCounselorWorkspace() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [error, setError] = useState("");
  const [sessionForm, setSessionForm] = useState({ journeyId: "", scheduledAt: "", topic: "", zoomUrl: "" });

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
        scheduledAt: sessionForm.scheduledAt,
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
        Authorized counselor-only responses appear below. Private partner answers stay hidden.
      </p>

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Schedule session</p>
        <select
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          value={sessionForm.journeyId}
          onChange={(e) => setSessionForm((s) => ({ ...s, journeyId: e.target.value }))}
        >
          <option value="">Select couple journey</option>
          {rows.map((r) => (
            <option key={r.journey.id} value={r.journey.id}>
              {r.coupleLabel || r.journey.id}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          value={sessionForm.scheduledAt}
          onChange={(e) => setSessionForm((s) => ({ ...s, scheduledAt: e.target.value }))}
        />
        <input
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Session topic"
          value={sessionForm.topic}
          onChange={(e) => setSessionForm((s) => ({ ...s, topic: e.target.value }))}
        />
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

      <ul className="mt-6 space-y-4">
        {rows.map((row) => (
          <li key={row.journey.id} className={marriagePremium.card}>
            <p className="font-semibold">{row.coupleLabel || "Couple"}</p>
            <p className="text-xs capitalize text-night-500">{row.journey.programType}</p>
            <p className="mt-2 text-sm">
              Modules both submitted:{" "}
              {row.moduleProgress.filter((m) => m.bothSubmitted).length}/{row.moduleProgress.length}
            </p>
            {row.homeworkDue.length > 0 && (
              <p className="mt-1 text-sm text-amber-800">Homework due: {row.homeworkDue.map((h) => h.title).join(", ")}</p>
            )}
            {row.sessions.slice(0, 2).map((s) => (
              <p key={s.id} className="mt-1 text-xs text-night-600">
                Session {s.topic ?? ""} — {new Date(s.scheduledAt).toLocaleString()}
                {s.zoomUrl ? " · Zoom attached" : ""}
              </p>
            ))}
            {row.authorizedAnswers.length > 0 && (
              <div className="mt-3 rounded-xl bg-stone-50 p-3 dark:bg-white/5">
                <p className="text-xs font-bold uppercase">Counselor-authorized responses</p>
                {row.authorizedAnswers.slice(0, 3).map((a, i) => (
                  <p key={i} className="mt-1 text-xs">
                    {a.userName}: {a.moduleTitle} — {a.prompt.slice(0, 60)}…
                  </p>
                ))}
              </div>
            )}
            <Link
              href={`/marriage/counselor/journey/${row.journey.id}`}
              className={`${marriagePremium.primaryCta} mt-3 text-sm`}
            >
              Open couple dashboard
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
