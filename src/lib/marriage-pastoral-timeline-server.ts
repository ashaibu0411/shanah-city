import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
} from "@/lib/marriage-counseling-access";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import type { MarriagePastoralTimelineEvent } from "@/lib/marriage-certificate-types";
import { PREMARITAL_PROGRAM_SESSIONS, getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function buildPastoralTimeline(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || journey.programType !== "premarital") throw new Error("Not found.");

  const canEditReadiness = await isSeniorPastor(viewer);
  let hasClinical = false;
  try {
    await assertClinicalCounselorForJourney(viewer, journey);
    hasClinical = true;
  } catch {
    if (!canEditReadiness) throw new Error("Counselor access required.");
  }

  const events: MarriagePastoralTimelineEvent[] = [];
  const sessions = await listAllJourneySessions(journeyId);
  for (const appt of sessions) {
    const isSupplementary = !appt.premaritalSessionKey;
    const title = isSupplementary
      ? appt.topic?.trim() || "Additional counseling session"
      : getPremaritalSessionDefinition(appt.premaritalSessionKey!)?.title ?? appt.topic ?? "Counseling session";
    events.push({
      id: `appt-${appt.id}`,
      at: appt.scheduledAt,
      category: "appointment",
      title,
      summary: `${(appt.status ?? "scheduled").replace(/_/g, " ")}${isSupplementary ? " · supplementary" : ""}`,
      visibility: "clinical",
    });
  }

  if (hasClinical) {
    const clinical = await store().listPremaritalSessionClinicalForJourney(journeyId);
    for (const row of clinical) {
      const def = getPremaritalSessionDefinition(row.sessionKey);
      events.push({
        id: `clinical-${row.sessionKey}`,
        at: row.sessionDate ?? row.updatedAt,
        category: "attendance",
        title: def ? `Session ${def.order} attendance` : row.sessionKey,
        summary: [
          row.partnerAAttended === true ? "Partner A attended" : row.partnerAAttended === false ? "Partner A absent" : null,
          row.partnerBAttended === true ? "Partner B attended" : row.partnerBAttended === false ? "Partner B absent" : null,
          row.outcome ? `Outcome: ${row.outcome.replace(/_/g, " ")}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        visibility: "clinical",
      });
      if (row.followUpActions?.trim()) {
        events.push({
          id: `followup-${row.sessionKey}`,
          at: row.updatedAt,
          category: "follow_up",
          title: "Follow-up actions",
          summary: row.followUpActions.trim(),
          visibility: "clinical",
        });
      }
    }

    const supplementaryClinical = await store().listSupplementaryClinicalForJourney(journeyId);
    for (const row of supplementaryClinical) {
      events.push({
        id: `supp-clinical-${row.appointmentId}`,
        at: row.sessionDate ?? row.updatedAt,
        category: "attendance",
        title: "Supplementary session record",
        summary: row.topicsCovered?.trim() || "Clinical record updated",
        visibility: "clinical",
      });
    }
  }

  const programSessions = await store().listPremaritalProgramSessionsForJourney(journeyId);
  for (const row of programSessions) {
    if (row.status !== "completed") continue;
    const def = PREMARITAL_PROGRAM_SESSIONS.find((s) => s.sessionKey === row.sessionKey);
    events.push({
      id: `complete-${row.sessionKey}`,
      at: row.completedAt ?? row.updatedAt,
      category: "session_completion",
      title: def ? `Session ${def.order} marked complete` : "Session completed",
      summary: def?.title ?? row.sessionKey,
      visibility: canEditReadiness ? "pastoral" : "clinical",
    });
  }

  const homework = await store().listSessionHomeworkForJourney(journeyId);
  for (const hw of homework) {
    if (hw.status !== "released") continue;
    events.push({
      id: `hw-${hw.id}`,
      at: hw.releasedAt ?? hw.updatedAt,
      category: "homework",
      title: "Homework released",
      summary: hw.title,
      visibility: "clinical",
    });
  }

  const meta = await store().getPremaritalProgramMeta(journeyId);
  if (meta?.pausedAt) {
    events.push({
      id: `pause-${journeyId}`,
      at: meta.pausedAt,
      category: "program_pause",
      title: "Program paused",
      summary: "Counselor paused the premarital journey",
      visibility: "pastoral",
    });
  }

  if (canEditReadiness) {
    const readiness = await store().getPremaritalReadinessReview(journeyId);
    if (readiness) {
      events.push({
        id: `readiness-${journeyId}`,
        at: readiness.updatedAt,
        category: "readiness",
        title: "Readiness review updated",
        summary: `Status: ${readiness.status.replace(/_/g, " ")}`,
        visibility: "pastoral",
      });
    }
  }

  const certs = await store().listFinalCertificatesForJourney(journeyId);
  for (const cert of certs) {
    events.push({
      id: `cert-${cert.id}`,
      at: cert.issuedAt,
      category: "certificate",
      title: `Final certificate ${cert.status}`,
      summary: cert.certificateNumber,
      visibility: "pastoral",
    });
  }

  events.sort((a, b) => b.at.localeCompare(a.at));
  return { events };
}
