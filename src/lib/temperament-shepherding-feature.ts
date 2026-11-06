/**
 * Server-controlled feature gate for Temperament & Shepherding Hub.
 * Default off in all environments until explicitly enabled.
 */
export function isTemperamentShepherdingHubEnabled(): boolean {
  return process.env.TEMPERAMENT_SHEPHERDING_HUB_ENABLED?.trim() === "1";
}

export function temperamentShepherdingClientEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TEMPERAMENT_SHEPHERDING_HUB?.trim() === "1";
}

/** UI affordances (e.g. planner link): requires both flags so hubs stay dark unless fully configured. */
export function temperamentShepherdingPilotUiEnabled(): boolean {
  return isTemperamentShepherdingHubEnabled() && temperamentShepherdingClientEnabled();
}
