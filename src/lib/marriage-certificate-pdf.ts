import { readFileSync, existsSync } from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

const NAVY = rgb(0.08, 0.14, 0.28);
const GOLD = rgb(0.72, 0.58, 0.32);
const IVORY = rgb(0.98, 0.96, 0.92);
const INK = rgb(0.12, 0.12, 0.14);

function formatCertDate(iso: string | null, timeZone?: string) {
  if (!iso) return "Date not recorded";
  return formatMarriageSessionScheduledAt(iso, timeZone ?? "America/Denver");
}

async function loadLogoBytes() {
  const logoPath = path.join(process.cwd(), "public", "shanah-city-logo.png");
  if (!existsSync(logoPath)) return null;
  return readFileSync(logoPath);
}

async function loadSignatureBytes(assetPath: string | null | undefined) {
  if (!assetPath?.trim()) return null;
  const resolved = assetPath.startsWith("/")
    ? path.join(process.cwd(), "public", assetPath.replace(/^\//, ""))
    : path.join(process.cwd(), assetPath);
  if (!existsSync(resolved)) return null;
  return readFileSync(resolved);
}

async function drawBorder(page: import("pdf-lib").PDFPage, width: number, height: number) {
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: GOLD,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: NAVY,
    borderWidth: 1,
  });
}

export async function renderSessionCompletionCertificatePdf(input: {
  partnerAName: string;
  partnerBName: string;
  sessionOrder: number;
  sessionTitle: string;
  completionDate: string | null;
  completionDateMissing: boolean;
  certificateReference: string;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: IVORY });
  await drawBorder(page, width, height);

  const logoBytes = await loadLogoBytes();
  if (logoBytes) {
    const png = await doc.embedPng(logoBytes);
    const dims = png.scale(0.12);
    page.drawImage(png, { x: width / 2 - dims.width / 2, y: height - 110, width: dims.width, height: dims.height });
  }

  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const body = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText("Shanah City Church", {
    x: width / 2 - 80,
    y: height - 140,
    size: 14,
    font: sans,
    color: NAVY,
  });
  page.drawText("Certificate of Session Completion", {
    x: width / 2 - 160,
    y: height - 190,
    size: 26,
    font: serif,
    color: NAVY,
  });

  const coupleLine = `${input.partnerAName}  &  ${input.partnerBName}`;
  page.drawText(coupleLine, {
    x: width / 2 - body.widthOfTextAtSize(coupleLine, 18) / 2,
    y: height - 250,
    size: 18,
    font: serif,
    color: INK,
  });

  const sessionLine = `Premarital Counseling — Session ${input.sessionOrder}: ${input.sessionTitle}`;
  page.drawText(sessionLine, {
    x: width / 2 - body.widthOfTextAtSize(sessionLine, 14) / 2,
    y: height - 290,
    size: 14,
    font: body,
    color: INK,
  });

  const dateLine = input.completionDateMissing
    ? "Completion date: not recorded in counseling records"
    : `Completed: ${formatCertDate(input.completionDate)}`;
  page.drawText(dateLine, {
    x: width / 2 - body.widthOfTextAtSize(dateLine, 12) / 2,
    y: height - 330,
    size: 12,
    font: body,
    color: INK,
  });

  page.drawText(`Reference: ${input.certificateReference}`, {
    x: 48,
    y: 48,
    size: 10,
    font: sans,
    color: NAVY,
  });

  return doc.save();
}

export async function renderFinalProgramCertificatePdf(input: {
  partnerAName: string;
  partnerBName: string;
  programTitle: string;
  completionDate: string | null;
  completionDateMissing: boolean;
  certificateNumber: string;
  issuedAt: string;
  seniorPastorName: string;
  seniorPastorTitle: string;
  signatureAssetPath: string | null;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: IVORY });
  await drawBorder(page, width, height);

  const logoBytes = await loadLogoBytes();
  if (logoBytes) {
    const png = await doc.embedPng(logoBytes);
    const dims = png.scale(0.14);
    page.drawImage(png, { x: width / 2 - dims.width / 2, y: height - 120, width: dims.width, height: dims.height });
  }

  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const body = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText("Shanah City Church", {
    x: width / 2 - 80,
    y: height - 150,
    size: 14,
    font: sans,
    color: NAVY,
  });
  page.drawText("Marriage Preparation Program", {
    x: width / 2 - 170,
    y: height - 195,
    size: 22,
    font: serif,
    color: NAVY,
  });
  page.drawText("Certificate of Completion", {
    x: width / 2 - 130,
    y: height - 225,
    size: 20,
    font: serif,
    color: GOLD,
  });

  const coupleLine = `${input.partnerAName}  &  ${input.partnerBName}`;
  page.drawText(coupleLine, {
    x: width / 2 - body.widthOfTextAtSize(coupleLine, 20) / 2,
    y: height - 280,
    size: 20,
    font: serif,
    color: INK,
  });

  page.drawText(
    "This certifies completion of Shanah City Church's premarital counseling program.",
    { x: 72, y: height - 330, size: 11, font: body, color: INK },
  );
  page.drawText("It is not a civil marriage license and does not guarantee marital compatibility.", {
    x: 72,
    y: height - 346,
    size: 11,
    font: body,
    color: INK,
  });

  const completionLine = input.completionDateMissing
    ? "Program completion date: not recorded"
    : `Program completed: ${formatCertDate(input.completionDate)}`;
  page.drawText(completionLine, { x: 72, y: height - 380, size: 11, font: body, color: INK });
  page.drawText(`Issued: ${formatCertDate(input.issuedAt)}`, { x: 72, y: height - 400, size: 11, font: body, color: INK });
  page.drawText(`Certificate No. ${input.certificateNumber}`, {
    x: 72,
    y: 72,
    size: 10,
    font: sans,
    color: NAVY,
  });

  const sigLine = `${input.seniorPastorName}, ${input.seniorPastorTitle}`;
  page.drawText(sigLine, { x: width - 72 - body.widthOfTextAtSize(sigLine, 12), y: 120, size: 12, font: serif, color: INK });

  const sigBytes = await loadSignatureBytes(input.signatureAssetPath);
  if (sigBytes) {
    try {
      const sig = await doc.embedPng(sigBytes);
      const dims = sig.scale(0.25);
      page.drawImage(sig, {
        x: width - 72 - dims.width,
        y: 130,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      /* non-png signature skipped */
    }
  }

  return doc.save();
}
