import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertClinicalCounselorForJourney } from "@/lib/marriage-counseling-access";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import type { MarriagePastoralReportKind } from "@/lib/marriage-certificate-types";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export type PastoralReportSection = {
  heading: string;
  rows: string[][];
};

export type PastoralReportDocument = {
  kind: MarriagePastoralReportKind;
  title: string;
  partnerAName: string;
  partnerBName: string;
  journeyId: string;
  generatedAt: string;
  confidentiality: string;
  sections: PastoralReportSection[];
};

const TITLES: Record<MarriagePastoralReportKind, string> = {
  progress: "Eight-Session Progress Summary",
  attendance: "Counseling Attendance Summary",
  homework: "Homework Status Summary",
  supplementary: "Supplementary Counseling Summary",
  outstanding: "Outstanding Actions Summary",
  completion: "Final Completion Summary",
};

function attLabel(v: boolean | null | undefined) {
  if (v === true) return "Attended";
  if (v === false) return "Absent";
  return "Not recorded";
}

export async function buildPastoralReportDocument(
  viewer: PublicMember,
  journeyId: string,
  kind: MarriagePastoralReportKind,
): Promise<PastoralReportDocument> {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || journey.programType !== "premarital") throw new Error("Not found.");

  const sp = await isSeniorPastor(viewer);
  try {
    await assertClinicalCounselorForJourney(viewer, journey);
  } catch {
    if (!sp) throw new Error("Counselor access required.");
  }

  const a = journey.participantAId ? await getUserById(journey.participantAId) : null;
  const b = journey.participantBId ? await getUserById(journey.participantBId) : null;
  const partnerAName = a?.displayName?.trim() || "Partner A";
  const partnerBName = b?.displayName?.trim() || "Partner B";

  const records = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const meta = await store().getPremaritalProgramMeta(journeyId);
  const homework = await store().listSessionHomeworkForJourney(journeyId);
  const sessions = await listAllJourneySessions(journeyId);
  const sections: PastoralReportSection[] = [];

  if (kind === "progress" || kind === "completion") {
    sections.push({
      heading: "Eight-session curriculum progress",
      rows: PREMARITAL_PROGRAM_SESSIONS.map((def) => {
        const row = records.find((r) => r.sessionKey === def.sessionKey);
        return [`Session ${def.order}`, def.title, (row?.status ?? "not_started").replace(/_/g, " ")];
      }),
    });
    sections.push({
      heading: "Summary",
      rows: [
        ["Sessions completed (counselor-marked)", `${records.filter((r) => r.status === "completed").length} of 8`],
        ["Program paused", meta?.pausedAt ? "Yes" : "No"],
      ],
    });
  }

  if (kind === "attendance" || kind === "completion") {
    sections.push({
      heading: "Scheduled appointments",
      rows: sessions
        .filter((s) => s.status !== "cancelled")
        .map((appt) => {
          const label = appt.premaritalSessionKey
            ? PREMARITAL_PROGRAM_SESSIONS.find((p) => p.sessionKey === appt.premaritalSessionKey)?.title ??
              appt.topic ??
              "Counseling"
            : appt.topic ?? "Supplementary session";
          return [
            label,
            formatMarriageSessionScheduledAt(appt.scheduledAt, appt.schedulingTimeZone),
            (appt.status ?? "scheduled").replace(/_/g, " "),
          ];
        }),
    });
    const clinical = await store().listPremaritalSessionClinicalForJourney(journeyId);
    if (clinical.length) {
      sections.push({
        heading: "Curriculum session attendance",
        rows: clinical.map((c) => {
          const def = PREMARITAL_PROGRAM_SESSIONS.find((p) => p.sessionKey === c.sessionKey);
          return [
            def ? `Session ${def.order}` : c.sessionKey,
            attLabel(c.partnerAAttended),
            attLabel(c.partnerBAttended),
            c.outcome?.replace(/_/g, " ") ?? "—",
          ];
        }),
      });
    }
  }

  if (kind === "homework" || kind === "completion") {
    sections.push({
      heading: "Homework (submission counts only — no private answers)",
      rows: await Promise.all(
        homework.map(async (hw) => {
          const responses = await store().listSessionHomeworkResponses(hw.id);
          const submitted = responses.filter((r) => r.submittedAt).length;
          return [hw.title, hw.status.replace(/_/g, " "), `${submitted}/2 submitted`];
        }),
      ),
    });
  }

  if (kind === "supplementary" || kind === "completion") {
    const extra = sessions.filter((s) => !s.premaritalSessionKey && s.status !== "cancelled");
    const suppClinical = await store().listSupplementaryClinicalForJourney(journeyId);
    const clinicalByAppt = new Map(suppClinical.map((r) => [r.appointmentId, r]));
    sections.push({
      heading: "Supplementary counseling (not counted in 8-session denominator)",
      rows: extra.map((appt) => {
        const clin = clinicalByAppt.get(appt.id);
        return [
          appt.topic ?? "Additional session",
          formatMarriageSessionScheduledAt(appt.scheduledAt, appt.schedulingTimeZone),
          clin ? "Clinical record saved" : "No clinical record yet",
          clin?.outcome?.replace(/_/g, " ") ?? "—",
        ];
      }),
    });
  }

  if (kind === "outstanding" || kind === "completion") {
    const outstanding: string[][] = [];
    for (const def of PREMARITAL_PROGRAM_SESSIONS) {
      const row = records.find((r) => r.sessionKey === def.sessionKey);
      if (!row || row.status !== "completed") {
        outstanding.push([`Session ${def.order}`, def.title, "Not marked complete"]);
      }
    }
    for (const hw of homework.filter((h) => h.status === "released")) {
      const responses = await store().listSessionHomeworkResponses(hw.id);
      if (responses.filter((r) => r.submittedAt).length < 2) {
        outstanding.push(["Homework", hw.title, "Awaiting both submissions"]);
      }
    }
    sections.push({ heading: "Outstanding items", rows: outstanding.length ? outstanding : [["None recorded", "", ""]] });
  }

  if (kind === "completion") {
    const certs = await store().listFinalCertificatesForJourney(journeyId);
    const active = certs.find((c) => c.status === "active");
    const readiness = await store().getPremaritalReadinessReview(journeyId);
    sections.push({
      heading: "Completion & certificate",
      rows: [
        ["Final certificate", active ? active.certificateNumber : "Not issued"],
        ["Readiness review", readiness ? readiness.status.replace(/_/g, " ") : "Not recorded"],
        ["Note", "Readiness review is separate from certificate issuance"],
      ],
    });
  }

  return {
    kind,
    title: TITLES[kind],
    partnerAName,
    partnerBName,
    journeyId,
    generatedAt: new Date().toISOString(),
    confidentiality:
      "Pastoral use — excludes private assessment answers and counselor-only clinical observations.",
    sections,
  };
}

export async function buildPastoralReportText(
  viewer: PublicMember,
  journeyId: string,
  kind: MarriagePastoralReportKind,
) {
  const doc = await buildPastoralReportDocument(viewer, journeyId, kind);
  const lines = [
    `Shanah City Church — ${doc.title}`,
    `${doc.partnerAName} & ${doc.partnerBName}`,
    `Generated: ${formatMarriageSessionScheduledAt(doc.generatedAt, "America/Denver")}`,
    doc.confidentiality,
    "",
  ];
  for (const section of doc.sections) {
    lines.push(section.heading);
    for (const row of section.rows) {
      lines.push(`  ${row.join(" · ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
