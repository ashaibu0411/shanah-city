import type { PublicMember } from "@/lib/auth-types";
import { assertClinicalCounselorForJourney } from "@/lib/marriage-counseling-access";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import type { MarriagePastoralReportKind } from "@/lib/marriage-certificate-types";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function buildPastoralReportText(
  viewer: PublicMember,
  journeyId: string,
  kind: MarriagePastoralReportKind,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || journey.programType !== "premarital") throw new Error("Not found.");

  const sp = await isSeniorPastor(viewer);
  try {
    await assertClinicalCounselorForJourney(viewer, journey);
  } catch {
    if (!sp) throw new Error("Counselor access required.");
  }

  const lines: string[] = [`Shanah City — Marriage Prep Report (${kind})`, `Journey: ${journeyId}`, ""];

  const records = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const meta = await store().getPremaritalProgramMeta(journeyId);
  const homework = await store().listSessionHomeworkForJourney(journeyId);
  const sessions = await listAllJourneySessions(journeyId);

  if (kind === "progress" || kind === "completion") {
    lines.push("Eight-session progress:");
    for (const def of PREMARITAL_PROGRAM_SESSIONS) {
      const row = records.find((r) => r.sessionKey === def.sessionKey);
      lines.push(`  ${def.order}. ${def.title}: ${row?.status ?? "not_started"}`);
    }
    lines.push("");
    lines.push(`Completed: ${records.filter((r) => r.status === "completed").length}/8`);
    if (meta?.pausedAt) lines.push("Program status: PAUSED");
  }

  if (kind === "attendance" || kind === "completion") {
    lines.push("", "Appointments:");
    for (const appt of sessions.filter((s) => s.status !== "cancelled")) {
      const label = appt.premaritalSessionKey
        ? PREMARITAL_PROGRAM_SESSIONS.find((p) => p.sessionKey === appt.premaritalSessionKey)?.title
        : appt.topic ?? "Supplementary session";
      lines.push(`  - ${label}: ${appt.scheduledAt} (${appt.status})`);
    }
    const clinical = await store().listPremaritalSessionClinicalForJourney(journeyId);
    if (clinical.length) {
      lines.push("", "Attendance records (curriculum sessions):");
      for (const c of clinical) {
        lines.push(
          `  - ${c.sessionKey}: A=${c.partnerAAttended ?? "?"} B=${c.partnerBAttended ?? "?"} outcome=${c.outcome ?? "—"}`,
        );
      }
    }
  }

  if (kind === "homework" || kind === "completion") {
    lines.push("", "Homework (no private answers):");
    for (const hw of homework) {
      const responses = await store().listSessionHomeworkResponses(hw.id);
      const submitted = responses.filter((r) => r.submittedAt).length;
      lines.push(`  - ${hw.title}: ${hw.status}, submissions=${submitted}/2`);
    }
  }

  if (kind === "supplementary" || kind === "completion") {
    const extra = sessions.filter((s) => !s.premaritalSessionKey && s.status !== "cancelled");
    lines.push("", `Supplementary sessions: ${extra.length}`);
    for (const appt of extra) {
      lines.push(`  - ${appt.topic ?? "Additional session"}: ${appt.scheduledAt}`);
    }
  }

  if (kind === "outstanding" || kind === "completion") {
    lines.push("", "Outstanding actions:");
    for (const def of PREMARITAL_PROGRAM_SESSIONS) {
      const row = records.find((r) => r.sessionKey === def.sessionKey);
      if (!row || row.status !== "completed") lines.push(`  - Complete counseling session ${def.order}`);
    }
    for (const hw of homework.filter((h) => h.status === "released")) {
      const responses = await store().listSessionHomeworkResponses(hw.id);
      if (responses.filter((r) => r.submittedAt).length < 2) {
        lines.push(`  - Homework pending submission: ${hw.title}`);
      }
    }
  }

  if (kind === "completion") {
    const certs = await store().listFinalCertificatesForJourney(journeyId);
    const active = certs.find((c) => c.status === "active");
    lines.push("", active ? `Final certificate issued: ${active.certificateNumber}` : "Final certificate: not issued");
    const readiness = await store().getPremaritalReadinessReview(journeyId);
    if (readiness) {
      lines.push(`Readiness review status: ${readiness.status} (separate from certificate issuance)`);
    }
  }

  lines.push("", "Confidential counselor notes and private assessment answers are excluded.");
  return lines.join("\n");
}
