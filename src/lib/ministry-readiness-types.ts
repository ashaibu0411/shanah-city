import { FRONTLINERS_GROUP_ID } from "@/lib/frontliners-types";
import { isMediaGroup } from "@/lib/media-group";

export type MinistryReadinessKey = "choir" | "media" | "ushers" | "kids";

export type MinistryReadinessQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type MinistryReadinessPack = {
  readinessKey: MinistryReadinessKey;
  title: string;
  subtitle: string;
  expectations: string[];
  questions: MinistryReadinessQuestion[];
  commitmentLabel: string;
  requiresLeaderApproval: boolean;
};

export type MinistryReadinessSource =
  | "self_join"
  | "leader_added"
  | "existing_member"
  | "training_required";

export type MinistryReadinessCompletion = {
  id: string;
  userId: string;
  readinessKey: MinistryReadinessKey;
  groupId: string;
  groupName: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>;
  agreedAt: string;
  createdAt: string;
  source: MinistryReadinessSource;
};

export type MinistryReadinessPublicQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type MinistryReadinessPublicPack = {
  readinessKey: MinistryReadinessKey;
  title: string;
  subtitle: string;
  churchIdentity: string[];
  sharedStandards: string[];
  expectations: string[];
  questions: MinistryReadinessPublicQuestion[];
  sharedCommitmentLabel: string;
  commitmentLabel: string;
  requiresLeaderApproval: boolean;
  passingScore: { required: number; total: number };
  completed: boolean;
  completedAt?: string;
  /** True when a new volunteer must complete training before self-joining. */
  requiredForSelfJoin: boolean;
  /** True when a current member must complete training before group access is restored. */
  requiredForRetraining: boolean;
};

/** Minimum percentage of quiz questions that must be correct to pass. */
export const MINISTRY_READINESS_PASS_PERCENT = 100;

/** Mission, vision, and beliefs every new ministry volunteer should know. */
export const SHARED_CHURCH_IDENTITY = [
  "Mission: Progressively changing lives through ReBirthing, ReClaiming, and ReStoring (R3) to a higher spiritual, physical, and emotional level in God (Romans 12:2).",
  "Vision: Changing lives to higher levels in God as we are transformed into His image (2 Corinthians 3:18).",
  "The Church is the visible body of Christ — sent to glorify God and proclaim the gospel of Jesus Christ.",
  "We serve people with dignity — every person is made in God's image and worthy of respect.",
  "Shanah (שָׁנָה) means \"year\" — God's appointed seasons of growth, renewal, and transformation in Christ.",
  "Shanah City exists to equip believers, reveal Christ's glory, and advance God's Kingdom in our community and beyond.",
  "Our outreach goes beyond Sunday: we demonstrate faith through love, service, and practical action that strengthens families and communities.",
];

export const SHARED_MINISTRY_STANDARDS = [
  "Serve with a humble heart — ministry is about people and God, not personal spotlight.",
  "Communicate early when you cannot serve so your team can plan.",
  "Follow your ministry leader's direction during service and rehearsal.",
  "Treat guests, teammates, and leaders with respect — no gossip, drama, or arguing.",
  "Keep sensitive conversations and safeguarding concerns confidential; escalate to a leader.",
  "Dress modestly and appropriately while representing Shanah City.",
  "Keep your phone silent and put away while serving unless your role requires it.",
  "Do not post photos, clips, or stories from service without leader approval.",
];

export const SHARED_MINISTRY_COMMITMENT =
  "I agree to uphold these Shanah ministry standards and represent Shanah City's mission as I serve.";

const SHARED_CHURCH_QUESTIONS: MinistryReadinessQuestion[] = [
  {
    id: "church-r3",
    prompt: "What does R3 stand for in Shanah City's mission?",
    options: [
      "ReBirthing, ReClaiming, and ReStoring",
      "Reach, Renew, and Rebuild cities only",
      "Read, Reflect, and Remember Scripture",
    ],
    correctIndex: 0,
  },
  {
    id: "church-vision",
    prompt: "What is Shanah City's vision?",
    options: [
      "Changing lives to higher levels in God",
      "Growing attendance numbers every quarter",
      "Building the largest church facility possible",
    ],
    correctIndex: 0,
  },
  {
    id: "church-purpose",
    prompt: "Why does the Church exist?",
    options: [
      "To glorify God and proclaim the gospel of Jesus Christ",
      "To provide social events for members only",
      "To replace personal relationship with God",
    ],
    correctIndex: 0,
  },
  {
    id: "church-shanah",
    prompt: "What does the name Shanah point to?",
    options: [
      "God's seasons of growth, renewal, and transformation",
      "A worship style used only on holidays",
      "The city where the church must stay permanently",
    ],
    correctIndex: 0,
  },
  {
    id: "church-image",
    prompt: "How should we treat guests and teammates while serving?",
    options: [
      "With dignity — every person is made in God's image",
      "Only warmly if they already attend regularly",
      "Strictly — rules matter more than people",
    ],
    correctIndex: 0,
  },
  {
    id: "church-community",
    prompt: "How does Shanah City serve beyond Sunday services?",
    options: [
      "Through love, service, and practical community action",
      "By waiting for people to find us on their own",
      "Only through online content, not in-person care",
    ],
    correctIndex: 0,
  },
  {
    id: "church-salvation",
    prompt: "According to our core beliefs, how is a person reconciled to God?",
    options: [
      "Through faith in Jesus Christ — by grace, not by works alone",
      "By perfect church attendance every week",
      "By personal effort and good deeds only",
    ],
    correctIndex: 0,
  },
];

