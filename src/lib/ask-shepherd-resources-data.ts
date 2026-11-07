export type AskShepherdResourceItem = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  url?: string;
};

/** Built-in placeholders — church-specific policies are added via DB when approved. */
export const ASK_SHEPHERD_BUILTIN_RESOURCES: AskShepherdResourceItem[] = [
  {
    slug: "biblical-leadership",
    title: "Biblical leadership foundations",
    category: "Biblical leadership",
    summary:
      "Lead with humility (Matthew 20:25–28), seek wisdom (James 1:5), and restore gently (Galatians 6:1). Pray and seek counsel before hard conversations.",
  },
  {
    slug: "communication-correction",
    title: "Communication and correction",
    category: "Communication and correction",
    summary:
      "Speak truth in love (Ephesians 4:15). Private first (Matthew 18:15). Aim for clarity, curiosity, and a path forward — not shame.",
  },
  {
    slug: "team-building",
    title: "Team building",
    category: "Team building",
    summary:
      "Honor diverse gifts (1 Corinthians 12). Celebrate faithfulness, not only outcomes. Clarify roles and expectations before conflict spikes.",
  },
  {
    slug: "conflict-resolution",
    title: "Conflict resolution",
    category: "Conflict resolution",
    summary:
      "Slow down, listen, and name concerns without attacking character (Proverbs 15:1). Bring a mediator when needed; escalate serious harm through proper channels.",
  },
  {
    slug: "volunteer-development",
    title: "Volunteer development",
    category: "Volunteer development",
    summary:
      "Intentional coaching, feedback, and appreciation. Protect sustainable rhythms; overloaded volunteers need adjustment, not guilt.",
  },
  {
    slug: "accountability-compassion",
    title: "Accountability with compassion",
    category: "Ministry accountability",
    summary:
      "Clear standards with kindness. Follow through consistently. Document agreements simply; professional boundaries protect everyone.",
  },
  {
    slug: "pastoral-boundaries",
    title: "Pastoral care boundaries",
    category: "Pastoral care boundaries",
    summary:
      "This tool does not provide counseling or definitive discipline decisions. Serious mental-health or safeguarding matters belong with qualified humans and formal processes.",
  },
];
