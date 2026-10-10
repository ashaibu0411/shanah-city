export const COUPLE_GAME_STATE_KNOW_SPOUSE = "know-spouse";

export type KnowSpouseRoundState = {
  questionKey: string;
  answers: Record<string, string>;
  revealConsent: Record<string, boolean>;
};

export type KnowSpouseStoredState = {
  deck: number[];
  currentIndex: number;
  round: KnowSpouseRoundState | null;
};

export type KnowSpousePhase = "answer" | "waiting" | "consent" | "revealed";

export type KnowSpouseClientView = {
  question: string;
  progress: { current: number; total: number };
  phase: KnowSpousePhase;
  myAnswer?: string;
  spouseAnswer?: string;
  spouseName: string;
  spouseSubmitted: boolean;
  myConsent: boolean;
  spouseConsented: boolean;
};