function withSharedQuestions(
  teamQuestions: MinistryReadinessQuestion[],
): MinistryReadinessQuestion[] {
  return [...SHARED_CHURCH_QUESTIONS, ...teamQuestions];
}

export function minCorrectToPass(
  totalQuestions: number,
  passPercent = MINISTRY_READINESS_PASS_PERCENT,
) {
  return Math.ceil((passPercent / 100) * totalQuestions);
}

export function passesReadinessQuiz(
  correct: number,
  total: number,
  passPercent = MINISTRY_READINESS_PASS_PERCENT,
) {
  return correct >= minCorrectToPass(total, passPercent);
}

const READINESS_PACKS: Record<MinistryReadinessKey, MinistryReadinessPack> = {
  choir: {
    readinessKey: "choir",
    title: "Before You Serve — Worship Team",
    subtitle: "Read about Shanah City and our team expectations, then answer 10 questions before joining.",
    expectations: [
      "Be on time for rehearsal and service call times — lateness affects the whole team.",
      "Prepare your parts before Sunday (lyrics, vocals, musicianship).",
      "Tell your worship leader as early as possible when you cannot serve.",
      "Serve with humility — worship is for God, not performance.",
      "Honor the gifts of the Spirit, including tongues and interpretation, under leader direction and biblical order.",
      "Dress clean and modest, suitable for leading others in worship.",
      "Honor team communication through the app, chat, and worship planner.",
    ],
    questions: withSharedQuestions([
      {
        id: "choir-notify",
        prompt: "When should you tell the team you cannot serve?",
        options: [
          "The morning of service if I wake up late",
          "As soon as I know — ideally days ahead",
          "Only after missing two Sundays in a row",
        ],
        correctIndex: 1,
      },
      {
        id: "choir-rehearsal",
        prompt: "Why does rehearsal matter?",
        options: [
          "It is optional if I already know the songs",
          "It helps the whole team flow together on Sunday",
          "It is only for new members",
        ],
        correctIndex: 1,
      },
      {
        id: "choir-heart",
        prompt: "What is the primary heart of worship ministry?",
        options: [
          "Showcasing individual talent",
          "Leading people to God with humility",
          "Performing flawlessly every week",
        ],
        correctIndex: 1,
      },
    ]),
    commitmentLabel:
      "I commit to these worship team standards and will communicate early when I cannot serve.",
    requiresLeaderApproval: false,
  },
  media: {
    readinessKey: "media",
    title: "Before You Serve — Media Team",
    subtitle: "Read about Shanah City and media team expectations, then answer 10 questions before joining.",
    expectations: [
      "Arrive early for setup and sound check — often 60–90 minutes before service.",
      "Know your assigned role each Sunday (Mac Mini, camera, slides, stream, audio, etc.).",
      "Stay through post-service breakdown unless your leader releases you.",
      "Follow direction during live moments — do not freestyle during service.",
      "Do not post clips or photos from service without leader approval.",
      "Report equipment issues before service when possible.",
    ],
    questions: withSharedQuestions([
      {
        id: "media-arrive",
        prompt: "When should media team members typically arrive?",
        options: [
          "Right when worship starts",
          "Early enough for setup and sound check",
          "Only when my specific role begins",
        ],
        correctIndex: 1,
      },
      {
        id: "media-role",
        prompt: "How do you know your Sunday role?",
        options: [
          "Pick any open role when I arrive",
          "Check the published team roster in the app",
          "Wait for someone to text me that morning",
        ],
        correctIndex: 1,
      },
      {
        id: "media-content",
        prompt: "Can you post service clips on personal social media without approval?",
        options: ["Yes, anytime", "No — get leader approval first", "Only if it looks good"],
        correctIndex: 1,
      },
    ]),
    commitmentLabel:
      "I commit to these media team standards and will serve my assigned role reliably.",
    requiresLeaderApproval: false,
  },
  ushers: {
    readinessKey: "ushers",
    title: "Before You Serve — Ushering",
    subtitle: "Read about Shanah City and ushering expectations, then answer 10 questions before joining.",
    expectations: [
      "Arrive early — typically 45–60+ minutes before service.",
      "Welcome guests warmly, calmly, and with a servant heart.",
      "Follow your usher lead and stay for the full service unless released.",
      "Help with seating, directions, offerings, and emergencies without arguing.",
      "Escalate difficult situations to your lead — never debate with guests.",
      "Keep your phone silent and dress appropriately while serving.",
    ],
    questions: withSharedQuestions([
      {
        id: "ushers-arrive",
        prompt: "When should ushers typically arrive?",
        options: [
          "Well before service begins",
          "Five minutes before worship starts",
          "Whenever parking fills up",
        ],
        correctIndex: 0,
      },
      {
        id: "ushers-guest",
        prompt: "A guest is upset at the door. What should you do?",
        options: [
          "Argue until they calm down",
          "Stay calm, listen, and get your usher lead",
          "Ignore it and keep moving the line",
        ],
        correctIndex: 1,
      },
      {
        id: "ushers-stay",
        prompt: "Can you leave as soon as offering is done?",
        options: [
          "Yes, unless I have plans",
          "No — stay until your lead releases you",
          "Only if no one is watching",
        ],
        correctIndex: 1,
      },
    ]),
    commitmentLabel:
      "I commit to these ushering standards and will serve guests with excellence.",
    requiresLeaderApproval: false,
  },
  kids: {
    readinessKey: "kids",
    title: "Before You Serve — Kids Ministry",
    subtitle: "Read about Shanah City and Kids Ministry safety expectations, then answer 10 questions before joining.",
    expectations: [
      "Child safety comes first — follow check-in and check-out every time.",
      "Never be alone with a child when two-adult coverage is required.",
      "Use approved curriculum and do not ad-lib sensitive topics.",
      "Report safeguarding concerns immediately to the Kids lead or a pastor.",
      "Arrive early, stay engaged, and keep your phone away while serving.",
      "Your leader may require additional background checks or training before serving.",
    ],
    questions: withSharedQuestions([
      {
        id: "kids-pickup",
        prompt: "A child is not picked up on time. What should you do?",
        options: [
          "Walk them to the parking lot to find their ride",
          "Follow church protocol and notify your leader",
          "Send them home with another family",
        ],
        correctIndex: 1,
      },
      {
        id: "kids-alone",
        prompt: "Can you take a child to the bathroom alone?",
        options: [
          "Yes, if they ask nicely",
          "No — follow the two-adult / team safety rule",
          "Only if you know the family",
        ],
        correctIndex: 1,
      },
      {
        id: "kids-concern",
        prompt: "You notice something that feels unsafe. Who do you tell?",
        options: [
          "No one until you are sure",
          "Kids ministry leader or pastor immediately",
          "Only the child's parent",
        ],
        correctIndex: 1,
      },
    ]),
    commitmentLabel:
      "I commit to these Kids Ministry safety standards and will follow leader direction.",
    requiresLeaderApproval: true,
  },
};

