import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { AGREEMENT_5, lesson, likertBank, q } from "@/lib/marriage-stage2-content/builders";

type GrowthLessonCopy = {
  learnTitle?: string;
  learnBody: string;
  reflectBody: string;
  agreeBody: string;
  discussionPrompt: string;
};

function growthModule(
  id: string,
  title: string,
  summary: string,
  section: string,
  sortOrder: number,
  likertPrompts: string[],
  copy: GrowthLessonCopy,
): MarriageModuleDefinition {
  const lessons = [
    lesson(`${id}-l01`, copy.learnTitle ?? "Learn together", copy.learnBody, "learn", 1),
    lesson(`${id}-l02`, "Reflect privately", copy.reflectBody, "reflect", 2),
    lesson(`${id}-l03`, "Discuss & agree", copy.agreeBody, "agree", 3),
  ];
  const bank = likertBank(id, `${id}-l01`, `${id}-lk`, likertPrompts, { requiredIndexes: [0, 2] });
  const privateReflection = q(
    id,
    `${id}-private`,
    "What do you want your counselor to know about this area? (Private unless you share later.)",
    "long_reflection",
    "private_reflection",
    { lessonId: `${id}-l02`, allowSkip: true },
  );
  const growthStep = q(
    id,
    `${id}-growth-step`,
    "Name one concrete habit you will practice together in the next two weeks.",
    "long_reflection",
    "shared_after_both_submit",
    { lessonId: `${id}-l03` },
  );
  const partnerDiscussion = q(
    id,
    `${id}-discuss`,
    copy.discussionPrompt,
    "long_reflection",
    "shared_after_both_submit",
    { lessonId: `${id}-l03` },
  );
  const sharedAgreement = q(
    id,
    `${id}-shared-agree`,
    "We will revisit this topic in counseling when we disagree.",
    "agreement",
    "shared_after_both_submit",
    { lessonId: `${id}-l03`, options: [...AGREEMENT_5] },
  );
  return {
    id,
    title,
    summary,
    sortOrder,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    questions: [...bank, privateReflection, partnerDiscussion, growthStep, sharedAgreement],
    meta: {
      stage2Section: section,
      activityKind: "agreement_builder",
      estimatedMinutes: 35,
      pastoralGuide: "Celebrate strengths; discuss differences with curiosity, not diagnosis.",
    },
  };
}

export function buildMod07FaithValuesModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-07-faith-values",
    "Faith, spirituality & values",
    "Shared values and spiritual rhythms without forcing identical practice.",
    "growth",
    107,
    [
      "Regular worship together is important for our marriage.",
      "We can respect different spiritual backgrounds while sharing core values.",
      "Prayer or spiritual conversation should be part of our weekly rhythm.",
      "We will protect Sabbath or rest as a couple.",
      "Faith should shape how we handle conflict.",
      "We agree on how we will serve in church together.",
    ],
    {
      learnBody:
        "Scripture calls couples to encourage one another in faith (Hebrews 10:24–25). You do not need identical church backgrounds to build a shared spiritual rhythm. Discuss what worship, prayer, and service look like in your future home.",
      reflectBody:
        "Before you compare answers, note where your faith story brings strength and where you feel tender or unsure. Your counselor can see private reflections only if you grant consent.",
      agreeBody:
        "After both submit, compare your responses and choose one weekly rhythm you will try for the next month (prayer, devotional, service, or rest).",
      discussionPrompt:
        "Where do our spiritual rhythms already align, and where do we need a gentle plan before marriage?",
    },
  );
}

export function buildMod08RolesModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-08-roles",
    "Roles & responsibilities",
    "Household roles by gifting and season, not stereotypes alone.",
    "agreements",
    108,
    [
      "We will divide chores by gifting and availability, not gender alone.",
      "Career seasons may shift who carries more at home.",
      "We will renegotiate roles when life changes (children, moves, illness).",
      "Both partners should know basic household finances.",
      "Emotional labor (planning, remembering) should be shared intentionally.",
      "We will ask for help before resentment builds.",
    ],
    {
      learnBody:
        "Ephesians 5:21 invites mutual submission in marriage. Roles shift with seasons—new jobs, illness, children, or caring for parents. Name tasks (meals, laundry, finances, scheduling) and decide who leads each season without shaming gender stereotypes.",
      reflectBody:
        "List two tasks you enjoy, two you tolerate, and two that drain you. Consider how your family of origin shaped your expectations.",
      agreeBody:
        "Draft a simple household plan for your first year of marriage and a sentence about how you will renegotiate when life changes.",
      discussionPrompt:
        "Which household responsibility do we most need to clarify before we feel overwhelmed?",
    },
  );
}

