import { prisma } from "@/lib/db";
import type {
  MarriageFinalCertificateStatus,
  MarriagePremaritalFinalCertificateAuditRecord,
  MarriagePremaritalFinalCertificateRecord,
  MarriagePremaritalSupplementaryClinicalRecord,
  MarriagePrepCertificateSettingRecord,
} from "@/lib/marriage-certificate-types";

function mapFinal(row: {
  id: string;
  journeyId: string;
  certificateNumber: string;
  status: string;
  completionDate: Date | null;
  issuedAt: Date;
  issuedByUserId: string;
  partnerADisplayName: string;
  partnerBDisplayName: string;
  seniorPastorName: string;
  seniorPastorTitle: string;
  revokedAt: Date | null;
  revokeReason: string | null;
  supersededById: string | null;
  createdAt: Date;
}): MarriagePremaritalFinalCertificateRecord {
  return {
    id: row.id,
    journeyId: row.journeyId,
    certificateNumber: row.certificateNumber,
    status: row.status as MarriageFinalCertificateStatus,
    completionDate: row.completionDate?.toISOString() ?? null,
    issuedAt: row.issuedAt.toISOString(),
    issuedByUserId: row.issuedByUserId,
    partnerADisplayName: row.partnerADisplayName,
    partnerBDisplayName: row.partnerBDisplayName,
    seniorPastorName: row.seniorPastorName,
    seniorPastorTitle: row.seniorPastorTitle,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokeReason: row.revokeReason,
    supersededById: row.supersededById,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getMarriagePrepCertificateSetting() {
  const row = await prisma.marriagePrepCertificateSetting.findUnique({ where: { id: "default" } });
  if (!row) return null;
  return {
    id: "default" as const,
    seniorPastorSignatureAssetPath: row.seniorPastorSignatureAssetPath,
    updatedAt: row.updatedAt.toISOString(),
    updatedByUserId: row.updatedByUserId,
  } satisfies MarriagePrepCertificateSettingRecord;
}

export async function saveMarriagePrepCertificateSetting(record: MarriagePrepCertificateSettingRecord) {
  await prisma.marriagePrepCertificateSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      seniorPastorSignatureAssetPath: record.seniorPastorSignatureAssetPath,
      updatedAt: new Date(record.updatedAt),
      updatedByUserId: record.updatedByUserId,
    },
    update: {
      seniorPastorSignatureAssetPath: record.seniorPastorSignatureAssetPath,
      updatedAt: new Date(record.updatedAt),
      updatedByUserId: record.updatedByUserId,
    },
  });
  return record;
}

export async function listFinalCertificatesForJourney(journeyId: string) {
  const rows = await prisma.marriagePremaritalFinalCertificate.findMany({
    where: { journeyId },
    orderBy: { issuedAt: "desc" },
  });
  return rows.map(mapFinal);
}

export async function getFinalCertificateById(id: string) {
  const row = await prisma.marriagePremaritalFinalCertificate.findUnique({ where: { id } });
  return row ? mapFinal(row) : null;
}

export async function saveFinalCertificate(record: MarriagePremaritalFinalCertificateRecord) {
  await prisma.marriagePremaritalFinalCertificate.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      journeyId: record.journeyId,
      certificateNumber: record.certificateNumber,
      status: record.status,
      completionDate: record.completionDate ? new Date(record.completionDate) : null,
      issuedAt: new Date(record.issuedAt),
      issuedByUserId: record.issuedByUserId,
      partnerADisplayName: record.partnerADisplayName,
      partnerBDisplayName: record.partnerBDisplayName,
      seniorPastorName: record.seniorPastorName,
      seniorPastorTitle: record.seniorPastorTitle,
      revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
      revokeReason: record.revokeReason,
      supersededById: record.supersededById,
      createdAt: new Date(record.createdAt),
    },
    update: {
      status: record.status,
      completionDate: record.completionDate ? new Date(record.completionDate) : null,
      revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
      revokeReason: record.revokeReason,
      supersededById: record.supersededById,
    },
  });
  return record;
}

