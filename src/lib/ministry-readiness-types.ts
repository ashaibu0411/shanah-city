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

export type MinistryReadinessSource = "self_join" | "leader_added" | "existing_member";

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
};

/** Minimum percentage of quiz questions that must be correct to pass. */
export const MINISTRY_READINESS_PASS_PERCENT = 100;

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
  "I agree to uphold these Shanah ministry standards in how I serve, communicate, and represent the church.";

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
    subtitle: "Read these expectations and answer a few questions before joining the worship team.",
    expectations: [
      "Be on time for rehearsal and service call times — lateness affects the whole team.",
      "Prepare your parts before Sunday (lyrics, vocals, musicianship).",
      "Tell your worship leader as early as possible when you cannot serve.",
      "Serve with humility — worship is for God, not performance.",
      "Dress clean and modest, suitable for leading others in worship.",
      "Honor team communication through the app, chat, and worship planner.",
    ],
    questions: [
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
    ],
    commitmentLabel:
      "I commit to these worship team standards and will communicate early when I cannot serve.",
    requiresLeaderApproval: false,
  },
  media: {
    readinessKey: "media",
    title: "Before You Serve — Media Team",
    subtitle: "Sound, stream, slides, and camera roles require reliability before Sunday starts.",
    expectations: [
      "Arrive early for setup and sound check — often 60–90 minutes before service.",
      "Know your assigned role each Sunday (Mac Mini, camera, slides, stream, audio, etc.).",
      "Stay through post-service breakdown unless your leader releases you.",
      "Follow direction during live moments — do not freestyle during service.",
      "Do not post clips or photos from service without leader approval.",
      "Report equipment issues before service when possible.",
    ],
    questions: [
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
    ],
    commitmentLabel:
      "I commit to these media team standards and will serve my assigned role reliably.",
    requiresLeaderApproval: false,
  },
  ushers: {
    readinessKey: "ushers",
    title: "Before You Serve — Ushering",
    subtitle: "Ushers and greeters may be the first welcome a guest receives at Shanah.",
    expectations: [
      "Arrive early — typically 45–60+ minutes before service.",
      "Welcome guests warmly, calmly, and with a servant heart.",
      "Follow your usher lead and stay for the full service unless released.",
      "Help with seating, directions, offerings, and emergencies without arguing.",
      "Escalate difficult situations to your lead — never debate with guests.",
      "Keep your phone silent and dress appropriately while serving.",
    ],
    questions: [
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
    ],
    commitmentLabel:
      "I commit to these ushering standards and will serve guests with excellence.",
    requiresLeaderApproval: false,
  },
  kids: {
    readinessKey: "kids",
    title: "Before You Serve — Kids Ministry",
    subtitle: "Serving children requires safety, consistency, and leader oversight.",
    expectations: [
      "Child safety comes first — follow check-in and check-out every time.",
      "Never be alone with a child when two-adult coverage is required.",
      "Use approved curriculum and do not ad-lib sensitive topics.",
      "Report safeguarding concerns immediately to the Kids lead or a pastor.",
      "Arrive early, stay engaged, and keep your phone away while serving.",
      "Your leader may require additional background checks or training before serving.",
    ],
    questions: [
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
    ],
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

export function toPublicReadinessPack(
  pack: MinistryReadinessPack,
  completion?: MinistryReadinessCompletion | null,
): MinistryReadinessPublicPack {
  const selfJoinCompleted = completion?.source === "self_join";
  const total = pack.questions.length;
  return {
    readinessKey: pack.readinessKey,
    title: pack.title,
    subtitle: pack.subtitle,
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
    requiredForSelfJoin: !completion,
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
