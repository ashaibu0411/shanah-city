import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { allStage2ModuleDefinitions } from "@/lib/marriage-stage2-module-registry";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";

function sortModules(modules: MarriageModuleDefinition[]) {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Live catalog: add Stage 2 modules missing from an older published snapshot (does not overwrite frozen copies). */
export function mergeMissingStage2Modules(
  modules: MarriageModuleDefinition[],
): MarriageModuleDefinition[] {
  if (!isMarriageStage2Enabled()) return modules;
  const byId = new Map(modules.map((m) => [m.id, m]));
  for (const s2 of allStage2ModuleDefinitions()) {
    if (!byId.has(s2.id)) byId.set(s2.id, s2);
  }
  return sortModules([...byId.values()]);
}

/** Publish-time freeze: embed full Stage 2 module definitions into the version snapshot. */
export function freezeStage2ModulesIntoSnapshot(
  modules: MarriageModuleDefinition[],
): MarriageModuleDefinition[] {
  if (!isMarriageStage2Enabled()) return modules;
  const byId = new Map(modules.map((m) => [m.id, m]));
  for (const s2 of allStage2ModuleDefinitions()) {
    byId.set(s2.id, structuredClone(s2));
  }
  return sortModules([...byId.values()]);
}
