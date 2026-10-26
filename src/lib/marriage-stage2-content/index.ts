import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { buildMod01TemperamentModule } from "@/lib/marriage-stage2-content/mod-01-temperament";
import { buildMod02FamilyModule } from "@/lib/marriage-stage2-content/mod-02-family";
import { buildMod03CommunicationModule } from "@/lib/marriage-stage2-content/mod-03-communication";
import { buildMod04ConflictModule } from "@/lib/marriage-stage2-content/mod-04-conflict";
import { buildMod05FinancialModule } from "@/lib/marriage-stage2-content/mod-05-financial";
import { buildMod06IntimacyModule } from "@/lib/marriage-stage2-content/mod-06-intimacy";
import {
  buildMod07FaithValuesModule,
  buildMod08RolesModule,
  buildMod09ParentingModule,
  buildMod10TrustDigitalModule,
  buildMod11LifeVisionModule,
  buildMod12EnrichmentModule,
} from "@/lib/marriage-stage2-content/mod-07-12-growth";

export const STAGE2_PHASE2B_CONTENT_VERSION = "stage2-2026.2b";

const BUILDERS: Record<string, () => MarriageModuleDefinition> = {
  "s2-temperament-discovery": buildMod01TemperamentModule,
  "s2-mod-02-family-background": buildMod02FamilyModule,
  "s2-mod-03-communication": buildMod03CommunicationModule,
  "s2-mod-04-conflict-lab": buildMod04ConflictModule,
  "s2-financial-workshop": buildMod05FinancialModule,
  "s2-mod-06-intimacy": buildMod06IntimacyModule,
  "s2-mod-07-faith-values": buildMod07FaithValuesModule,
  "s2-mod-08-roles": buildMod08RolesModule,
  "s2-mod-09-parenting": buildMod09ParentingModule,
  "s2-mod-10-trust-digital": buildMod10TrustDigitalModule,
  "s2-mod-11-life-vision": buildMod11LifeVisionModule,
  "s2-mod-12-enrichment": buildMod12EnrichmentModule,
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
