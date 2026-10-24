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
        heading: "Opening and session objectives (75–90 minutes)",
        paragraphs: [
          "Welcome the couple, thank them for preparing, and pray briefly for honesty and grace. Objectives today: (1) name marriage as covenant before God, (2) surface competing loyalties that could strain the union, (3) set expectations for this eight-session journey and homework between meetings, (4) assign nothing automatically — explain that after today you will release written homework they complete before Session 2.",
          "Share a realistic example: a couple assumed love would solve in-law tension; preparation helped them agree on a ‘we respond together’ rule before the next family dinner. Another couple discovered one partner heard ‘covenant’ as legal permanence while the other heard emotional fireworks — aligning language prevented early disappointment.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Have each partner complete this sentence aloud: “When I say ‘I do,’ I am promising God and you that I will __________ even when I do not feel __________.” Allow silence; do not rush.",
          "Together write (or say) one sentence describing how church community will know when to intervene gently if they see strain in year one.",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "If one defines covenant as permanence and the other as daily romance, do not vote. Ask each to describe a married couple they admire and what promise they believe that couple keeps on hard days.",
          "If community involvement feels smothering to one and essential to the other, schedule a follow-up boundary conversation rather than forcing agreement today.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Summarize themes heard. Confirm Session 2 focus (knowing self and background). Remind them individual homework after Session 1 stays private until they choose to share in counseling.",
          "Prayer focus: God as witness (Malachi 2:14), courage to cleave, and a church that supports rather than performs for.",
        ],
      },
      {
        heading: "Suggested homework (counselor releases manually)",
        paragraphs: [
          "Use template “After Session 1 — Knowing yourself before Session 2” (legacy key week-1-knowing-yourself). Review draft, set due date before Session 2, then release explicitly.",
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Pray and recall Session 1 themes. Objectives: explore temperament and family-of-origin without shaming culture or economics; review assessment progress; discuss homework completed after Session 1 only at the level each partner consents to share.",
          "Example: partners from a loud, expressive home and a quiet, indirect home learned to name ‘I need words’ vs ‘I need calm’ instead of labeling each other rude or cold.",
        ],
      },
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
        heading: "Emotional health and homework review",
        paragraphs: [
          "Review homework assigned after Session 1 (before today) only with permission — never read private journal entries aloud. Ask what was hardest and what surprised them about themselves.",
          "Discuss emotional health module themes: anxiety, depression, anger, and when professional help may be needed. Pastoral counseling is not therapy; know referral boundaries.",
        ],
      },
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Timeline exercise: each partner names one childhood memory that shaped how they receive love. Partner may only ask clarifying questions, not debate the memory.",
          "On paper, each lists one family rule they want to keep and one they want to rewrite for their new household.",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "Different stories are normal. Avoid ‘my family was healthier.’ Explore how two valid backgrounds will negotiate holidays, money, and conflict.",
          "If trauma surfaces, pause curriculum performance; affirm courage and discuss whether individual support is needed.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Affirm God’s craftsmanship (Psalm 139). Preview communication session. Assign after Session 2 homework via Homework Manager when ready.",
          "Prayer focus: patience while learning each other’s story; healing where family wounds remain.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: [
          "Release “After Session 2 — Communication practice before Session 3” after this meeting.",
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: practice listening and repair; connect to Communication module; normalize conflict without contempt. Share example: a couple stopped midnight arguments by agreeing to resume after sleep — not abandonment, but wisdom.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Ten-minute listening drill on a neutral topic (how each prefers to spend a day off). Speaker, listener repeat-back, then switch.",
          "Draft a shared time-out phrase and return window (within 24 hours).",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "If one wants immediate resolution and one needs space, write both needs on a card and read them to each other without fixing.",
          "If contempt language appears, stop and name it as covenant damage — not personality.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Summarize repair steps. Release after Session 3 money homework when appropriate.",
          "Prayer focus: James 1:19 — quick to hear in a noisy world.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 3 — Money and stewardship before Session 4."],
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: align hearts on stewardship; high-level transparency on debt, giving, and roles; refer complex legal/tax work to professionals. Example: immigrant couple merged remittance support for parents into budget talks early and avoided secret sending later.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "On one page, list all accounts, debts, and giving (percentages, not necessarily exact balances if shame is present — counselor may follow privately).",
          "Agree on a monthly ‘money meeting’ date and length (30 minutes).",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "Spender/saver pairs need shared goals, not conversion. Ask what fear sits under spending or hoarding.",
          "Income disparity: honor unpaid labor (caregiving, study, ministry) as real contribution.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Confirm transparency norms. Homework: after Session 4 family/boundaries template.",
          "Prayer focus: faithfulness in little things (Luke 16:10).",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 4 — Family and boundaries before Session 5."],
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: honor parents while prioritizing marriage; plan boundaries without shaming culture; align on children timing at a high level. Example: couple in multigenerational home agreed on quiet hours and decision rights before moving in.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Role-play one boundary conversation with a parent or relative (counselor plays the relative). Debrief tone and unity.",
          "Sketch a two-year holiday plan framework — details can wait, principles cannot.",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "If one culture expects daily parent contact and another expects independence, negotiate rhythm, not victory.",
          "Children timing disagreements: document both hopes and schedule continued conversation rather than forcing consensus.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Bless their courage to honor and cleave. Release after Session 5 intimacy/trust homework when ready.",
          "Prayer focus: Genesis 2:24 wisdom in their specific family system.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 5 — Intimacy and trust before Session 6."],
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: teach mutual intimacy with discretion; address trust and media; follow safety protocols if coercion or abuse appears. Example: couple agreed on accountability for porn recovery without public shaming.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Each partner names one non-sexual affection habit that helps them feel close. Partner repeats back without joking.",
          "Agree on two digital boundaries (screens in bed, private chats, etc.).",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "Different intimacy expectations are common; explore feelings and fears, not demands. Refer trauma or addiction to specialized help.",
          "If one partner is not ready to discuss past sexual history, respect pace while noting wedding readiness implications privately.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Affirm dignity. Homework after Session 6 on faith and home vision.",
          "Prayer focus: mutual honor and safety in the marriage bed.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 6 — Faith and home vision before Session 7."],
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: unite around mission, spiritual rhythms, work/rest, and home atmosphere across cultures. Example: bilingual couple chose one language for prayer and both for hospitality.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Write a one-sentence home vision together aloud until both can say amen honestly.",
          "Pick one weekly spiritual rhythm to start in month one (meal prayer, Sabbath walk, serving together).",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "Different church backgrounds: clarify non-negotiables vs preferences.",
          "Workaholism vs rest: negotiate caps on hours before resentment sets in.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Preview final readiness session. Release after Session 7 readiness prep homework.",
          "Prayer focus: Joshua 24:15 decision, not drift.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 7 — Readiness check before Session 8."],
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
        heading: "Opening and session objectives",
        paragraphs: [
          "Objectives: synthesize growth; name unresolved concerns honestly; bless and send; document private pastoral conditions. This is not a pass/fail exam — readiness is direction with open hands.",
        ],
      },
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
      {
        heading: "Practical in-session exercise",
        paragraphs: [
          "Each partner shares three strengths they see in the other’s preparation journey.",
          "Together name one mentor couple and one early warning sign that will prompt them to seek help.",
        ],
      },
      {
        heading: "When partners answer differently",
        paragraphs: [
          "If one feels ready and one hesitant, explore specifics — do not proceed by pressure. Senior pastor may need to join for serious unresolved contempt, addiction, or safety issues.",
        ],
      },
      {
        heading: "Session wrap-up and closing prayer",
        paragraphs: [
          "Public blessing and practical wedding-week tips. Optional first-month homework after Session 8.",
          "Prayer focus: Philippians 1:6 — God completes what He starts; invite congregation support.",
        ],
      },
      {
        heading: "Suggested homework",
        paragraphs: ["After Session 8 — First month of marriage (optional send-off template)."],
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
