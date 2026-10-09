export type CoupleGameId =
  | "know-spouse"
  | "bible-trivia"
  | "conversation"
  | "this-or-that"
  | "weekly";

export type CoupleGameMeta = {
  id: CoupleGameId;
  emoji: string;
  title: string;
  subtitle: string;
};

export const COUPLE_GAME_CATALOG: CoupleGameMeta[] = [
  {
    id: "know-spouse",
    emoji: "💑",
    title: "How well do you know your spouse?",
    subtitle: "Quick questions about favorites and memories",
  },
  {
    id: "bible-trivia",
    emoji: "📖",
    title: "Marriage Bible trivia",
    subtitle: "Scripture and wisdom for couples",
  },
  {
    id: "conversation",
    emoji: "💬",
    title: "Conversation cards",
    subtitle: "Meaningful prompts to go deeper",
  },
  {
    id: "this-or-that",
    emoji: "⚖️",
    title: "This or that",
    subtitle: "Playful choices — no wrong answers",
  },
  {
    id: "weekly",
    emoji: "🏆",
    title: "Challenge of the week",
    subtitle: "One fun assignment to try together",
  },
];

export const KNOW_SPOUSE_QUESTIONS = [
  "What is one way your spouse felt loved this week?",
  "What is their current favorite snack or drink?",
  "What is a memory from your first year together that still makes you smile?",
  "What is stressing them most right now — and how can you help?",
  "What is one dream they have mentioned lately?",
  "What song, show, or hobby have they been into recently?",
  "When do they feel most connected to you?",
  "What is one thing you appreciate about them today?",
];

export const BIBLE_TRIVIA = [
  {
    question: "In Ephesians 5, husbands are called to love their wives as Christ loved the church. What quality is named right before that command?",
    answer: "Sacrificial love — “gave himself up” (Ephesians 5:25).",
    reference: "Ephesians 5:25",
  },
  {
    question: "Which book says two are better than one, because they have a good return for their labor?",
    answer: "Ecclesiastes — a cord of three strands is not quickly broken (4:9–12).",
    reference: "Ecclesiastes 4:9–12",
  },
  {
    question: "What does 1 Peter 4:8 say love does?",
    answer: "Love covers a multitude of sins.",
    reference: "1 Peter 4:8",
  },
  {
    question: "In 1 Corinthians 13, love is patient and kind. What is love NOT?",
    answer: "Envious, boastful, rude, self-seeking, easily angered, or keeping a record of wrongs.",
    reference: "1 Corinthians 13:4–5",
  },
];

export const CONVERSATION_PROMPTS = [
  "What is one thing I did this week that made you feel cared for?",
  "If we had a free evening with no kids and no screens, what would you want to do?",
  "What is one area where you want us to grow spiritually this season?",
  "How can I pray for you more specifically this week?",
  "What is a tradition from your family you want to keep — or start — in our home?",
  "When did you last feel proud of us as a team?",
  "What is one small habit that would make our mornings or evenings smoother?",
  "What dream should we write down and plan for together?",
];

export const THIS_OR_THAT = [
  { a: "Breakfast date", b: "Late-night dessert run" },
  { a: "Road trip playlist you pick", b: "Road trip playlist they pick" },
  { a: "Board game night", b: "Movie marathon" },
  { a: "Try a new restaurant", b: "Cook something new at home" },
  { a: "Share highs and lows daily", b: "Weekly longer check-in" },
  { a: "Morning prayer together", b: "Evening prayer together" },
];

export const WEEKLY_CHALLENGES = [
  "Write each other a short note and hide it where they'll find it before Sunday.",
  "Plan one phone-free hour together — walk, coffee, or couch time.",
  "Pray out loud for each other’s biggest stress this week.",
  "Recall your first date and share one detail the other might have forgotten.",
  "Do one chore your spouse usually handles — without being asked.",
];

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}
