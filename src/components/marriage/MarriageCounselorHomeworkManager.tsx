"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MarriageCounselorSessionDateTimeField } from "@/components/marriage/MarriageCounselorSessionDateTimeField";
import { MarriageHomeworkTimingLines } from "@/components/marriage/MarriageHomeworkTimingLines";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageCounselorHomeworkListItem } from "@/lib/marriage-homework-types";
import type { MarriageHomeworkTemplateSummary } from "@/lib/marriage-homework-types";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";

function statusBadge(status: string) {
  const base = "rounded-full px-2 py-0.5 text-xs font-bold capitalize";
  if (status === "submitted") return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100`;
  if (status === "overdue") return `${base} bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100`;
  if (status === "in_progress") return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100`;
  return `${base} bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-sand-200`;
}

type DetailPartner = {
  userId: string;
  name: string;
  status: string;
  submittedAt?: string;
  answers: Record<string, string>;
  feedback?: string;
};

type HomeworkDetail = {
  homework: {
    id: string;
    title: string;
    instructions?: string;
    status: string;
    dueAt?: string;
    dueAtTimeZone?: string;
    activities: Array<{
      id: string;
      kind: string;
      title: string;
      instructions?: string;
      discussionPrompt?: string;
      scriptureRefs?: string[];
      moduleIds?: string[];
      optionalModuleIds?: string[];
      questions: Array<{ id: string; prompt: string }>;
    }>;
    counselorPrivateNotes?: string;
    partnerFeedback?: Record<string, string>;
  };
  partnerViews: DetailPartner[];
};

