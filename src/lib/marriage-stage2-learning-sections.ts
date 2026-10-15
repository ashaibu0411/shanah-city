import type { MarriageLearningSectionView } from "@/lib/marriage-counseling-types";
import { marriageStage2IntimacyModuleAccessible } from "@/lib/marriage-stage2-feature";
import { allStage2ModuleDefinitions } from "@/lib/marriage-stage2-module-registry";

export function buildLearningSections(): MarriageLearningSectionView[] {
  const bySection = new Map<string, string[]>();
  for (const mod of allStage2ModuleDefinitions()) {
    if (!marriageStage2IntimacyModuleAccessible(mod.id)) continue;
    const section = mod.meta?.stage2Section ?? "discover";
    const list = bySection.get(section) ?? [];
    list.push(mod.id);
    bySection.set(section, list);
  }

  const defs: Array<Omit<MarriageLearningSectionView, "moduleIds">> = [
    {
      id: "journey",
      title: "Our journey",
      description: "Progress, goals, and what is next for you as a couple.",
    },
    {
      id: "discover",
      title: "Discover each other",
      description: "Personality, upbringing, and how you are wired.",
    },
    {
      id: "talk",
      title: "Let's talk",
      description: "Communication exercises and feeling heard.",
    },
    {
      id: "scenarios",
      title: "Real-life scenarios",
      description: "Independent choices, then compare with care.",
    },
    {
      id: "agreements",
      title: "Our agreements",
      description: "Shared decisions, roles, and boundaries.",
    },
    {
      id: "growth",
      title: "Our growth",
      description: "Faith, vision, enrichment, and check-ins.",
    },
    {
      id: "counselor",
      title: "Counselor sessions",
      description: "Homework, prep, and follow-up with your pastor or counselor.",
    },
  ];

  return defs.map((d) => ({
    ...d,
    moduleIds: bySection.get(d.id) ?? (d.id === "journey" ? [] : []),
  }));
}
