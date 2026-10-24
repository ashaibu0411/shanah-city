import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveSessionCompletionDate,
  sessionCertificateReference,
} from "../src/lib/marriage-certificate-eligibility.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const server = readFileSync(join(root, "src/lib/marriage-certificate-server.ts"), "utf8");
assert.match(server, /assertSeniorPastor/, "final issue requires Senior Pastor");
assert.doesNotMatch(server, /savePremaritalReadinessReview[\s\S]*issueFinalCertificate/, "readiness save does not auto-issue");
assert.doesNotMatch(server, /ready_to_proceed[\s\S]*issueFinalCertificate/, "readiness status does not auto-issue");

const pdf = readFileSync(join(root, "src/lib/marriage-certificate-pdf.ts"), "utf8");
assert.match(pdf, /not a civil marriage license/, "final certificate disclaimer");
assert.match(pdf, /Certificate of Session Completion/, "session certificate title");

const hub = readFileSync(join(root, "src/lib/marriage-counseling-server.ts"), "utf8");
assert.match(hub, /buildCoupleCertificatesGallery/, "hub exposes certificate gallery");

const sessionApi = readFileSync(
  join(root, "src/app/api/marriage/certificates/session/[sessionKey]/route.ts"),
  "utf8",
);
assert.match(sessionApi, /getUserFromSession/, "session PDF requires auth");
assert.match(sessionApi, /application\/pdf/, "returns PDF not public static file");

const adminApi = readFileSync(join(root, "src/app/api/marriage/admin/final-certificates/route.ts"), "utf8");
assert.match(adminApi, /issueFinalCertificate/, "SP issue endpoint");

const ops = readFileSync(join(root, "src/lib/marriage-premarital-operations-server.ts"), "utf8");
assert.match(ops, /scheduleSupplementaryAppointment/, "supplementary scheduling");
assert.match(ops, /premaritalSessionKey: undefined/, "supplementary distinct from curriculum keys");

const timeline = readFileSync(join(root, "src/lib/marriage-pastoral-timeline-server.ts"), "utf8");
assert.match(timeline, /listPremaritalSessionClinicalForJourney/, "timeline uses clinical records");
assert.doesNotMatch(timeline, /answersJson/, "timeline avoids private answers");

const resolved = resolveSessionCompletionDate({
  programRow: {
    journeyId: "j",
    sessionKey: "s1",
    status: "completed",
    privateNotes: null,
    checklistCompleted: {},
    completedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    updatedByUserId: "u",
  },
  clinicalSessionDate: null,
});
assert.equal(resolved.missing, true, "missing date when only status completed without timestamp");

assert.match(sessionCertificateReference("abc-def", "session-1"), /^SC-/);

const settings = readFileSync(join(root, "src/lib/marriage-certificate-settings-server.ts"), "utf8");
assert.match(settings, /assertCertificateSettingsAdmin/, "signature settings restricted");
assert.match(settings, /savePrivateSignaturePng/, "private signature storage");

const reportPdf = readFileSync(join(root, "src/lib/marriage-pastoral-report-pdf.ts"), "utf8");
assert.match(reportPdf, /Page \$\{index\} of \$\{total\}/, "report PDF page numbers");

const suppUi = readFileSync(join(root, "src/components/marriage/MarriageSupplementaryClinicalForms.tsx"), "utf8");
assert.match(suppUi, /save_supplementary_clinical/, "supplementary clinical form wired");

const replaceUi = readFileSync(join(root, "src/components/marriage/MarriageSeniorPastorFinalCertificatePanel.tsx"), "utf8");
assert.match(replaceUi, /action: "replace"/, "certificate replace UI");

console.log("marriage-certificates-phase5.test.ts: OK");
