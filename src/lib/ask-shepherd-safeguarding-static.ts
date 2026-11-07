import { SAFEGUARDING_CRITICAL_NOTICE } from "@/lib/ask-shepherd-safeguarding";

/** When the AI provider is unavailable but the situation may be urgent — no individual allegations stored. */
export function criticalSafeguardingResponseWithoutAi(): string {
  return (
    `${SAFEGUARDING_CRITICAL_NOTICE}\n\n` +
    "**What to do next (human-led):** Pause and ensure immediate physical safety. Contact local emergency services if there is imminent danger. " +
    "Reach your designated safeguarding or pastoral leader through your church’s normal channels — do not rely on this tool alone. " +
    "Preserve privacy: share details only with people who need to know for safety and proper reporting. " +
    "This message is general guidance, not a substitute for licensed professionals or formal church process."
  );
}
