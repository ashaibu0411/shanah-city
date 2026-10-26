import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { AGREEMENT_5, lesson, likertBank, q } from "@/lib/marriage-stage2-content/builders";

function growthModule(
  id: string,
  title: string,
  summary: string,
  section: string,
  sortOrder: number,
  likertPrompts: string[],
): MarriageModuleDefinition {
  const lessons = [
    lesson(`${id}-l01`, "Learn together", summary, "learn", 1),
    lesson(`${id}-l02`, "Reflect privately", "Individual reflection before sharing.", "reflect", 2),
    lesson(`${id}-l03`, "Agree on next steps", "Turn insights into habits.", "agree", 3),
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
    questions: [...bank, privateReflection, sharedAgreement],
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
  );
}
