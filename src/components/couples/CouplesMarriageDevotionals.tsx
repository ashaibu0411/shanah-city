"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { CouplesSubpageHeader } from "@/components/couples/CouplesSubpageHeader";
import { couplesHubPremium, COUPLES_DEVOTIONAL_HERO } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

const EMPTY_FORM = {
  publishDate: "",
  title: "",
  scripture: "",
  teaching: "",
  discussion: "",
  assignment: "",
  prayer: "",
  declaration: "",
  published: true,
};

export function CouplesMarriageDevotionals() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [devotionals, setDevotionals] = useState<CoupleMarriageDevotionalView[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"daily" | "progress">("daily");
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const listForTab =
    viewTab === "progress" ? devotionals.filter((d) => d.readByMe || d.readBySpouse) : devotionals;
  const selected =
    listForTab.find((d) => d.id === selectedId) ?? listForTab[0] ?? devotionals[0] ?? null;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadDevotionals = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/devotionals")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load devotionals.");
        const list = Array.isArray(data.devotionals) ? data.devotionals : [];
        setDevotionals(list);
        setCanManage(Boolean(data.canManageMarriageMinistry));
        setSelectedId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load devotionals.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    void loadDevotionals();
  }, [loadDevotionals]);

  async function markRead(devotionalId: string) {
    if (!hub?.hasActiveLink) return;
    setBusy(true);
    const response = await fetch("/api/couples/devotionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", devotionalId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      setDevotionals(Array.isArray(data.devotionals) ? data.devotionals : []);
      setCanManage(Boolean(data.canManageMarriageMinistry));
    }
  }

  async function publishDevotional() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/devotionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", ...form }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not publish.");
      return;
    }
    setEditorOpen(false);
    setForm(EMPTY_FORM);
    setStatus("Devotional published.");
    await loadDevotionals();
  }

  const showGate = !hub?.hasActiveLink && !canManage;

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <CouplesSubpageHeader
          title="Devotionals"
          subtitle="Grow together in God's Word — read, discuss, and mark progress."
        />

        <CouplesHubHero
          imageSrc={COUPLES_DEVOTIONAL_HERO}
          title="Grow together in God's Word"
          tagline="Daily marriage devotionals with scripture, discussion, and prayer."
        />

        {showGate ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CouplesHubTabRow
                tabs={[
                  { id: "daily", label: "Daily" },
                  { id: "progress", label: "My progress" },
                ]}
                active={viewTab}
                onChange={setViewTab}
              />
              {canManage ? (
                <Button onClick={() => setEditorOpen(true)} disabled={busy}>
                  Publish
                </Button>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
            ) : devotionals.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-night-900/15 px-4 py-8 text-center text-sm text-night-600">
                {canManage ? "No devotionals yet. Publish the first one." : "Check back soon for new content."}
              </p>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <ul className="space-y-2">
                  {listForTab.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${
                          selected?.id === entry.id
                            ? "bg-night-900 text-white dark:bg-sand-100 dark:text-night-950"
                            : "bg-white ring-1 ring-night-900/10 dark:bg-[var(--color-surface)]"
                        }`}
                      >
                        <p className="font-semibold">{entry.title}</p>
                        <p className="text-xs opacity-80">{entry.publishDate}</p>
                        {hub?.hasActiveLink ? (
                          <p className="mt-1 text-xs">
                            {entry.readByMe ? "You read" : "Not read"}
                            {entry.readBySpouse ? " · Spouse read" : ""}
                          </p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>

                {selected ? (
                  <article className={`${couplesHubPremium.card} p-5`}>
                    <p className="text-xs font-bold uppercase text-night-500">{selected.publishDate}</p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-night-950 dark:text-sand-100">
                      {selected.title}
                    </h2>
                    <Section title="Scripture" body={selected.scripture} />
                    <Section title="Teaching" body={selected.teaching} />
                    <Section title="Discussion" body={selected.discussion} />
                    <Section title="Assignment" body={selected.assignment} />
                    <Section title="Prayer" body={selected.prayer} />
                    <Section title="Declaration" body={selected.declaration} />
                    {hub?.hasActiveLink && !selected.readByMe ? (
                      <Button className="mt-4" disabled={busy} onClick={() => void markRead(selected.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </article>
                ) : null}
              </div>
            )}

            {status ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

        {editorOpen && canManage ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/40 p-4 sm:items-center">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-[var(--color-surface)]">
              <h2 className="font-display text-lg font-semibold">Publish devotional</h2>
              {(["publishDate", "title", "scripture"] as const).map((field) => (
                <label key={field} className="mt-3 block text-sm capitalize">
                  <span className="font-semibold">{field === "publishDate" ? "Publish date" : field}</span>
                  <input
                    type={field === "publishDate" ? "date" : "text"}
                    className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                    value={form[field]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                </label>
              ))}
              {(["teaching", "discussion", "assignment", "prayer", "declaration"] as const).map((field) => (
                <label key={field} className="mt-3 block text-sm capitalize">
                  <span className="font-semibold">{field}</span>
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                    value={form[field]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                </label>
              ))}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
                />
                Published (visible to couples)
              </label>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void publishDevotional()}>
                  Publish
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body?.trim()) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-night-500">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-night-800 dark:text-sand-200">
        {body}
      </p>
    </div>
  );
}
