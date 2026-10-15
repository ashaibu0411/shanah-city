import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { buildMod01TemperamentModule } from "@/lib/marriage-stage2-content/mod-01-temperament";
import { buildMod02FamilyModule } from "@/lib/marriage-stage2-content/mod-02-family";
import { buildMod03CommunicationModule } from "@/lib/marriage-stage2-content/mod-03-communication";
import { buildMod04ConflictModule } from "@/lib/marriage-stage2-content/mod-04-conflict";
import { buildMod05FinancialModule } from "@/lib/marriage-stage2-content/mod-05-financial";
import { buildMod06IntimacyModule } from "@/lib/marriage-stage2-content/mod-06-intimacy";

export const STAGE2_PHASE2B_CONTENT_VERSION = "stage2-2026.2b";

const BUILDERS: Record<string, () => MarriageModuleDefinition> = {
  "s2-temperament-discovery": buildMod01TemperamentModule,
  "s2-mod-02-family-background": buildMod02FamilyModule,
  "s2-mod-03-communication": buildMod03CommunicationModule,
  "s2-mod-04-conflict-lab": buildMod04ConflictModule,
  "s2-financial-workshop": buildMod05FinancialModule,
  "s2-mod-06-intimacy": buildMod06IntimacyModule,
};

export function getPhase2BModuleDefinition(moduleId: string): MarriageModuleDefinition | null {
  const build = BUILDERS[moduleId];
  return build ? build() : null;
}

export function allPhase2BModuleDefinitions(): MarriageModuleDefinition[] {
  return Object.keys(BUILDERS).map((id) => BUILDERS[id]!());
}

export function applyPhase2BContentToModule(mod: MarriageModuleDefinition): MarriageModuleDefinition {
  const rich = getPhase2BModuleDefinition(mod.id);
  if (!rich) return mod;
  return {
    ...mod,
    title: rich.title,
    summary: rich.summary,
    lessons: rich.lessons,
    questions: rich.questions,
    meta: { ...mod.meta, ...rich.meta },
  };
}
