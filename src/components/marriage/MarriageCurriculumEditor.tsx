"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import {
  QUESTION_TYPE_LABELS,
  cloneModules,
  createQuestion,
  reorder,
} from "@/lib/marriage-curriculum-editor-utils";
import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
  MarriageQuestionType,
} from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Snapshot = {
  published: { version: string; modules: MarriageModuleDefinition[] } | null;
  seedVersion: string;
  seedModuleCount: number;
  seedModules: MarriageModuleDefinition[];
  drafts: Array<{ id: string; version: string }>;
  versions: Array<{ id: string; version: string; status: string; publishedAt?: string }>;
};

export function MarriageCurriculumEditor() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [modules, setModules] = useState<MarriageModuleDefinition[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState("");
  const [draftId, setDraftId] = useState<string | undefined>();
  const [previewAnswersA, setPreviewAnswersA] = useState<Record<string, unknown>>({});
  const [previewAnswersB, setPreviewAnswersB] = useState<Record<string, unknown>>({});
  const [previewResult, setPreviewResult] = useState<{
    moduleTitle: string;
    items: Array<{ questionId?: string; prompt?: string }>;
  } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeModuleId) ?? modules[0] ?? null,
    [modules, activeModuleId],
  );
  const activeQuestion = useMemo(
    () => activeModule?.questions.find((q) => q.id === activeQuestionId) ?? activeModule?.questions[0] ?? null,
    [activeModule, activeQuestionId],
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/admin/curriculum", { cache: "no-store" });
    const data = await readJsonResponse<Snapshot & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Access denied.");
      return;
    }
    setSnapshot(data);
    const initial = data.published?.modules ?? data.seedModules ?? [];
    setModules(cloneModules(initial));
    setActiveModuleId(initial[0]?.id ?? null);
    setDraftVersion(data.published?.version ? `${data.published.version}-draft` : "2026.2-draft");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patchModule(moduleId: string, patch: Partial<MarriageModuleDefinition>) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)));
  }

  function patchQuestion(moduleId: string, questionId: string, patch: Partial<MarriageQuestionDefinition>) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          questions: m.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
        };
      }),
    );
  }

  async function saveDraft() {
    setNotice("");
    setError("");
    const res = await fetch("/api/marriage/admin/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_draft",
        id: draftId,
        version: draftVersion,
        modules,
        basedOnVersion: snapshot?.published?.version ?? snapshot?.seedVersion,
      }),
    });
    const data = await readJsonResponse<{ error?: string; draft?: { id: string } }>(res);
    if (!res.ok) setError(data.error ?? "Save failed.");
    else {
      setDraftId(data.draft?.id);
      setNotice("Draft saved.");
      await load();
    }
  }

  async function publish(draftIdToPublish: string) {
    const res = await fetch("/api/marriage/admin/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", draftId: draftIdToPublish }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Publish failed.");
    else {
      setNotice("Published. Existing submissions keep their content version.");
      await load();
    }
  }

  async function runPreviewCompare() {
    if (!activeModule) return;
    const res = await fetch("/api/marriage/admin/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "preview_compare",
        moduleId: activeModule.id,
        answerA: previewAnswersA,
        answerB: previewAnswersB,
      }),
    });
    const data = await readJsonResponse<{
      preview?: { moduleTitle: string; items: Array<{ questionId?: string; prompt?: string }> };
      error?: string;
    }>(res);
    if (!res.ok) setError(data.error ?? "Preview failed.");
    else setPreviewResult(data.preview ?? null);
  }

  if (error && !snapshot) {
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
    <div className="pb-24">
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Curriculum editor</h1>
      <p className={marriagePremium.cardMuted}>
        Published: {snapshot?.published?.version ?? `Built-in ${snapshot?.seedVersion}`} ·{" "}
        {snapshot?.seedModuleCount ?? 0} modules in catalog
      </p>
      {notice && <p className="mt-2 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-800">{error}</p>}

      <div className={`${marriagePremium.card} mt-4 grid gap-2 sm:grid-cols-2`}>
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          value={draftVersion}
          onChange={(e) => setDraftVersion(e.target.value)}
          placeholder="Draft version label"
        />
        <button type="button" className={marriagePremium.primaryCta} onClick={() => saveDraft()}>
          Save draft
        </button>
      </div>

      {snapshot?.drafts?.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {snapshot.drafts.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="rounded-full bg-clay-600 px-3 py-1 text-xs font-bold text-white"
                onClick={() => publish(d.id)}
              >
                Publish {d.version}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {snapshot?.versions?.filter((v) => v.status === "archived").length ? (
        <p className="mt-2 text-xs text-night-500">
          Version history:{" "}
          {snapshot.versions
            .filter((v) => v.status !== "draft")
            .map((v) => `${v.version} (${v.status})`)
            .join(" · ")}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className={marriagePremium.card}>
          <p className="font-semibold">Modules</p>
          <button
            type="button"
            className={`${marriagePremium.secondaryCta} mt-2 text-xs`}
            onClick={() => {
              const id = `mod-custom-${Date.now().toString(36).slice(-5)}`;
              const mod: MarriageModuleDefinition = {
                id,
                title: "New module",
                summary: "Summary",
                sortOrder: modules.length + 1,
                programTypes: ["premarital", "enrichment", "guided"],
                questions: [createQuestion(id, "single_choice")],
              };
              setModules((m) => [...m, mod]);
              setActiveModuleId(id);
            }}
          >
            Add module
          </button>
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
            {modules.map((mod, index) => (
              <li key={mod.id}>
                <button
                  type="button"
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    activeModule?.id === mod.id ? "border-clay-600 bg-clay-50" : "border-stone-200"
                  }`}
                  onClick={() => {
                    setActiveModuleId(mod.id);
                    setActiveQuestionId(mod.questions[0]?.id ?? null);
                  }}
                >
                  {mod.title}
                </button>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    className="text-xs underline"
                    disabled={index === 0}
                    onClick={() => setModules(reorder(modules, index, index - 1))}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="text-xs underline"
                    disabled={index === modules.length - 1}
                    onClick={() => setModules(reorder(modules, index, index + 1))}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-700 underline"
                    onClick={() => {
                      if (!confirm("Remove module from draft?")) return;
                      setModules(modules.filter((m) => m.id !== mod.id));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {activeModule && (
          <div className="space-y-4">
            <div className={marriagePremium.card}>
              <input
                className="w-full font-semibold"
                value={activeModule.title}
                onChange={(e) => patchModule(activeModule.id, { title: e.target.value })}
              />
              <textarea
                className="mt-2 w-full rounded-lg border px-2 py-1 text-sm"
                rows={2}
                value={activeModule.summary}
                onChange={(e) => patchModule(activeModule.id, { summary: e.target.value })}
              />
              <textarea
                className="mt-2 w-full rounded-lg border px-2 py-1 text-sm"
                rows={2}
                placeholder="Biblical reflection"
                value={activeModule.meta?.biblicalReflection ?? ""}
                onChange={(e) =>
                  patchModule(activeModule.id, {
                    meta: { ...activeModule.meta, biblicalReflection: e.target.value },
                  })
                }
              />
              <textarea
                className="mt-2 w-full rounded-lg border px-2 py-1 text-sm"
                rows={2}
                placeholder="Pastoral counseling guide"
                value={activeModule.meta?.pastoralGuide ?? ""}
                onChange={(e) =>
                  patchModule(activeModule.id, {
                    meta: { ...activeModule.meta, pastoralGuide: e.target.value },
                  })
                }
              />
            </div>

            <div className={marriagePremium.card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Questions</p>
                <select
                  className="rounded-lg border px-2 py-1 text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    const type = e.target.value as MarriageQuestionType;
                    if (!type) return;
                    const q = createQuestion(activeModule.id, type);
                    patchModule(activeModule.id, { questions: [...activeModule.questions, q] });
                    setActiveQuestionId(q.id);
                    e.target.value = "";
                  }}
                >
                  <option value="">Add question…</option>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {activeModule.questions.map((q, qi) => (
                  <li key={q.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`min-h-[44px] flex-1 rounded-lg px-2 py-1 text-left text-xs ${
                        activeQuestion?.id === q.id ? "bg-stone-200" : "bg-stone-50"
                      }`}
                      onClick={() => setActiveQuestionId(q.id)}
                    >
                      {q.prompt.slice(0, 48)}
                    </button>
                    <button
                      type="button"
                      className="text-xs"
                      disabled={qi === 0}
                      onClick={() =>
                        patchModule(activeModule.id, {
                          questions: reorder(activeModule.questions, qi, qi - 1),
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs"
                      disabled={qi === activeModule.questions.length - 1}
                      onClick={() =>
                        patchModule(activeModule.id, {
                          questions: reorder(activeModule.questions, qi, qi + 1),
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-700"
                      onClick={() => {
                        patchModule(activeModule.id, {
                          questions: activeModule.questions.filter((x) => x.id !== q.id),
                        });
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {activeQuestion && (
              <div className={marriagePremium.questionCard}>
                <p className="text-xs font-bold uppercase">{QUESTION_TYPE_LABELS[activeQuestion.type]}</p>
                <textarea
                  className="mt-2 w-full rounded-lg border px-2 py-2 text-sm"
                  rows={3}
                  value={activeQuestion.prompt}
                  onChange={(e) =>
                    patchQuestion(activeModule.id, activeQuestion.id, { prompt: e.target.value })
                  }
                />
                <label className="mt-2 block text-xs font-semibold">Visibility</label>
                <select
                  className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                  value={activeQuestion.visibility}
                  onChange={(e) =>
                    patchQuestion(activeModule.id, activeQuestion.id, {
                      visibility: e.target.value as MarriageQuestionDefinition["visibility"],
                    })
                  }
                >
                  <option value="shared_after_both_submit">Shared after both submit</option>
                  <option value="private_reflection">Private reflection</option>
                  <option value="counselor_with_consent">Counselor-only (consent)</option>
                  <option value="private_financial_disclosure">Private financial (never auto-shared)</option>
                </select>
                <textarea
                  className="mt-2 w-full rounded-lg border px-2 py-2 text-sm"
                  rows={2}
                  placeholder="Discussion prompt"
                  value={activeQuestion.discussionPrompt ?? ""}
                  onChange={(e) =>
                    patchQuestion(activeModule.id, activeQuestion.id, { discussionPrompt: e.target.value })
                  }
                />
                {(activeQuestion.type === "ranking" ||
                  activeQuestion.type === "priorities" ||
                  activeQuestion.type === "multiple_choice" ||
                  activeQuestion.options?.length) && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold">Answer options (id + label)</p>
                    {(activeQuestion.options ?? []).map((opt, oi) => (
                      <div key={opt.id} className="flex flex-wrap gap-2">
                        <input
                          className="w-24 rounded-lg border px-2 py-2 font-mono text-xs"
                          value={opt.id}
                          aria-label="Option id"
                          onChange={(e) => {
                            const options = [...(activeQuestion.options ?? [])];
                            options[oi] = { ...opt, id: e.target.value.trim() || opt.id };
                            patchQuestion(activeModule.id, activeQuestion.id, { options });
                          }}
                        />
                        <input
                          className="min-h-[44px] flex-1 rounded-lg border px-2 py-2 text-sm"
                          value={opt.label}
                          aria-label="Option label"
                          onChange={(e) => {
                            const options = [...(activeQuestion.options ?? [])];
                            options[oi] = { ...opt, label: e.target.value };
                            patchQuestion(activeModule.id, activeQuestion.id, { options });
                          }}
                        />
                        <button
                          type="button"
                          className="min-h-[44px] px-2 text-xs text-red-700"
                          onClick={() => {
                            const options = (activeQuestion.options ?? []).filter((_, i) => i !== oi);
                            patchQuestion(activeModule.id, activeQuestion.id, { options });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={`${marriagePremium.secondaryCta} text-xs`}
                      onClick={() => {
                        const options = [...(activeQuestion.options ?? [])];
                        const nextId = `opt-${options.length + 1}`;
                        options.push({ id: nextId, label: "New option" });
                        patchQuestion(activeModule.id, activeQuestion.id, { options });
                      }}
                    >
                      Add option
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className={marriagePremium.card}>
              <p className="font-semibold">Preview comparison (sample answers)</p>
              <p className={`${marriagePremium.cardMuted} text-xs`}>
                Enter sample answer keys matching question ids in JSON-ish fields for quick preview.
              </p>
              <textarea
                className="mt-2 w-full rounded-lg border px-2 py-1 font-mono text-xs"
                rows={3}
                placeholder='Partner A JSON e.g. {"q-id":"a"}'
                onChange={(e) => {
                  try {
                    setPreviewAnswersA(JSON.parse(e.target.value || "{}"));
                  } catch {
                    /* ignore while typing */
                  }
                }}
              />
              <textarea
                className="mt-2 w-full rounded-lg border px-2 py-1 font-mono text-xs"
                rows={3}
                placeholder='Partner B JSON'
                onChange={(e) => {
                  try {
                    setPreviewAnswersB(JSON.parse(e.target.value || "{}"));
                  } catch {
                    /* ignore */
                  }
                }}
              />
              <button type="button" className={`${marriagePremium.secondaryCta} mt-2`} onClick={() => runPreviewCompare()}>
                Preview compare
              </button>
              {previewResult && (
                <ul className="mt-3 space-y-2 text-xs">
                  {previewResult.items.map((item: { questionId?: string; prompt?: string }, i) => (
                    <li key={i} className="rounded-lg bg-stone-50 p-2">
                      {item.prompt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
