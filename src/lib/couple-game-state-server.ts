import type { PublicMember } from "@/lib/auth-types";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { getActiveCouplePartner } from "@/lib/couple-link-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import { KNOW_SPOUSE_QUESTIONS, shuffleDeck } from "@/lib/couple-games-catalog";
import {
  COUPLE_GAME_STATE_KNOW_SPOUSE,
  type KnowSpouseClientView,
  type KnowSpousePhase,
  type KnowSpouseStoredState,
} from "@/lib/couple-game-state-types";
import { useDatabase } from "@/lib/use-database";
import * as coupleGameStateDb from "@/lib/stores/couple-game-state-db";
import * as coupleGameStateJson from "@/lib/stores/couple-game-state-json";

const store = () => (useDatabase() ? coupleGameStateDb : coupleGameStateJson);

function defaultDeck() {
  const indices = KNOW_SPOUSE_QUESTIONS.map((_, index) => index);
  return shuffleDeck(indices);
}

function parseStored(raw: string): KnowSpouseStoredState {
  try {
    const parsed = JSON.parse(raw) as KnowSpouseStoredState;
    if (!Array.isArray(parsed.deck) || typeof parsed.currentIndex !== "number") {
      return { deck: defaultDeck(), currentIndex: 0, round: null };
    }
    return {
      deck: parsed.deck.filter((n) => typeof n === "number"),
      currentIndex: Math.max(0, Math.min(parsed.currentIndex, parsed.deck.length - 1)),
      round: parsed.round ?? null,
    };
  } catch {
    return { deck: defaultDeck(), currentIndex: 0, round: null };
  }
}

function questionKeyForIndex(deck: number[], index: number) {
  const qIndex = deck[index] ?? 0;
  return String(qIndex);
}

function ensureRound(state: KnowSpouseStoredState): KnowSpouseStoredState {
  const key = questionKeyForIndex(state.deck, state.currentIndex);
  if (state.round?.questionKey === key) return state;
  return {
    ...state,
    round: { questionKey: key, answers: {}, revealConsent: {} },
  };
}

function phaseForUser(
  userId: string,
  partnerId: string,
  round: KnowSpouseStoredState["round"],
): KnowSpousePhase {
  if (!round) return "answer";
  const myAnswer = round.answers[userId]?.trim();
  const spouseAnswer = round.answers[partnerId]?.trim();
  if (!myAnswer) return "answer";
  if (!spouseAnswer) return "waiting";
  const myConsent = Boolean(round.revealConsent[userId]);
  const spouseConsent = Boolean(round.revealConsent[partnerId]);
  if (myConsent && spouseConsent) return "revealed";
  return "consent";
}

function toClientView(
  userId: string,
  partnerId: string,
  partnerName: string,
  state: KnowSpouseStoredState,
): KnowSpouseClientView {
  const stateWithRound = ensureRound(state);
  const round = stateWithRound.round!;
  const qIndex = stateWithRound.deck[stateWithRound.currentIndex] ?? 0;
  const question = KNOW_SPOUSE_QUESTIONS[qIndex] ?? KNOW_SPOUSE_QUESTIONS[0];
  const phase = phaseForUser(userId, partnerId, round);
  const myAnswer = round.answers[userId]?.trim();
  const spouseAnswerRaw = round.answers[partnerId]?.trim();

  return {
    question,
    progress: {
      current: Math.min(stateWithRound.currentIndex + 1, stateWithRound.deck.length),
      total: stateWithRound.deck.length,
    },
    phase,
    myAnswer: myAnswer || undefined,
    spouseAnswer: phase === "revealed" ? spouseAnswerRaw : undefined,
    spouseName: partnerName,
    spouseSubmitted: Boolean(spouseAnswerRaw),
    myConsent: Boolean(round.revealConsent[userId]),
    spouseConsented: Boolean(round.revealConsent[partnerId]),
  };
}

