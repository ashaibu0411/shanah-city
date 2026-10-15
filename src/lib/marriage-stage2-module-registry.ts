/**
 * Twelve-module scaffold (Phase 2B–2C expand question banks).
 * Merges with STAGE2_MODULES in catalog for getAllModuleDefinitions.
 */
import type {
  MarriageModuleDefinition,
  MarriageStage2ActivityKind,
} from "@/lib/marriage-counseling-types";
import { STAGE2_MODULES } from "@/lib/marriage-stage2-catalog";
import { applyPhase2BContentToModule } from "@/lib/marriage-stage2-content";

function stubModule(
  id: string,
  title: string,
  summary: string,
  section: string,
  kind: MarriageStage2ActivityKind,
  sortOrder: number,
): MarriageModuleDefinition {
  return {
    id,
    title,
    summary,
    sortOrder,
    programTypes: ["premarital", "enrichment", "guided"],
    meta: {
      stage2Section: section,
      activityKind: kind,
      estimatedMinutes: 25,
      pastoralGuide: "Celebrate strengths; discuss differences with curiosity.",
    },
    questions: [
      {
        id: `${id}-intro-reflection`,
        moduleId: id,
        prompt: "What do you hope to learn or practice in this module? (Private until you choose to share.)",
        type: "long_reflection",
        required: false,
        allowSkip: true,
        visibility: "private_reflection",
      },
    ],
  };
}

/** Registry entries; modules with empty questions link to dedicated s2-* content modules. */
export const STAGE2_MODULE_REGISTRY: MarriageModuleDefinition[] = [
  {
    ...STAGE2_MODULES.find((m) => m.id === "s2-temperament-discovery")!,
    meta: {
      ...STAGE2_MODULES.find((m) => m.id === "s2-temperament-discovery")!.meta,
      stage2Section: "discover",
      activityKind: "assessment",
      estimatedMinutes: 35,
    },
  },
  stubModule(
    "s2-mod-02-family-background",
    "Family background & upbringing",
    "How your homes shaped expectations, conflict, money, and extended family.",
    "discover",
    "assessment",
    102,
  ),
  stubModule(
    "s2-mod-03-communication",
    "Communication & emotional connection",
    "Listening, validation, and the “what I heard vs what you meant” exercise.",
    "talk",
    "conversation_card",
    103,
  ),
  stubModule(
    "s2-mod-04-conflict-lab",
    "Conflict resolution lab",
    "Simulations and repair practice — not for abuse situations.",
    "scenarios",
    "scenario",
    104,
  ),
  {
    ...STAGE2_MODULES.find((m) => m.id === "s2-financial-workshop")!,
    meta: {
      ...STAGE2_MODULES.find((m) => m.id === "s2-financial-workshop")!.meta,
      stage2Section: "agreements",
      activityKind: "budget_worksheet",
      estimatedMinutes: 40,
    },
  },
  stubModule(
    "s2-mod-06-intimacy",
    "Sex, intimacy & affection",
    "Mature, consent-based education for adult couples.",
    "discover",
    "reflection",
    106,
  ),
  stubModule(
    "s2-mod-07-faith-values",
    "Faith, spirituality & values",
    "Shared values and spiritual growth plans.",
    "growth",
    "agreement_builder",
    107,
  ),
  stubModule(
    "s2-mod-08-roles",
    "Roles & responsibilities",
    "Who does what — by gifting, not gender alone.",
    "agreements",
    "ranking",
    108,
  ),
  stubModule(
    "s2-mod-09-parenting",
    "Parenting & family planning",
    "Timing, discipline, and extended family — with skip options for sensitive topics.",
    "agreements",
    "scenario",
    109,
  ),
  stubModule(
    "s2-mod-10-trust-digital",
    "Trust, boundaries & digital life",
    "Healthy boundaries without surveillance.",
    "agreements",
    "agreement_builder",
    110,
  ),
  stubModule(
    "s2-mod-11-life-vision",
    "Life goals & long-term vision",
    "Five-year vision and one-year action steps.",
    "growth",
    "agreement_builder",
    111,
  ),
  stubModule(
    "s2-mod-12-enrichment",
    "Marriage health & enrichment",
    "Monthly check-ins and habits after premarital work.",
    "growth",
    "reflection",
    112,
  ),
  {
    ...STAGE2_MODULES.find((m) => m.id === "s2-scenario-library")!,
    meta: {
      ...STAGE2_MODULES.find((m) => m.id === "s2-scenario-library")!.meta,
      stage2Section: "scenarios",
      activityKind: "scenario",
    },
  },
  {
    ...STAGE2_MODULES.find((m) => m.id === "s2-learning-reflection")!,
    meta: {
      ...STAGE2_MODULES.find((m) => m.id === "s2-learning-reflection")!.meta,
      stage2Section: "growth",
      activityKind: "reflection",
    },
  },
];

export function allStage2ModuleDefinitions(): MarriageModuleDefinition[] {
  const byId = new Map<string, MarriageModuleDefinition>();
  for (const mod of STAGE2_MODULE_REGISTRY) {
    byId.set(mod.id, applyPhase2BContentToModule(mod));
  }
  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}
