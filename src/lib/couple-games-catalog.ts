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
  "What is their love language in action this month — words, time, gifts, acts, or touch?",
  "What is one goal they are working toward that you can cheer on?",
  "When did they last feel truly heard by you?",
  "What is their ideal way to rest after a hard day?",
  "What is a small surprise that would delight them this week?",
  "Who is someone they are praying for right now?",
  "What is a tradition from their childhood they still cherish?",
  "What is one thing they are proud of that you can celebrate out loud?",
  "What date idea have they mentioned (even jokingly) lately?",
  "What is one habit of yours that helps them feel safe?",
  "What is one habit of yours that you could adjust to love them better?",
  "What does “feeling pursued” look like for them — not just on date night?",
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
  {
    question: "What does Proverbs 31:10–11 celebrate about a wife of noble character?",
    answer: "Her worth is far above jewels; her husband has full confidence in her.",
    reference: "Proverbs 31:10–11",
  },
  {
    question: "In Genesis 2:24, what happens when a man leaves his father and mother?",
    answer: "He holds fast to his wife, and they become one flesh.",
    reference: "Genesis 2:24",
  },
  {
    question: "What counsel does Colossians 3:13 give married people about forgiveness?",
    answer: "Bear with one another and forgive each other; as the Lord forgave you.",
    reference: "Colossians 3:13",
  },
  {
    question: "According to Hebrews 13:4, what should marriage be held in?",
    answer: "Honor by all.",
    reference: "Hebrews 13:4",
  },
  {
    question: "In Mark 10:9, what did Jesus say about what God has joined?",
    answer: "What God has joined together, let no one separate.",
    reference: "Mark 10:9",
  },
  {
    question: "What does Romans 12:10 say about honoring one another?",
    answer: "Outdo one another in showing honor.",
    reference: "Romans 12:10",
  },
  {
    question: "Malachi 2:14–15 calls marriage a what?",
    answer: "A covenant — faithfulness and godly offspring are part of God’s design.",
    reference: "Malachi 2:14–15",
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
  "What is one boundary that would protect our peace this season?",
  "When did you feel closest to God together recently?",
  "What is one apology we still need to make to each other?",
  "What would make our home feel more like a refuge this week?",
  "What is one way we can serve someone else as a team?",
  "What fear are you carrying that I can pray over tonight?",
  "What is one thing we should stop doing that drains us?",
  "What is one thing we should start doing that would refresh us?",
  "How can we protect our Sabbath or rest day as a couple?",
  "What does forgiveness look like for the last disagreement we had?",
];

export const THIS_OR_THAT = [
  { a: "Breakfast date", b: "Late-night dessert run" },
  { a: "Road trip playlist you pick", b: "Road trip playlist they pick" },
  { a: "Board game night", b: "Movie marathon" },
  { a: "Try a new restaurant", b: "Cook something new at home" },
  { a: "Share highs and lows daily", b: "Weekly longer check-in" },
  { a: "Morning prayer together", b: "Evening prayer together" },
  { a: "Stay in for the night", b: "Dress up and go out" },
  { a: "Text love notes", b: "Leave handwritten notes" },
  { a: "Adventure day", b: "Cozy home day" },
  { a: "Plan the date together", b: "Surprise each other" },
  { a: "Talk it out right away", b: "Pause and pray first" },
  { a: "Beach vacation", b: "Mountain getaway" },
  { a: "Learn something new together", b: "Revisit a favorite place" },
];

export const WEEKLY_CHALLENGES = [
  "Write each other a short note and hide it where they'll find it before Sunday.",
  "Plan one phone-free hour together — walk, coffee, or couch time.",
  "Pray out loud for each other’s biggest stress this week.",
  "Recall your first date and share one detail the other might have forgotten.",
  "Do one chore your spouse usually handles — without being asked.",
  "Share three specific things you admire about your spouse — no repeats from last time.",
  "Put phones in another room for one meal and ask each other one deep question.",
  "Read one short Bible passage together and each share one takeaway.",
  "Plan a $0 date in the next 7 days and put it on the calendar now.",
  "Send your spouse a voice memo telling them why you’re grateful for them.",
  "Ask: “What can I carry for you this week?” — then follow through on one thing.",
];

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function shuffleDeck<T>(items: readonly T[]): T[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
