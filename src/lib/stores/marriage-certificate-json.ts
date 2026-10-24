import type {
  MarriagePremaritalFinalCertificateAuditRecord,
  MarriagePremaritalFinalCertificateRecord,
  MarriagePremaritalSupplementaryClinicalRecord,
  MarriagePrepCertificateSettingAuditRecord,
  MarriagePrepCertificateSettingRecord,
} from "@/lib/marriage-certificate-types";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE =
  process.env.MARRIAGE_CERTIFICATE_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "marriage-certificates.json");

type StoreFile = {
  finalCertificates: MarriagePremaritalFinalCertificateRecord[];
  finalCertificateAudit: MarriagePremaritalFinalCertificateAuditRecord[];
  certificateSetting: MarriagePrepCertificateSettingRecord | null;
  certificateSettingAudit: MarriagePrepCertificateSettingAuditRecord[];
  supplementaryClinical: MarriagePremaritalSupplementaryClinicalRecord[];
};

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    return {
      finalCertificates: [],
      finalCertificateAudit: [],
      certificateSetting: null,
      certificateSettingAudit: [],
      supplementaryClinical: [],
    };
  }
}

async function writeStore(store: StoreFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function getMarriagePrepCertificateSetting() {
  const store = await readStore();
  return store.certificateSetting;
}

export async function saveMarriagePrepCertificateSetting(record: MarriagePrepCertificateSettingRecord) {
  const store = await readStore();
  store.certificateSetting = record;
  await writeStore(store);
  return record;
}

export async function listFinalCertificatesForJourney(journeyId: string) {
  const store = await readStore();
  return store.finalCertificates
    .filter((c) => c.journeyId === journeyId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getFinalCertificateById(id: string) {
  const store = await readStore();
  return store.finalCertificates.find((c) => c.id === id) ?? null;
}

export async function saveFinalCertificate(record: MarriagePremaritalFinalCertificateRecord) {
  const store = await readStore();
  const index = store.finalCertificates.findIndex((c) => c.id === record.id);
  if (index === -1) store.finalCertificates.push(record);
  else store.finalCertificates[index] = record;
  await writeStore(store);
  return record;
}

export async function saveFinalCertificateAudit(record: MarriagePremaritalFinalCertificateAuditRecord) {
  const store = await readStore();
  store.finalCertificateAudit.push(record);
  await writeStore(store);
  return record;
}

export async function listFinalCertificateAuditForJourney(journeyId: string) {
  const store = await readStore();
  return store.finalCertificateAudit
    .filter((a) => a.journeyId === journeyId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSupplementaryClinicalForJourney(journeyId: string) {
  const store = await readStore();
  return store.supplementaryClinical.filter((r) => r.journeyId === journeyId);
}

export async function getSupplementaryClinical(appointmentId: string) {
  const store = await readStore();
  return store.supplementaryClinical.find((r) => r.appointmentId === appointmentId) ?? null;
}

export async function listCertificateSettingAudit() {
  const store = await readStore();
  return (store.certificateSettingAudit ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCertificateSettingAudit(record: MarriagePrepCertificateSettingAuditRecord) {
  const store = await readStore();
  if (!store.certificateSettingAudit) store.certificateSettingAudit = [];
  store.certificateSettingAudit.push(record);
  await writeStore(store);
  return record;
}

export async function saveSupplementaryClinical(record: MarriagePremaritalSupplementaryClinicalRecord) {
  const store = await readStore();
  const index = store.supplementaryClinical.findIndex((r) => r.appointmentId === record.appointmentId);
  if (index === -1) store.supplementaryClinical.push(record);
  else store.supplementaryClinical[index] = record;
  await writeStore(store);
  return record;
}
