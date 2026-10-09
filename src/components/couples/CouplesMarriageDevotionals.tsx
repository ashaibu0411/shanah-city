"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
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
  const [viewTab, setViewTab] = useState<"daily" | "plans" | "progress">("daily");
  const [readingOpen, setReadingOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const listForTab =
    viewTab === "progress"
      ? devotionals.filter((d) => d.readByMe || d.readBySpouse)
      : devotionals;
  const selected =
    devotionals.find((d) => d.id === selectedId) ?? devotionals[0] ?? null;

  const scripturePreview = selected?.scripture?.trim().split("\n").filter(Boolean)[0] ?? "";

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
    <CouplesHubScreen
      title="Devotionals"
      hero={
        <CouplesHubHero
          flush
          imageSrc={COUPLES_DEVOTIONAL_HERO}
          title="Grow together in God's Word"
          tagline="Daily devotionals for a stronger marriage."
        />
      }
    >
        {showGate ? (
          <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
        ) : (
          <>
            <CouplesHubTabRow
              variant="sheet"
              tabs={[
                { id: "daily", label: "Daily" },
                { id: "plans", label: "Plans" },
                { id: "progress", label: "My progress" },
              ]}
              active={viewTab}
              onChange={(id) => {
                setViewTab(id);
                setReadingOpen(false);
              }}
            />
            {canManage ? (
              <Button className="mt-3 w-full" onClick={() => setEditorOpen(true)} disabled={busy}>
                Publish devotional
              </Button>
            ) : null}

            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : devotionals.length === 0 ? (
              <p className={`${couplesHubPremium.sheetStatusInfo} mt-8`}>
                {canManage ? "No devotionals yet. Publish the first one." : "Check back soon for new content."}
              </p>
            ) : viewTab === "daily" && selected ? (
              <article className="mt-5">
                {!readingOpen ? (
                  <>
                    <p className="text-sm font-medium text-stone-700">Today&apos;s devotional</p>
                    <p className="text-xs text-[var(--couples-sheet-muted)]">{selected.publishDate}</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">{selected.title}</h2>
                    {scripturePreview ? (
                      <p className="mt-2 text-sm text-[var(--couples-sheet-muted)]">{scripturePreview}</p>
                    ) : null}
                    {selected.scripture ? (
                      <p className="mt-3 text-sm italic leading-relaxed text-stone-800">
                        {selected.scripture.split("\n").slice(1).join(" ").trim() ||
                          selected.scripture.split("\n")[0]}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className={`${couplesHubPremium.sheetPrimaryCta} mt-6`}
                      onClick={() => setReadingOpen(true)}
                    >
                      Read today&apos;s devotional
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="mb-4 text-sm font-semibold text-stone-600"
                      onClick={() => setReadingOpen(false)}
                    >
                      ← Back to preview
                    </button>
                    <p className="text-xs font-bold uppercase text-[var(--couples-sheet-muted)]">
                      {selected.publishDate}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">{selected.title}</h2>
                    <Section title="Scripture" body={selected.scripture} />
                    <Section title="Teaching" body={selected.teaching} />
                    <Section title="Discussion" body={selected.discussion} />
                    <Section title="Assignment" body={selected.assignment} />
                    <Section title="Prayer" body={selected.prayer} />
                    <Section title="Declaration" body={selected.declaration} />
                    {hub?.hasActiveLink && !selected.readByMe ? (
                      <Button className="mt-4 w-full" disabled={busy} onClick={() => void markRead(selected.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </>
                )}
              </article>
            ) : (
              <ul className="mt-5 space-y-2">
                {listForTab.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(entry.id);
                        setViewTab("daily");
                        setReadingOpen(true);
                      }}
                      className={couplesHubPremium.sheetListRow}
                    >
                      <span className={`${couplesHubPremium.iconCircle} couples-tile-tone-devotionals`}>📖</span>
                      <span className="min-w-0 flex-1 text-left">
                        <p className="font-semibold text-stone-900">{entry.title}</p>
                        <p className="text-xs text-[var(--couples-sheet-muted)]">{entry.publishDate}</p>
                        {hub?.hasActiveLink ? (
                          <p className="mt-0.5 text-xs text-[var(--couples-sheet-muted)]">
                            {entry.readByMe ? "You read" : "Not read"}
                            {entry.readBySpouse ? " · Spouse read" : ""}
                          </p>
                        ) : null}
                      </span>
                      <span className="text-stone-400" aria-hidden>›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

        {editorOpen && canManage ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className={`${couplesHubPremium.sheetModal} max-w-lg`}>
              <h2 className="font-display text-lg font-semibold text-stone-900">Publish devotional</h2>
              {(["publishDate", "title", "scripture"] as const).map((field) => (
                <label key={field} className="mt-3 block text-sm capitalize">
                  <span className="font-semibold">{field === "publishDate" ? "Publish date" : field}</span>
                  <input
                    type={field === "publishDate" ? "date" : "text"}
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form[field]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                </label>
              ))}
              {(["teaching", "discussion", "assignment", "prayer", "declaration"] as const).map((field) => (
                <label key={field} className="mt-3 block text-sm capitalize">
                  <span className="font-semibold text-[var(--couples-text-muted)]">{field}</span>
                  <textarea
                    rows={3}
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
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

    </CouplesHubScreen>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body?.trim()) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--couples-sheet-muted)]">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
        {body}
      </p>
    </div>
  );
}
