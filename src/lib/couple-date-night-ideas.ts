import type { DateNightIdeaCatalogItem } from "@/lib/couple-date-night-types";

export const DATE_NIGHT_IDEA_CATALOG: DateNightIdeaCatalogItem[] = [
  {
    id: "dinner-talk",
    title: "Dinner & conversation",
    description: "Cook or pick up a meal, phones away, share highs and lows from the week.",
    budget: "low",
    locationType: "home",
  },
  {
    id: "sunset-walk",
    title: "Sunset walk",
    description: "Walk a favorite trail or neighborhood loop and pray together before you head home.",
    budget: "free",
    locationType: "outdoor",
  },
  {
    id: "coffee-questions",
    title: "Coffee shop questions",
    description: "Bring conversation cards or a list of fun questions — no shop talk allowed.",
    budget: "low",
    locationType: "dining",
  },
  {
    id: "movie-night",
    title: "Movie night in",
    description: "Pick a film you both want to see, make snacks, and debrief one scene that moved you.",
    budget: "low",
    locationType: "home",
  },
  {
    id: "worship-drive",
    title: "Worship drive",
    description: "Drive with a shared playlist, stop somewhere quiet, and read a short Psalm together.",
    budget: "free",
    locationType: "faith",
  },
  {
    id: "serve-together",
    title: "Serve together",
    description: "Deliver a meal, write encouragement notes, or volunteer for one hour as a couple.",
    budget: "free",
    locationType: "faith",
  },
  {
    id: "mini-getaway",
    title: "Mini getaway",
    description: "Half-day trip — museum, lake, or mountain town — plan one thing each of you wants to do.",
    budget: "special",
    locationType: "adventure",
  },
  {
    id: "game-night",
    title: "Game night",
    description: "Board games or couples games in the app — loser makes breakfast tomorrow.",
    budget: "free",
    locationType: "home",
  },
  {
    id: "fancy-date",
    title: "Dress-up dinner",
    description: "Reserve or cook a nicer meal, dress up, and toast to something you love about your spouse.",
    budget: "special",
    locationType: "dining",
  },
  {
    id: "stargaze",
    title: "Stargazing picnic",
    description: "Blankets, hot drinks, and quiet time under the stars with no agenda.",
    budget: "low",
    locationType: "outdoor",
  },
];

export function weeklyDateNightChallenge(reference = new Date()) {
  const start = new Date(reference.getFullYear(), 0, 1);
  const week = Math.floor((reference.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const challenges = [
    "Plan a phone-free hour together this week.",
    "Each share one way your spouse made you feel loved lately.",
    "Pray one specific blessing over your spouse out loud.",
    "Recreate a favorite memory from early in your relationship.",
    "Write a short note and hide it where they will find it.",
    "Choose a new recipe or restaurant and try it together.",
    "Take a 20-minute walk and only ask questions — no problem-solving.",
    "Read one marriage devotion together from Couples Hub.",
  ];
  return challenges[week % challenges.length];
}
