import { readFileSync, existsSync } from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PastoralReportDocument } from "@/lib/marriage-pastoral-report-data";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

const NAVY = rgb(0.08, 0.14, 0.28);
const GOLD = rgb(0.72, 0.58, 0.32);
const INK = rgb(0.15, 0.15, 0.18);
const MUTED = rgb(0.4, 0.4, 0.45);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;

export async function renderPastoralReportPdf(doc: PastoralReportDocument) {
  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  let pageIndex = 1;

  const logoPath = path.join(process.cwd(), "public", "shanah-city-logo.png");
  if (existsSync(logoPath)) {
    const png = await pdf.embedPng(readFileSync(logoPath));
    const dims = png.scale(0.08);
    page.drawImage(png, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height });
    y -= dims.height + 8;
  }

  function footer(p: typeof page, index: number, total: number) {
    p.drawText(`Shanah City Church — Confidential pastoral report`, {
      x: MARGIN,
      y: 28,
      size: 8,
      font: regular,
      color: MUTED,
    });
    p.drawText(`Page ${index} of ${total}`, {
      x: PAGE_W - MARGIN - 60,
      y: 28,
      size: 8,
      font: regular,
      color: MUTED,
    });
  }

  function newPageIf(need: number) {
    if (y - need < MARGIN + 40) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      pageIndex += 1;
    }
  }

  page.drawText("Shanah City Church", { x: MARGIN, y, size: 11, font: bold, color: NAVY });
  y -= 16;
  page.drawText(doc.title, { x: MARGIN, y, size: 16, font: bold, color: NAVY });
  y -= 22;
  page.drawText(`${doc.partnerAName}  &  ${doc.partnerBName}`, { x: MARGIN, y, size: 12, font: bold, color: INK });
  y -= 16;
  page.drawText(
    `Generated ${formatMarriageSessionScheduledAt(doc.generatedAt, "America/Denver")}`,
    { x: MARGIN, y, size: 9, font: regular, color: MUTED },
  );
  y -= 14;
  page.drawText(doc.confidentiality, {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
    maxWidth: PAGE_W - MARGIN * 2,
  });
  y -= 24;

  for (const section of doc.sections) {
    newPageIf(40);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: GOLD });
    y -= 14;
    page.drawText(section.heading, { x: MARGIN, y, size: 11, font: bold, color: NAVY });
    y -= 16;
    for (const row of section.rows) {
      newPageIf(14);
      const line = row.filter(Boolean).join("  |  ");
      page.drawText(line || "—", {
        x: MARGIN + 8,
        y,
        size: 9,
        font: regular,
        color: INK,
        maxWidth: PAGE_W - MARGIN * 2 - 8,
      });
      y -= 14;
    }
    y -= 8;
  }

  const total = pdf.getPageCount();
  for (let i = 0; i < total; i += 1) {
    footer(pdf.getPage(i), i + 1, total);
  }

  return pdf.save();
}
