/** Counselor-only teaching content — not shown to couples in the hub. */
export const PREMARITAL_SESSION_TEACHING_GUIDES: Record<
  string,
  {
    teachingSections: Array<{ heading: string; paragraphs: string[] }>;
    discussionQuestions: string[];
    reflectionPrompts: string[];
  }
> = {
  "session-1-foundations": {
    teachingSections: [
      {
        heading: "Marriage as covenant, not contract",
        paragraphs: [
          "Open by reminding the couple that Christian marriage is a covenant witnessed by God and the community, not a transactional agreement that ends when feelings change. Contracts protect self-interest; covenants bind us to faithfulness when self-interest fades. Ask each partner: “What did you imagine you were promising on your wedding day — feelings, or faithfulness?”",
          "Walk through Genesis 2:24 and Ephesians 5. Cleaving is active — it requires leaving certain loyalties so a new primary loyalty can form. Many premarital conflicts are not about the fiancé; they are about competing loyalties to parents, career, or independence that have not been named.",
        ],
      },
      {
        heading: "Gospel-shaped love",
        paragraphs: [
          "Ephesians 5 is not a scorecard for who serves more; it points to Christ’s self-giving love for the church. Husbands are called to initiate sacrificial love; wives are called to respect and partnership — both reflect Christ. When teaching, avoid stereotypes: the goal is mutual submission to Christ (Ephesians 5:21), not cultural roles from the 1950s.",
          "Ask how each partner understands forgiveness and grace in daily life. Covenant marriage assumes repair will be needed. If a couple believes conflict means they “fell out of love,” they need reframing before the wedding.",
        ],
      },
      {
        heading: "Community and accountability",
        paragraphs: [
          "Malachi 2:14 reminds us God is witness. Discuss who will speak truth to them after the wedding — not only who will attend the ceremony. Encourage identification of a mature married couple or elder who can be approached in hardship.",
          "Explain how Shanah City’s assessments and homework support honesty but do not replace face-to-face pastoral care. Set expectations for this eight-session arc: preparation, not performance.",
        ],
      },
    ],
    discussionQuestions: [
      "What does “covenant” mean to each of you in your own words?",
      "Where do you still need to “leave” father and mother emotionally or practically?",
      "How will church community be part of strengthening your marriage in the first year?",
      "What fear about marriage do you need to bring into the light today?",
    ],
    reflectionPrompts: [
      "Each partner: Write three commitments you are making before God (not only before each other).",
      "Together: List two couples whose marriage you respect and what you observe in them.",
    ],
  },
  "session-2-knowing-yourself": {
    teachingSections: [
      {
        heading: "Self-awareness before unity",
        paragraphs: [
          "Strong marriages are built from two whole-ish people, not two halves completing each other. Invite each partner to describe temperament, stress signals, and how they received love growing up. Use the Knowing Yourself and Family Background module themes — reference their written work only where they have consented to share.",
          "Normalize difference: introvert/extrovert, planner/spontaneous, conflict-avoidant/confrontational. Differences are not defects; they become destructive when unnamed or mocked.",
        ],
      },
      {
        heading: "Family-of-origin patterns",
        paragraphs: [
          "Teach the concept of “inheritance” — we inherit communication styles, money habits, conflict patterns, and unspoken rules. Ask: “What did your family do when someone was angry? When someone failed? When money was tight?”",
          "Help them distinguish honoring parents from being controlled by parental expectations. Genesis 2:24 “leave” is not abandonment; it is reordering loyalty so the spouse is the primary human covenant partner.",
        ],
      },
      {
        heading: "Emotional health and homework",
        paragraphs: [
          "Introduce Week 1 homework if not yet released: private reflection first, then guided sharing in session. Emphasize that private answers stay private until they choose disclosure.",
          "Discuss emotional health module themes: anxiety, depression, anger, and when professional help may be needed. Pastoral counseling is not therapy; know referral boundaries.",
        ],
      },
    ],
    discussionQuestions: [
      "How does your family handle stress, and how might that show up in marriage?",
      "What is one way you feel most loved, and how can your partner learn that language?",
      "What story from your background are you afraid will repeat in marriage?",
      "Where do you need patience from your partner while you grow?",
    ],
    reflectionPrompts: [
      "Individual: Complete or continue Week 1 homework before the next meeting if assigned.",
      "Together: Name one family pattern you want to keep and one you want to change.",
    ],
  },
  "session-3-communication": {
    teachingSections: [
      {
        heading: "Listening as spiritual discipline",
        paragraphs: [
          "James 1:19 is a daily practice, not a personality trait. Teach reflective listening: one speaks, the other repeats back meaning before responding. Practice in session with a neutral topic before tackling charged history.",
          "Explain the difference between solving and supporting. Many men default to fixing; many partners feel unheard when solutions arrive too early. Both need vocabulary for “I need you to listen” vs “I need advice.”",
        ],
      },
      {
        heading: "Conflict without contempt",
        paragraphs: [
          "Conflict is inevitable; contempt destroys. Define contempt (sarcasm, eye-rolling, name-calling, stonewalling). Ephesians 4:15 — truth without love is harsh; love without truth is vague.",
          "Introduce a simple time-out rule: either partner can pause a conversation that exceeds skill level, with a scheduled return time within 24 hours. Pausing is not punishing; it protects the covenant.",
        ],
      },
      {
        heading: "Forgiveness and repair",
        paragraphs: [
          "Optional forgiveness module connects here. Teach apology structure: own behavior, express impact, commit to change, ask for forgiveness without demanding instant trust.",
          "Trust rebuilds slowly; forgiveness is often instant before God but gradual in feeling. Couples should not weaponize past failures once addressed.",
        ],
      },
    ],
    discussionQuestions: [
      "What topic is hardest to talk about calmly, and why?",
      "What words or tones feel disrespectful to each of you?",
      "How will you call a time-out without abandoning each other?",
      "What does a good apology look like from your partner?",
    ],
    reflectionPrompts: [
      "Practice ten minutes of listening homework this week on a non-crisis topic.",
      "Each partner: Identify one phrase you will avoid in conflict.",
    ],
  },
  "session-4-money": {
    teachingSections: [
      {
        heading: "Stewardship, not ownership",
        paragraphs: [
          "Money is a discipleship issue. Proverbs 3 and Luke 16 teach faithfulness in small things. Ask about giving, debt, savings, and secrecy. Financial infidelity destroys trust as surely as other betrayals.",
          "Clarify that premarital counseling is not financial planning legal advice — encourage professional help for taxes, estates, and complex debt — but spiritual alignment must precede spreadsheets.",
        ],
      },
      {
        heading: "Transparency and roles",
        paragraphs: [
          "Discuss joint vs separate accounts pragmatically, but anchor in unity: “Our money” vs “my money” language reveals heart posture. Agree on spending thresholds that require conversation.",
          "Address income disparity without shame. Honor each contribution — paid work, caregiving, study — as part of household stewardship.",
        ],
      },
      {
        heading: "Generosity and goals",
        paragraphs: [
          "Tithe and generosity patterns should be agreed before marriage when possible. Conflicts often emerge when one partner feels the other is stingy or reckless.",
          "Set one shared goal for year one (emergency fund, debt reduction, giving project) as an exercise in teamwork.",
        ],
      },
    ],
    discussionQuestions: [
      "What did your family teach you about money — openly or by example?",
      "What spending habit in your partner concerns you, and what habit in you might concern them?",
      "How will you decide major purchases together?",
      "What role will generosity play in your first year?",
    ],
    reflectionPrompts: [
      "Draft a simple monthly budget outline together (high level, not every line item).",
      "Agree on one financial conversation rhythm (e.g., first Sunday of the month).",
    ],
  },
  "session-5-family-boundaries": {
    teachingSections: [
      {
        heading: "Cleaving and honoring",
        paragraphs: [
          "You can honor parents while prioritizing marriage. Teach “we decisions” — if one spouse is consistently caught between partner and parent, the marriage will strain. Role-play boundary language: “Mom, we love you; we need to decide this together first.”",
          "Discuss cultural expectations (immigration backgrounds, multi-generational homes, language barriers) without shaming. Boundaries may look different but must be agreed by both partners.",
        ],
      },
      {
        heading: "Children and timing",
        paragraphs: [
          "Align on openness to children, timing, and parenting philosophy at a high level. Disagreement here is not automatic disqualification but requires honest planning and possibly continued counseling.",
          "Ephesians 6 — parenting is discipleship, not performance. Name fears about parenting before God.",
        ],
      },
      {
        heading: "In-laws and holidays",
        paragraphs: [
          "Holiday schedules are annual flashpoints. Decide principles before calendars: alternating years, Christmas Eve vs Day, FaceTime rhythms, etc.",
          "Optional in-laws module supports this session. Encourage couples to present a united front privately before public announcements.",
        ],
      },
    ],
    discussionQuestions: [
      "Where do you feel caught between family and fiancé today?",
      "What holiday tradition matters most to each of you?",
      "How will you handle unsolicited advice from relatives?",
      "What does “leave and cleave” look like practically in your situation?",
    ],
    reflectionPrompts: [
      "Write a one-paragraph boundary you will practice this month.",
      "Discuss children timeline honestly; note areas needing further conversation.",
    ],
  },
  "session-6-intimacy-trust": {
    teachingSections: [
      {
        heading: "Emotional and physical intimacy",
        paragraphs: [
          "Teach that intimacy is broader than sex — it includes emotional safety, play, affection, and spiritual oneness. Address expectations for frequency, initiation, and past history with sensitivity. Past sexual sin or trauma may require referral; do not probe for prurient detail.",
          "1 Corinthians 7 — marital intimacy is mutual responsibility. Discuss purity boundaries until wedding and media habits that affect the mind.",
        ],
      },
      {
        heading: "Trust and safety",
        paragraphs: [
          "Trust is built in small moments. Ask about phones, passwords, friendships with exes, and secrecy. Trust module assessments may highlight gaps — explore with care.",
          "Define emotional affair boundaries: sharing inner world, seeking comfort primarily outside marriage, hiding conversations.",
        ],
      },
      {
        heading: "Pastoral discretion",
        paragraphs: [
          "If abuse, coercion, or addiction appears, pause readiness conversation and follow church safety protocols. Counseling is not couples therapy for active abuse.",
          "Affirm confidentiality within legal/ethical limits. Some topics belong in private session with one partner if needed.",
        ],
      },
    ],
    discussionQuestions: [
      "What helps you feel emotionally safe with your partner?",
      "What expectations do you have for physical intimacy in marriage?",
      "Are there trust rebuilds needed from the dating season?",
      "How will you protect your marriage from pornography or secrecy?",
    ],
    reflectionPrompts: [
      "Agree on two boundaries that protect intimacy until and after the wedding.",
      "Each partner: Share one way you will pursue emotional closeness weekly.",
    ],
  },
  "session-7-faith-purpose": {
    teachingSections: [
      {
        heading: "Shared mission",
        paragraphs: [
          "Joshua 24 — households serve the Lord by decision, not accident. Discuss church home, serving, small groups, and prayer together. Vision module captures dreams; tie dreams to Christ’s kingdom, not only career success.",
          "Ask how each partner grows spiritually when alone and how they will grow together.",
        ],
      },
      {
        heading: "Work, rest, and culture",
        paragraphs: [
          "Colossians 3 — work is worship when offered to God. Discuss hours, travel, side hustles, and Sabbath rest. Burnout marriages feel lonely even when bills are paid.",
          "Optional culture and work modules address blended traditions and ambition. Honor both backgrounds without forcing assimilation.",
        ],
      },
      {
        heading: "Building a home",
        paragraphs: [
          "Home is atmosphere, not square footage. Name values: hospitality, laughter, prayer at meals, media rules, conflict rules. One-sentence vision exercise: “The home we are building honors God by…”",
        ],
      },
    ],
    discussionQuestions: [
      "How will you pray together — even if awkward at first?",
      "What rhythm of rest protects your marriage from chronic exhaustion?",
      "What cultural traditions will you blend or adapt?",
      "What mission do you sense God calling you to as a couple?",
    ],
    reflectionPrompts: [
      "Draft a one-sentence vision statement for your home.",
      "Choose one spiritual practice to begin together within 30 days of marriage.",
    ],
  },
  "session-8-readiness-review": {
    teachingSections: [
      {
        heading: "Synthesis, not checklist perfection",
        paragraphs: [
          "Review the eight-session arc: what changed, what surprised, what remains tender. Readiness module helps name honest assessment — do not force “ready” if serious unresolved issues remain (contempt, hidden addiction, undisclosed debt, refusal to cleave).",
          "Philippians 1:6 — God completes what He starts. Marriage preparation continues after the wedding; readiness is direction, not arrival.",
        ],
      },
      {
        heading: "Strengths and growth edges",
        paragraphs: [
          "Name three strengths you observe in their friendship, communication, or faith. Name one or two growth edges that may need post-wedding support — mentor couple, continued counseling, financial coach.",
          "Optional modules (addiction, grief, celebration) may surface late topics; celebrate progress on celebration module if used.",
        ],
      },
      {
        heading: "Blessing and send-off",
        paragraphs: [
          "Pray blessing over them. Give clear guidance on wedding-week stress, first-month adjustments, and when to seek help early rather than late.",
          "Document any pastoral conditions (e.g., continued counseling recommendation) in private notes, not as public shame.",
        ],
      },
    ],
    discussionQuestions: [
      "What is the most important thing you learned about your partner in this process?",
      "Is there anything unresolved that we should address before the wedding?",
      "Who will you call first if the first month is harder than expected?",
      "How do you want your church to support you in year one?",
    ],
    reflectionPrompts: [
      "Write a letter to your future spouse to open on your first anniversary (optional keepsake).",
      "Together: Thank one person who invested in your preparation.",
    ],
  },
};