export function buildMod09ParentingModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-09-parenting",
    "Parenting & family planning",
    "Timing, discipline, and extended family — skip sensitive items if not applicable.",
    "agreements",
    109,
    [
      "We have discussed whether and when we hope to have children.",
      "We agree on seeking counsel before major parenting decisions.",
      "Discipline approaches should be unified before children arrive.",
      "Extended family input will not override our household decisions.",
      "We can pause this module if children are not part of our plan.",
      "Adoption or fertility journeys would be faced together with pastoral support.",
    ],
    {
      learnBody:
        "Whether or not you plan to have children, aligning on timing, discipline philosophy, and extended-family boundaries prevents surprise conflict later. Skip items that do not apply and note that in your private reflection.",
      reflectBody:
        "Share honestly about fears, hopes, and timelines. If children are not part of your plan, describe how you will navigate family questions with grace.",
      agreeBody:
        "Identify one boundary with extended family and one parenting value you both want to uphold if children come.",
      discussionPrompt:
        "What parenting or family-planning conversation do we need pastoral guidance on before we assume agreement?",
    },
  );
}

export function buildMod10TrustDigitalModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-10-trust-digital",
    "Trust, boundaries & digital life",
    "Healthy boundaries without surveillance or shame.",
    "agreements",
    110,
    [
      "Phones should not replace face-to-face connection during dates or meals.",
      "We will discuss social media boundaries openly.",
      "Password sharing is a trust conversation, not a demand by default.",
      "Past relationships on social media should be handled with transparency.",
      "We will protect private messages from public sharing.",
      "If trust is broken digitally, we will seek pastoral help quickly.",
    ],
    {
      learnBody:
        "Trust grows through transparency, not surveillance. Discuss phones at the table, social media friendships, and how you will repair trust if a boundary is crossed—without shame, with pastoral help when needed.",
      reflectBody:
        "Describe a digital habit that builds connection for you and one that has caused tension in past relationships.",
      agreeBody:
        "Choose two digital boundaries you both agree to for the first six months of marriage.",
      discussionPrompt:
        "How will we notice early warning signs and talk before jealousy or secrecy takes root?",
    },
  );
}

export function buildMod11LifeVisionModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-11-life-vision",
    "Life goals & long-term vision",
    "Five-year themes and one-year commitments.",
    "growth",
    111,
    [
      "We have shared our five-year hopes with each other.",
      "Ministry or career dreams will be held with mutual support.",
      "Geographic moves will be decided together.",
      "Financial goals align with our stated priorities.",
      "We will celebrate progress, not only final outcomes.",
      "We will revisit this vision annually.",
    ],
    {
      learnBody:
        "Proverbs 16:3 encourages committing plans to the Lord. Share career, ministry, geographic, and financial themes for the next five years—not as rigid control, but as direction you pray over together.",
      reflectBody:
        "Write one dream you hope your spouse will champion and one sacrifice you may need to make for mutual flourishing.",
      agreeBody:
        "Pick one one-year goal and one habit that keeps your vision visible (monthly check-in, shared document, calendar review).",
      discussionPrompt:
        "Where could our individual ambitions compete unless we schedule regular vision conversations?",
    },
  );
}

export function buildMod12EnrichmentModule(): MarriageModuleDefinition {
  return growthModule(
    "s2-mod-12-enrichment",
    "Marriage health & enrichment",
    "Monthly check-ins and habits after premarital counseling.",
    "growth",
    112,
    [
      "We will schedule regular marriage check-ins after the wedding.",
      "Date nights are a priority, not a luxury we skip first.",
      "We know how to ask for help when we feel distant.",
      "Gratitude and affirmation will be spoken weekly.",
      "We will continue learning together after premarital sessions end.",
      "Community mentors or small groups will stay part of our support.",
    ],
    {
      learnBody:
        "Premarital counseling ends; marriage enrichment continues. Plan monthly check-ins, date nights, and mentors who can speak into your marriage after the wedding.",
      reflectBody:
        "What early warning sign tells you that you are drifting—and what will you say to your spouse when you notice it?",
      agreeBody:
        "Schedule your first post-wedding check-in (date + format) and name one mentor or couple you will invite into your story.",
      discussionPrompt:
        "How will we protect enrichment time when work, children, or ministry pressure increases?",
    },
  );
}
