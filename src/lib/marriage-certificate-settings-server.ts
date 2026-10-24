import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { assertSeniorPastor, isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import type { MarriagePrepCertificateSettingAuditRecord } from "@/lib/marriage-certificate-types";
import {
  deletePrivateSignatureFile,
  readPrivateSignatureBytes,
  savePrivateSignaturePng,
} from "@/lib/marriage-certificate-private-assets";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

function certificateAdminIdsFromEnv(): Set<string> {
  const raw = process.env.MARRIAGE_CERTIFICATE_ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function canManageCertificateSettings(viewer: PublicMember) {
  if (await isSeniorPastor(viewer)) return true;
  if (certificateAdminIdsFromEnv().has(viewer.id)) return true;
  if (await canManageAsAdmin(viewer)) return true;
  return false;
}

export async function assertCertificateSettingsAdmin(viewer: PublicMember) {
  if (!(await canManageCertificateSettings(viewer))) {
    throw new Error("Certificate settings access required.");
  }
}

async function recordSettingAudit(record: MarriagePrepCertificateSettingAuditRecord) {
  await store().saveCertificateSettingAudit(record);
  await logMarriageAudit({
    actorUserId: record.actorUserId,
    action: "certificate_signature_setting_changed",
    meta: {
      settingAction: record.action,
      ...(record.note ? { note: record.note } : {}),
    },
  });
}

export async function getCertificateSettingsView(viewer: PublicMember) {
  await assertCertificateSettingsAdmin(viewer);
  const setting = await store().getMarriagePrepCertificateSetting();
  const audit = await store().listCertificateSettingAudit();
  return {
    hasSignature: Boolean(setting?.seniorPastorSignatureAssetPath),
    updatedAt: setting?.updatedAt ?? null,
    updatedByUserId: setting?.updatedByUserId ?? null,
    audit: audit.slice(0, 20),
  };
}

export async function uploadCertificateSignature(viewer: PublicMember, file: File) {
  await assertCertificateSettingsAdmin(viewer);
  if (file.type !== "image/png") throw new Error("Upload a PNG signature image (approved scan of authorized signature).");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_SIGNATURE_BYTES) throw new Error("Signature image is too large (max 2 MB).");

  const previous = await store().getMarriagePrepCertificateSetting();
  const pathRef = await savePrivateSignaturePng(bytes);
  const now = new Date().toISOString();
  await store().saveMarriagePrepCertificateSetting({
    id: "default",
    seniorPastorSignatureAssetPath: pathRef,
    updatedAt: now,
    updatedByUserId: viewer.id,
  });
  if (previous?.seniorPastorSignatureAssetPath) {
    await deletePrivateSignatureFile(previous.seniorPastorSignatureAssetPath);
  }
  await recordSettingAudit({
    id: randomUUID(),
    action: previous?.seniorPastorSignatureAssetPath ? "replace" : "upload",
    actorUserId: viewer.id,
    note: "Authorized signature image uploaded by settings administrator.",
    previousPath: previous?.seniorPastorSignatureAssetPath ?? null,
    newPath: pathRef,
    createdAt: now,
  });
  return getCertificateSettingsView(viewer);
}

export async function removeCertificateSignature(viewer: PublicMember, note?: string) {
  await assertCertificateSettingsAdmin(viewer);
  const previous = await store().getMarriagePrepCertificateSetting();
  if (!previous?.seniorPastorSignatureAssetPath) throw new Error("No signature configured.");
  const now = new Date().toISOString();
  await deletePrivateSignatureFile(previous.seniorPastorSignatureAssetPath);
  await store().saveMarriagePrepCertificateSetting({
    id: "default",
    seniorPastorSignatureAssetPath: null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  });
  await recordSettingAudit({
    id: randomUUID(),
    action: "remove",
    actorUserId: viewer.id,
    note: note?.trim() || "Signature removed; certificates will show printed name only.",
    previousPath: previous.seniorPastorSignatureAssetPath,
    newPath: null,
    createdAt: now,
  });
  return getCertificateSettingsView(viewer);
}

export async function readAuthorizedSignatureBytes(viewer: PublicMember) {
  await assertCertificateSettingsAdmin(viewer);
  const setting = await store().getMarriagePrepCertificateSetting();
  return readPrivateSignatureBytes(setting?.seniorPastorSignatureAssetPath);
}
