"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium, COUPLES_DEVOTIONAL_HERO } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

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
        const todayId =
          typeof data.todayDevotionalId === "string" ? data.todayDevotionalId : list[0]?.id ?? null;
        setDevotionals(list);
        setCanManage(Boolean(data.canManageMarriageMinistry));
        setSelectedId((current) => current ?? todayId);
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

  const showGate = !hub?.hasActiveLink && !canManage;

  return (
    <CouplesHubScreen
      title="Devotionals"
      hero={
        <CouplesHubHero
          flush
          imageSrc={COUPLES_DEVOTIONAL_HERO}
          title="Grow together in God's Word"
          tagline="Same daily devotions as the rest of the church — track reading together."
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
              onChange={(id) => setViewTab(id)}
            />
            {canManage ? (
              <Link
                href="/admin/devotions"
                className="mt-3 flex w-full items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
              >
                Manage church devotions
              </Link>
            ) : null}

            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : devotionals.length === 0 ? (
              <p className={`${couplesHubPremium.sheetStatusInfo} mt-8`}>
                {canManage
                  ? "No published devotions yet. Add one in Admin → Devotions."
                  : "Check back soon for new content."}
              </p>
            ) : viewTab === "daily" && selected ? (
              <article className="mt-5">
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
                <Link
                  href={`/devotions/${selected.id}`}
                  className={`${couplesHubPremium.sheetPrimaryCta} mt-6 block text-center`}
                >
                  Read today&apos;s devotional
                </Link>
                {hub?.hasActiveLink ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-center text-xs text-[var(--couples-sheet-muted)]">
                      {selected.readByMe ? "You marked this as read." : "After you read, mark it so your spouse can see."}
                      {selected.readBySpouse ? " Your spouse has read it." : ""}
                    </p>
                    {!selected.readByMe ? (
                      <Button className="w-full" disabled={busy} onClick={() => void markRead(selected.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ) : (
              <ul className="mt-5 space-y-2">
                {listForTab.length === 0 ? (
                  <li className={`${couplesHubPremium.sheetStatusInfo} mt-4`}>
                    {viewTab === "progress"
                      ? "No devotions marked read yet. Read together from Daily, then mark as read."
                      : "No devotions to show."}
                  </li>
                ) : null}
                {listForTab.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/devotions/${entry.id}`} className={couplesHubPremium.sheetListRow}>
                      <span className={`${couplesHubPremium.iconCircle} couples-tile-tone-devotionals`}>📖</span>
                      <span className="min-w-0 flex-1 text-left">
                        <p className="font-semibold text-stone-900">{entry.title}</p>
                        <p className="text-xs text-[var(--couples-sheet-muted)]">{entry.publishDate}</p>
                        {hub?.hasActiveLink ? (
                          <p className="mt-0.5 text-xs text-[var(--couples-sheet-muted)]">
                            <ReadProgressLabel readByMe={entry.readByMe} readBySpouse={entry.readBySpouse} />
                          </p>
                        ) : null}
                      </span>
                      <span className="text-stone-400" aria-hidden>›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

    </CouplesHubScreen>
  );
}

function ReadProgressLabel({
  readByMe,
  readBySpouse,
}: {
  readByMe: boolean;
  readBySpouse: boolean;
}) {
  const you = readByMe ? "You read" : "You haven’t read";
  const spouse = readBySpouse ? "Spouse read" : "Spouse hasn’t read";
  return <>{you} · {spouse}</>;
}
