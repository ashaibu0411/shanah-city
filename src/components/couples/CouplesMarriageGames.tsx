"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

const GAME_CATALOG = [
  { id: "know-spouse", emoji: "💑", title: "How well do you know your spouse?", subtitle: "Quick questions about favorites and memories" },
  { id: "bible-trivia", emoji: "📖", title: "Marriage Bible trivia", subtitle: "Scripture and wisdom for couples" },
  { id: "conversation", emoji: "💬", title: "Conversation cards", subtitle: "Meaningful prompts to go deeper" },
  { id: "this-or-that", emoji: "⚖️", title: "This or that", subtitle: "Playful choices — no wrong answers" },
  { id: "weekly", emoji: "🏆", title: "Challenge of the week", subtitle: "One fun assignment to try together" },
] as const;

export function CouplesMarriageGames() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const locked = !hub?.hasActiveLink;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  return (
    <CouplesHubScreen title="Couples games">
      {locked ? (
        <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
      ) : loading ? (
        <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
      ) : (
        <>
          <div className={couplesHubPremium.gamesHeroBanner}>
            <p className="text-4xl" aria-hidden>🏆</p>
            <p className="mt-2 font-display text-xl font-semibold">Have fun. Get closer.</p>
            <p className="mt-1 text-sm text-white/85">
              Games and challenges designed to help you know, love, and grow together.
            </p>
          </div>

          <ul className="mt-6 space-y-2">
            {GAME_CATALOG.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  className={`${couplesHubPremium.sheetListRow} transition hover:border-stone-300`}
                  onClick={() => undefined}
                >
                  <span className={`${couplesHubPremium.iconCircle} bg-violet-100 text-xl`}>
                    {game.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{game.title}</p>
                    <p className="text-xs text-[var(--couples-sheet-muted)]">{game.subtitle}</p>
                  </span>
                  <span className="text-stone-400" aria-hidden>›</span>
                </button>
              </li>
            ))}
          </ul>

          <p className={`${couplesHubPremium.sheetStatusInfo} mt-6`}>
            Interactive game flows are coming soon. Your progress will stay private to your marriage
            workspace.
          </p>
        </>
      )}
    </CouplesHubScreen>
  );
}