export function MarriageCounselorHomeworkManager({
  journeyId,
  initialTemplateKey,
}: {
  journeyId: string;
  initialTemplateKey?: string;
}) {
  const [items, setItems] = useState<MarriageCounselorHomeworkListItem[]>([]);
  const [templates, setTemplates] = useState<MarriageHomeworkTemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<HomeworkDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    initialTemplateKey ?? null,
  );

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/marriage/counselor/homework?journeyId=${encodeURIComponent(journeyId)}`, {
      cache: "no-store",
    });
    const data = await readJsonResponse<{ items?: MarriageCounselorHomeworkListItem[]; error?: string }>(res);
    if (res.ok && data.items) setItems(data.items);
  }, [journeyId]);

  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/marriage/counselor/homework", { cache: "no-store" });
    const data = await readJsonResponse<{ templates?: MarriageHomeworkTemplateSummary[] }>(res);
    if (res.ok && data.templates) setTemplates(data.templates);
  }, []);

  const loadDetail = useCallback(async (homeworkId: string) => {
    const res = await fetch(`/api/marriage/counselor/homework/${homeworkId}`, { cache: "no-store" });
    const data = await readJsonResponse<HomeworkDetail & { error?: string }>(res);
    if (!res.ok) return;
    setDetail(data);
    setNotes(data.homework.counselorPrivateNotes ?? "");
    const fb: Record<string, string> = {};
    for (const p of data.partnerViews) {
      fb[p.userId] = p.feedback ?? data.homework.partnerFeedback?.[p.userId] ?? "";
    }
    setFeedbackDraft(fb);
  }, []);

  useEffect(() => {
    void loadList();
    void loadTemplates();
  }, [loadList, loadTemplates]);

  useEffect(() => {
    if (!initialTemplateKey) return;
    setSelectedTemplateKey(initialTemplateKey);
    const existing = items.find((i) => i.templateKey === initialTemplateKey);
    if (existing) setSelectedId(existing.id);
  }, [initialTemplateKey, items]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  async function createFromTemplate(templateKey: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/marriage/counselor/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, templateKey }),
      });
      const data = await readJsonResponse<{ homework?: { id: string }; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not create homework.");
      await loadList();
      if (data.homework?.id) setSelectedId(data.homework.id);
      setMessage("Draft created. Review and release when ready.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(form: HTMLFormElement) {
    if (!selectedId) return;
    setBusy(true);
    setMessage("");
    const fd = new FormData(form);
    try {
      const res = await fetch(`/api/marriage/counselor/homework/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          dueAtLocal: String(fd.get("dueAtLocal") ?? ""),
          counselorPrivateNotes: notes,
          partnerFeedback: feedbackDraft,
        }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setMessage("Saved.");
      await loadList();
      await loadDetail(selectedId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!selectedId) return;
    if (!confirm("Release this homework to both partners? They will be able to start answering.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/marriage/counselor/homework/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Release failed.");
      setMessage("Released to couple.");
      await loadList();
      await loadDetail(selectedId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/marriage/counselor/homework/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Reopen failed.");
      setMessage("Reopened for revision.");
      await loadList();
      await loadDetail(selectedId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="marriage-c3m-panel mt-6">
      <h2 className="marriage-c3m-section-title">Homework manager</h2>
      <p className="marriage-c3m-muted mt-1 text-xs">
        Draft homework stays hidden until you release it. Templates do not auto-assign to couples.
      </p>

      <p className="marriage-c3m-muted mt-3 text-sm">Select a template to preview timing. Nothing is saved until you create a draft.</p>
      <div className="mt-3 flex flex-col gap-2">
        {templates.map((t) => {
          const active = selectedTemplateKey === t.key;
          const existing = items.find((i) => i.templateKey === t.key);
          return (
            <button
              key={t.key}
              type="button"
              disabled={busy}
              className={`min-h-[44px] w-full rounded-xl border px-3 py-3 text-left text-sm ${
                active
                  ? "border-[#B85C38] bg-[#F7F4EF] dark:border-clay-500 dark:bg-white/5"
                  : "border-[#E8E2DA] dark:border-white/10"
              }`}
              onClick={() => {
                setSelectedTemplateKey(t.key);
                if (existing) setSelectedId(existing.id);
                else setSelectedId(null);
              }}
            >
              <span className="block font-semibold">{t.title}</span>
              <MarriageHomeworkTimingLines
                className="mt-1"
                assignedAfterLabel={t.assignedAfterLabel}
                preparingForLabel={t.preparingForLabel}
                postProgramNote={t.postProgramNote}
                estimatedMinutes={t.estimatedMinutes}
              />
              {existing ? (
                <span className="mt-1 block text-xs font-semibold capitalize text-clay-800 dark:text-clay-200">
                  Existing: {existing.status}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedTemplateKey && !items.some((i) => i.templateKey === selectedTemplateKey) ? (
        <div className="mt-4 rounded-xl border border-[#E8E2DA] bg-[#F7F4EF] px-3 py-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold">Ready to create a draft?</p>
          <p className="marriage-c3m-muted mt-1 text-xs">
            Couples cannot see this homework until you review and release it.
          </p>
          <button
            type="button"
            disabled={busy}
            className="marriage-c3m-btn-primary mt-3 min-h-[44px] w-full sm:w-auto"
            onClick={() => void createFromTemplate(selectedTemplateKey)}
          >
            Create homework draft
          </button>
        </div>
      ) : null}

      {selectedTemplateKey && items.some((i) => i.templateKey === selectedTemplateKey && i.status === "released") ? (
        <p className="mt-3 text-sm text-clay-800 dark:text-clay-200">
          This template is already released for this couple. Select it in the list below to review submissions.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${
                  selectedId === item.id
                    ? "border-[#B85C38] bg-[#F7F4EF] dark:border-clay-500 dark:bg-white/5"
                    : "border-[#E8E2DA] dark:border-white/10"
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <p className="font-semibold">{item.title}</p>
                <p className="marriage-c3m-muted mt-0.5 text-xs capitalize">
                  {item.status}
                  {item.dueAt
                    ? ` · Due ${formatMarriageSessionScheduledAt(item.dueAt, item.dueAtTimeZone)}`
                    : ""}
                </p>
                <p className="mt-1 text-xs">
                  {item.partnerA.name}: <span className={statusBadge(item.partnerA.status)}>{item.partnerA.status.replace(/_/g, " ")}</span>
                  {" · "}
                  {item.partnerB.name}: <span className={statusBadge(item.partnerB.status)}>{item.partnerB.status.replace(/_/g, " ")}</span>
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="marriage-c3m-muted mt-3 text-sm">No session homework yet.</p>
      )}

      {detail && (
        <div className="mt-6 space-y-4 border-t border-[#E8E2DA] pt-4 dark:border-white/10">
          <p className="font-semibold">{detail.homework.title}</p>
          {detail.homework.instructions ? (
            <p className="text-sm whitespace-pre-wrap">{detail.homework.instructions}</p>
          ) : null}
          <ol className="space-y-3 text-sm">
            {detail.homework.activities.map((act) => (
              <li key={act.id} className="rounded-xl border border-[#E8E2DA] p-3 dark:border-white/10">
                <p className="font-semibold">{act.title}</p>
                {act.instructions ? <p className="mt-1 text-xs">{act.instructions}</p> : null}
                {act.discussionPrompt ? (
                  <p className="mt-2 text-xs italic">Discuss: {act.discussionPrompt}</p>
                ) : null}
                {act.scriptureRefs?.length ? (
                  <p className="mt-1 text-xs">Read: {act.scriptureRefs.join("; ")}</p>
                ) : null}
                {act.moduleIds?.length ? (
                  <p className="mt-1 text-xs">
                    Modules: {act.moduleIds.join(", ")}
                    {act.optionalModuleIds?.length ? ` (optional: ${act.optionalModuleIds.join(", ")})` : ""}
                  </p>
                ) : null}
                {act.questions.length > 0 && (
                  <ul className="mt-2 list-decimal pl-4 text-xs">
                    {act.questions.map((q) => (
                      <li key={q.id}>{q.prompt}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          <form
            className="marriage-c3m-form"
            onSubmit={(e) => {
              e.preventDefault();
              void saveDraft(e.currentTarget);
            }}
          >
            <MarriageCounselorSessionDateTimeField
              name="dueAtLocal"
              label="Due date & time (optional)"
              inputClassName="marriage-c3m-input"
            />
            <label className="text-sm font-semibold">Private pastoral notes</label>
            <textarea
              className="marriage-c3m-textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Not visible to the couple"
            />
            {detail.partnerViews.map((p) => (
              <div key={p.userId}>
                <label className="text-sm font-semibold">Feedback for {p.name} (shared with them)</label>
                <textarea
                  className="marriage-c3m-textarea"
                  rows={3}
                  value={feedbackDraft[p.userId] ?? ""}
                  onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [p.userId]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px]">
                Save draft
              </button>
              {detail.homework.status === "draft" ? (
                <button type="button" disabled={busy} className="marriage-c3m-btn-primary min-h-[44px]" onClick={() => void release()}>
                  Release to couple
                </button>
              ) : (
                <button type="button" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px]" onClick={() => void reopen()}>
                  Reopen for revision
                </button>
              )}
            </div>
          </form>

          {detail.homework.status === "released" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Submitted responses</p>
              {detail.partnerViews.map((p) => (
                <div key={p.userId} className="rounded-xl border border-[#E8E2DA] p-3 dark:border-white/10">
                  <p className="font-semibold">
                    {p.name}{" "}
                    <span className={statusBadge(p.status)}>{p.status.replace(/_/g, " ")}</span>
                  </p>
                  {Object.keys(p.answers).length === 0 ? (
                    <p className="marriage-c3m-muted mt-2 text-xs">No answers yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm">
                      {Object.entries(p.answers).map(([key, value]) => (
                        <li key={key}>
                          <p className="text-xs font-bold uppercase text-night-500">{key}</p>
                          <p className="whitespace-pre-wrap">{value}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {message ? <p className="mt-3 text-sm font-semibold text-clay-800 dark:text-clay-200">{message}</p> : null}
      <Link href={`/marriage/counselor/journey/${journeyId}`} className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
        Back to journey
      </Link>
    </section>
  );
}