export async function saveFinalCertificateAudit(record: MarriagePremaritalFinalCertificateAuditRecord) {
  await prisma.marriagePremaritalFinalCertificateAudit.create({
    data: {
      id: record.id,
      certificateId: record.certificateId,
      journeyId: record.journeyId,
      action: record.action,
      actorUserId: record.actorUserId,
      note: record.note,
      metaJson: record.metaJson,
      createdAt: new Date(record.createdAt),
    },
  });
  return record;
}

export async function listFinalCertificateAuditForJourney(journeyId: string) {
  const rows = await prisma.marriagePremaritalFinalCertificateAudit.findMany({
    where: { journeyId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(
    (r) =>
      ({
        id: r.id,
        certificateId: r.certificateId,
        journeyId: r.journeyId,
        action: r.action as MarriagePremaritalFinalCertificateAuditRecord["action"],
        actorUserId: r.actorUserId,
        note: r.note,
        metaJson: r.metaJson,
        createdAt: r.createdAt.toISOString(),
      }) satisfies MarriagePremaritalFinalCertificateAuditRecord,
  );
}

export async function listSupplementaryClinicalForJourney(journeyId: string) {
  const rows = await prisma.marriagePremaritalSupplementaryClinical.findMany({ where: { journeyId } });
  return rows.map(
    (r) =>
      ({
        appointmentId: r.appointmentId,
        journeyId: r.journeyId,
        sessionDate: r.sessionDate?.toISOString() ?? null,
        partnerAAttended: r.partnerAAttended,
        partnerBAttended: r.partnerBAttended,
        topicsCovered: r.topicsCovered,
        followUpActions: r.followUpActions,
        privateObservations: r.privateObservations,
        updatedAt: r.updatedAt.toISOString(),
        updatedByUserId: r.updatedByUserId,
      }) satisfies MarriagePremaritalSupplementaryClinicalRecord,
  );
}

export async function getSupplementaryClinical(appointmentId: string) {
  const r = await prisma.marriagePremaritalSupplementaryClinical.findUnique({ where: { appointmentId } });
  if (!r) return null;
  return {
    appointmentId: r.appointmentId,
    journeyId: r.journeyId,
    sessionDate: r.sessionDate?.toISOString() ?? null,
    partnerAAttended: r.partnerAAttended,
    partnerBAttended: r.partnerBAttended,
    topicsCovered: r.topicsCovered,
    followUpActions: r.followUpActions,
    privateObservations: r.privateObservations,
    updatedAt: r.updatedAt.toISOString(),
    updatedByUserId: r.updatedByUserId,
  } satisfies MarriagePremaritalSupplementaryClinicalRecord;
}

export async function saveSupplementaryClinical(record: MarriagePremaritalSupplementaryClinicalRecord) {
  await prisma.marriagePremaritalSupplementaryClinical.upsert({
    where: { appointmentId: record.appointmentId },
    create: {
      appointmentId: record.appointmentId,
      journeyId: record.journeyId,
      sessionDate: record.sessionDate ? new Date(record.sessionDate) : null,
      partnerAAttended: record.partnerAAttended,
      partnerBAttended: record.partnerBAttended,
      topicsCovered: record.topicsCovered,
      followUpActions: record.followUpActions,
      privateObservations: record.privateObservations,
      updatedAt: new Date(record.updatedAt),
      updatedByUserId: record.updatedByUserId,
    },
    update: {
      sessionDate: record.sessionDate ? new Date(record.sessionDate) : null,
      partnerAAttended: record.partnerAAttended,
      partnerBAttended: record.partnerBAttended,
      topicsCovered: record.topicsCovered,
      followUpActions: record.followUpActions,
      privateObservations: record.privateObservations,
      updatedAt: new Date(record.updatedAt),
      updatedByUserId: record.updatedByUserId,
    },
  });
  return record;
}