async function loadKnowSpouseState(coupleLinkId: string) {
  const record = await store().getCoupleGameState(coupleLinkId, COUPLE_GAME_STATE_KNOW_SPOUSE);
  if (!record) {
    const initial: KnowSpouseStoredState = { deck: defaultDeck(), currentIndex: 0, round: null };
    await store().upsertCoupleGameState({
      coupleLinkId,
      gameType: COUPLE_GAME_STATE_KNOW_SPOUSE,
      stateJson: JSON.stringify(ensureRound(initial)),
    });
    return ensureRound(initial);
  }
  return ensureRound(parseStored(record.stateJson));
}

async function saveKnowSpouseState(coupleLinkId: string, state: KnowSpouseStoredState) {
  await store().upsertCoupleGameState({
    coupleLinkId,
    gameType: COUPLE_GAME_STATE_KNOW_SPOUSE,
    stateJson: JSON.stringify(state),
  });
}

export async function getKnowSpouseGameForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const partnerId = partnerIdFromLink(link, user.id);
  if (!partnerId) throw new Error("Spouse link is incomplete.");
  const partner = await getActiveCouplePartner(user);
  const state = await loadKnowSpouseState(link.id);
  const view = toClientView(user.id, partnerId, partner?.name ?? "Your spouse", state);
  return { coupleLinkId: link.id, knowSpouse: view };
}

export async function submitKnowSpouseAnswerForUser(user: PublicMember, answer: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const partnerId = partnerIdFromLink(link, user.id);
  if (!partnerId) throw new Error("Spouse link is incomplete.");

  const trimmed = answer.trim();
  if (!trimmed) throw new Error("Write an answer before submitting.");
  if (trimmed.length > 2000) throw new Error("Keep your answer under 2,000 characters.");

  let state = await loadKnowSpouseState(link.id);
  state = ensureRound(state);
  const round = state.round!;
  if (round.answers[user.id]?.trim()) {
    throw new Error("You already submitted for this question.");
  }

  round.answers[user.id] = trimmed;
  await saveKnowSpouseState(link.id, state);

  const partner = await getActiveCouplePartner(user);
  const view = toClientView(user.id, partnerId, partner?.name ?? "Your spouse", state);
  return { knowSpouse: view };
}

export async function consentKnowSpouseRevealForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const partnerId = partnerIdFromLink(link, user.id);
  if (!partnerId) throw new Error("Spouse link is incomplete.");

  let state = await loadKnowSpouseState(link.id);
  state = ensureRound(state);
  const round = state.round!;
  const myAnswer = round.answers[user.id]?.trim();
  const spouseAnswer = round.answers[partnerId]?.trim();
  if (!myAnswer || !spouseAnswer) {
    throw new Error("Both spouses need to answer before revealing.");
  }

  round.revealConsent[user.id] = true;
  await saveKnowSpouseState(link.id, state);

  const partner = await getActiveCouplePartner(user);
  const view = toClientView(user.id, partnerId, partner?.name ?? "Your spouse", state);
  return { knowSpouse: view };
}

export async function advanceKnowSpouseQuestionForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const partnerId = partnerIdFromLink(link, user.id);
  if (!partnerId) throw new Error("Spouse link is incomplete.");

  let state = await loadKnowSpouseState(link.id);
  state = ensureRound(state);
  const phase = phaseForUser(user.id, partnerId, state.round);
  if (phase !== "revealed") {
    throw new Error("Reveal answers together before moving on.");
  }

  if (state.currentIndex + 1 >= state.deck.length) {
    state.currentIndex = 0;
    state.deck = defaultDeck();
  } else {
    state.currentIndex += 1;
  }
  state.round = null;
  state = ensureRound(state);
  await saveKnowSpouseState(link.id, state);

  const partner = await getActiveCouplePartner(user);
  const view = toClientView(user.id, partnerId, partner?.name ?? "Your spouse", state);
  return { knowSpouse: view };
}
