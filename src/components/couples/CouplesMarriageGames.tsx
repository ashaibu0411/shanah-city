"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import {
  BIBLE_TRIVIA,
  CONVERSATION_PROMPTS,
  COUPLE_GAME_CATALOG,
  KNOW_SPOUSE_QUESTIONS,
  THIS_OR_THAT,
  WEEKLY_CHALLENGES,
  pickRandom,
  type CoupleGameId,
} from "@/lib/couple-games-catalog";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

export function CouplesMarriageGames() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<CoupleGameId | null>(null);
  const [knowIndex, setKnowIndex] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [showTriviaAnswer, setShowTriviaAnswer] = useState(false);
  const [conversationPrompt, setConversationPrompt] = useState("");
  const [thisOrThat, setThisOrThat] = useState(THIS_OR_THAT[0]);
  const [weeklyChallenge, setWeeklyChallenge] = useState(WEEKLY_CHALLENGES[0]);

  const knowQuestions = useMemo(
    () => [...KNOW_SPOUSE_QUESTIONS].sort(() => Math.random() - 0.5),
    [activeGame],
  );

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

  function openGame(id: CoupleGameId) {
    setActiveGame(id);
    setKnowIndex(0);
    setTriviaIndex(0);
    setShowTriviaAnswer(false);
    setConversationPrompt(pickRandom(CONVERSATION_PROMPTS));
    setThisOrThat(pickRandom(THIS_OR_THAT));
    setWeeklyChallenge(pickRandom(WEEKLY_CHALLENGES));
  }

  function closeGame() {
    setActiveGame(null);
  }

  const activeMeta = COUPLE_GAME_CATALOG.find((g) => g.id === activeGame);

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
            {COUPLE_GAME_CATALOG.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  className={`${couplesHubPremium.sheetListRow} transition hover:border-stone-300`}
                  onClick={() => openGame(game.id)}
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
        </>
      )}

      {activeGame && activeMeta && !locked ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="couple-game-title"
        >
          <div className={`${couplesHubPremium.sheetModal} max-w-md`}>
            <div className="flex items-start justify-between gap-2">
              <h2 id="couple-game-title" className="font-display text-lg font-semibold text-stone-900">
                {activeMeta.emoji} {activeMeta.title}
              </h2>
              <button
                type="button"
                className="text-sm font-semibold text-stone-500"
                onClick={closeGame}
              >
                Close
              </button>
            </div>

            {activeGame === "know-spouse" ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-stone-800">
                  {knowQuestions[knowIndex % knowQuestions.length]}
                </p>
                <p className="mt-2 text-xs text-[var(--couples-sheet-muted)]">
                  Take turns answering — no grades, just connection.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setKnowIndex((i) => i + 1)}
                >
                  Next question
                </Button>
              </div>
            ) : null}

            {activeGame === "bible-trivia" ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-stone-900">
                  {BIBLE_TRIVIA[triviaIndex % BIBLE_TRIVIA.length].question}
                </p>
                {showTriviaAnswer ? (
                  <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-stone-800">
                    <p>{BIBLE_TRIVIA[triviaIndex % BIBLE_TRIVIA.length].answer}</p>
                    <p className="mt-1 text-xs font-semibold text-amber-900">
                      {BIBLE_TRIVIA[triviaIndex % BIBLE_TRIVIA.length].reference}
                    </p>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-2">
                  {!showTriviaAnswer ? (
                    <Button className="w-full" onClick={() => setShowTriviaAnswer(true)}>
                      Reveal answer
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setShowTriviaAnswer(false);
                        setTriviaIndex((i) => i + 1);
                      }}
                    >
                      Next question
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {activeGame === "conversation" ? (
              <div className="mt-4">
                <p className="rounded-xl bg-violet-50 px-4 py-4 text-center text-base font-medium leading-relaxed text-stone-900">
                  {conversationPrompt}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setConversationPrompt(pickRandom(CONVERSATION_PROMPTS))}
                >
                  Another prompt
                </Button>
              </div>
            ) : null}

            {activeGame === "this-or-that" ? (
              <div className="mt-4">
                <p className="text-center text-xs font-bold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
                  Pick one — then compare
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    className={`${couplesHubPremium.sheetCard} text-left font-semibold`}
                    onClick={() => setThisOrThat(pickRandom(THIS_OR_THAT))}
                  >
                    {thisOrThat.a}
                  </button>
                  <button
                    type="button"
                    className={`${couplesHubPremium.sheetCard} text-left font-semibold`}
                    onClick={() => setThisOrThat(pickRandom(THIS_OR_THAT))}
                  >
                    {thisOrThat.b}
                  </button>
                </div>
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => setThisOrThat(pickRandom(THIS_OR_THAT))}
                >
                  New pair
                </Button>
              </div>
            ) : null}

            {activeGame === "weekly" ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-stone-800">{weeklyChallenge}</p>
                <p className="mt-2 text-xs text-[var(--couples-sheet-muted)]">
                  Try it before next Sunday — then pick another challenge.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setWeeklyChallenge(pickRandom(WEEKLY_CHALLENGES))}
                >
                  New challenge
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </CouplesHubScreen>
  );
}
