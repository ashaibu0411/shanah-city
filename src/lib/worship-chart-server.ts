import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { useBlobStorage } from "@/lib/use-blob";

const CHART_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedWorshipChart(file: File) {
  return CHART_TYPES.has(file.type) || file.name.toLowerCase().endsWith(".pdf");
}

export async function saveWorshipChartFile(file: File) {
  if (!isAllowedWorshipChart(file)) {
    throw new Error("Upload a PDF or image chart.");
  }

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const pathname = `worship/charts/${Date.now()}-${safeName}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type || undefined,
    });
    return { url: blob.url, fileName: file.name };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "worship");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
  const filePath = path.join(uploadsDir, safeName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
  return { url: `/uploads/worship/${safeName}`, fileName: file.name };
}
