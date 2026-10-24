import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import type { MarriagePremaritalProgramSessionRecord } from "@/lib/marriage-counseling-types";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export function sessionCertificateReference(journeyId: string, sessionKey: string) {
  const slug = journeyId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const key = sessionKey.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  return `SC-${slug}-${key}`;
}

export function resolveSessionCompletionDate(input: {
  programRow: MarriagePremaritalProgramSessionRecord | null;
  clinicalSessionDate: string | null;
}): { date: string | null; missing: boolean } {
  if (input.clinicalSessionDate) return { date: input.clinicalSessionDate, missing: false };
  if (input.programRow?.completedAt) return { date: input.programRow.completedAt, missing: false };
  if (input.programRow?.status === "completed" && input.programRow.updatedAt) {
    return { date: null, missing: true };
  }
  return { date: null, missing: false };
}

export async function computeFinalCertificateBlockers(journey: MarriageCounselingJourneyRecord) {
  const blockers: string[] = [];
  if (journey.programType !== "premarital") blockers.push("Premarital journey required.");
  if (journey.status !== "active") blockers.push("Journey must be active.");

  const meta = await store().getPremaritalProgramMeta(journey.id);
  if (meta?.pausedAt) blockers.push("Program is paused.");

  const records = await store().listPremaritalProgramSessionsForJourney(journey.id);
  for (const def of PREMARITAL_PROGRAM_SESSIONS) {
    const row = records.find((r) => r.sessionKey === def.sessionKey);
    if (!row || row.status !== "completed") {
      blockers.push(`Session ${def.order} (${def.title}) is not marked complete by counselor.`);
    }
  }

  const consents = await store().getConsentsForJourney(journey.id);
  const participantIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
  if (participantIds.length < 2) blockers.push("Both partners must join the journey.");
  for (const pid of participantIds) {
    if (!consents.some((c) => c.userId === pid && c.consentedAt)) {
      blockers.push("Both partners must record individual consent.");
    }
  }

  const homework = (await store().listSessionHomeworkForJourney(journey.id)).filter(
    (h) => h.status === "released",
  );
  for (const hw of homework) {
    const responses = await store().listSessionHomeworkResponses(hw.id);
    const submitted = responses.filter((r) => r.submittedAt);
    if (submitted.length < 2) {
      blockers.push(`Released homework "${hw.title}" awaiting both partners' submission.`);
    }
  }

  const active = (await store().listFinalCertificatesForJourney(journey.id)).find(
    (c) => c.status === "active",
  );
  if (active) blockers.push("An active final certificate already exists.");

  return blockers;
}

export async function suggestProgramCompletionDate(journeyId: string) {
  const records = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const clinical = await store().listPremaritalSessionClinicalForJourney(journeyId);
  const dates: number[] = [];
  for (const def of PREMARITAL_PROGRAM_SESSIONS) {
    const row = records.find((r) => r.sessionKey === def.sessionKey);
    if (row?.status !== "completed") continue;
    const clin = clinical.find((c) => c.sessionKey === def.sessionKey);
    const resolved = resolveSessionCompletionDate({
      programRow: row,
      clinicalSessionDate: clin?.sessionDate ?? null,
    });
    if (resolved.date) dates.push(new Date(resolved.date).getTime());
    else if (row.completedAt) dates.push(new Date(row.completedAt).getTime());
  }
  if (dates.length === 0) return { date: null as string | null, missing: true };
  return { date: new Date(Math.max(...dates)).toISOString(), missing: false };
}
