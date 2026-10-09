"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesGameOverlay } from "@/components/couples/CouplesGameOverlay";
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
  shuffleDeck,
  type CoupleGameId,
} from "@/lib/couple-games-catalog";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function progressLabel(index: number, total: number) {
  return `Card ${Math.min(index + 1, total)} of ${total}`;
}

export function CouplesMarriageGames() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<CoupleGameId | null>(null);

  const [knowDeck, setKnowDeck] = useState<string[]>([]);
  const [knowIndex, setKnowIndex] = useState(0);

  const [triviaDeck, setTriviaDeck] = useState<typeof BIBLE_TRIVIA>([]);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [showTriviaAnswer, setShowTriviaAnswer] = useState(false);

  const [conversationDeck, setConversationDeck] = useState<string[]>([]);
  const [conversationIndex, setConversationIndex] = useState(0);

  const [thisOrThatDeck, setThisOrThatDeck] = useState<typeof THIS_OR_THAT>([]);
  const [thisOrThatIndex, setThisOrThatIndex] = useState(0);

  const [weeklyDeck, setWeeklyDeck] = useState<string[]>([]);
  const [weeklyIndex, setWeeklyIndex] = useState(0);

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

  function advanceDeck<T>(deck: T[], index: number, setDeck: (d: T[]) => void, setIndex: (i: number) => void) {
    if (index + 1 < deck.length) {
      setIndex(index + 1);
      return;
    }
    setDeck(shuffleDeck(deck));
    setIndex(0);
  }

  function openGame(id: CoupleGameId) {
    setActiveGame(id);
    setKnowDeck(shuffleDeck(KNOW_SPOUSE_QUESTIONS));
    setKnowIndex(0);
    setTriviaDeck(shuffleDeck(BIBLE_TRIVIA));
    setTriviaIndex(0);
    setShowTriviaAnswer(false);
    setConversationDeck(shuffleDeck(CONVERSATION_PROMPTS));
    setConversationIndex(0);
    setThisOrThatDeck(shuffleDeck(THIS_OR_THAT));
    setThisOrThatIndex(0);
    setWeeklyDeck(shuffleDeck(WEEKLY_CHALLENGES));
    setWeeklyIndex(0);
  }

  function closeGame() {
    setActiveGame(null);
  }

  const activeMeta = COUPLE_GAME_CATALOG.find((g) => g.id === activeGame);

  const knowQuestion = knowDeck[knowIndex] ?? KNOW_SPOUSE_QUESTIONS[0];
  const triviaCard = triviaDeck[triviaIndex] ?? BIBLE_TRIVIA[0];
  const conversationPrompt = conversationDeck[conversationIndex] ?? CONVERSATION_PROMPTS[0];
  const thisOrThat = thisOrThatDeck[thisOrThatIndex] ?? THIS_OR_THAT[0];
  const weeklyChallenge = weeklyDeck[weeklyIndex] ?? WEEKLY_CHALLENGES[0];

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

      <CouplesGameOverlay
        open={Boolean(activeGame && activeMeta && !locked)}
        title={activeMeta ? `${activeMeta.emoji} ${activeMeta.title}` : "Game"}
        subtitle={activeMeta?.subtitle}
        onClose={closeGame}
      >
        {activeGame === "know-spouse" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
              {progressLabel(knowIndex, knowDeck.length || KNOW_SPOUSE_QUESTIONS.length)}
            </p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-stone-900">{knowQuestion}</p>
            <p className="mt-3 text-sm text-[var(--couples-sheet-muted)]">
              Take turns answering — no grades, just connection.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                advanceDeck(knowDeck, knowIndex, setKnowDeck, setKnowIndex)
              }
            >
              Next question
            </Button>
          </div>
        ) : null}

        {activeGame === "bible-trivia" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
              {progressLabel(triviaIndex, triviaDeck.length || BIBLE_TRIVIA.length)}
            </p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-stone-900">
              {triviaCard.question}
            </p>
            {showTriviaAnswer ? (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3.5 text-sm text-stone-800">
                <p>{triviaCard.answer}</p>
                <p className="mt-2 text-xs font-semibold text-amber-900">{triviaCard.reference}</p>
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              {!showTriviaAnswer ? (
                <Button className="w-full" onClick={() => setShowTriviaAnswer(true)}>
                  Reveal answer
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowTriviaAnswer(false);
                    advanceDeck(triviaDeck, triviaIndex, setTriviaDeck, setTriviaIndex);
                  }}
                >
                  Next question
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {activeGame === "conversation" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
              {progressLabel(conversationIndex, conversationDeck.length || CONVERSATION_PROMPTS.length)}
            </p>
            <p className="mt-4 rounded-2xl bg-violet-50 px-5 py-6 text-center text-lg font-medium leading-relaxed text-stone-900">
              {conversationPrompt}
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                advanceDeck(conversationDeck, conversationIndex, setConversationDeck, setConversationIndex)
              }
            >
              Next prompt
            </Button>
          </div>
        ) : null}

        {activeGame === "this-or-that" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
              {progressLabel(thisOrThatIndex, thisOrThatDeck.length || THIS_OR_THAT.length)}
            </p>
            <p className="mt-2 text-center text-sm text-[var(--couples-sheet-muted)]">
              Each pick a side — then compare why.
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                className={`${couplesHubPremium.sheetCard} py-5 text-center text-base font-semibold`}
                onClick={() =>
                  advanceDeck(thisOrThatDeck, thisOrThatIndex, setThisOrThatDeck, setThisOrThatIndex)
                }
              >
                {thisOrThat.a}
              </button>
              <button
                type="button"
                className={`${couplesHubPremium.sheetCard} py-5 text-center text-base font-semibold`}
                onClick={() =>
                  advanceDeck(thisOrThatDeck, thisOrThatIndex, setThisOrThatDeck, setThisOrThatIndex)
                }
              >
                {thisOrThat.b}
              </button>
            </div>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() =>
                advanceDeck(thisOrThatDeck, thisOrThatIndex, setThisOrThatDeck, setThisOrThatIndex)
              }
            >
              Skip to new pair
            </Button>
          </div>
        ) : null}

        {activeGame === "weekly" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-sheet-muted)]">
              {progressLabel(weeklyIndex, weeklyDeck.length || WEEKLY_CHALLENGES.length)}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-stone-900">{weeklyChallenge}</p>
            <p className="mt-3 text-sm text-[var(--couples-sheet-muted)]">
              Try it before next Sunday — then draw another challenge.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                advanceDeck(weeklyDeck, weeklyIndex, setWeeklyDeck, setWeeklyIndex)
              }
            >
              Next challenge
            </Button>
          </div>
        ) : null}
      </CouplesGameOverlay>
    </CouplesHubScreen>
  );
}