export function getMinistryReadinessPack(readinessKey: MinistryReadinessKey): MinistryReadinessPack {
  return READINESS_PACKS[readinessKey];
}

export function resolveMinistryReadiness(group: {
  id: string;
  name: string;
}): MinistryReadinessPack | null {
  if (group.id === "group-choir") return READINESS_PACKS.choir;
  if (group.id === "group-kids") return READINESS_PACKS.kids;
  if (group.id === "group-ushering" || group.id === FRONTLINERS_GROUP_ID) {
    return READINESS_PACKS.ushers;
  }
  if (isMediaGroup(group)) return READINESS_PACKS.media;
  return null;
}

export function isTrainingRequiredCompletion(
  completion?: MinistryReadinessCompletion | null,
): boolean {
  return completion?.source === "training_required";
}

export function toPublicReadinessPack(
  pack: MinistryReadinessPack,
  completion?: MinistryReadinessCompletion | null,
): MinistryReadinessPublicPack {
  const trainingRequired = isTrainingRequiredCompletion(completion);
  const selfJoinCompleted = completion?.source === "self_join";
  const total = pack.questions.length;
  return {
    readinessKey: pack.readinessKey,
    title: pack.title,
    subtitle: pack.subtitle,
    churchIdentity: SHARED_CHURCH_IDENTITY,
    sharedStandards: SHARED_MINISTRY_STANDARDS,
    expectations: pack.expectations,
    questions: pack.questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
    sharedCommitmentLabel: SHARED_MINISTRY_COMMITMENT,
    commitmentLabel: pack.commitmentLabel,
    requiresLeaderApproval: pack.requiresLeaderApproval,
    passingScore: {
      required: minCorrectToPass(total),
      total,
    },
    completed: selfJoinCompleted,
    completedAt: selfJoinCompleted ? completion?.agreedAt : undefined,
    requiredForSelfJoin: !completion || trainingRequired,
    requiredForRetraining: trainingRequired,
  };
}

export function scoreReadinessAnswers(
  pack: MinistryReadinessPack,
  answers: Record<string, number>,
) {
  let correct = 0;
  for (const question of pack.questions) {
    if (answers[question.id] === question.correctIndex) {
      correct += 1;
    }
  }
  return { correct, total: pack.questions.length };
}

export function groupRequiresMinistryReadiness(group: { id: string; name: string }) {
  return resolveMinistryReadiness(group) !== null;
}
