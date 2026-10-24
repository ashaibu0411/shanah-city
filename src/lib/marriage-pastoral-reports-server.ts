export { buildPastoralReportDocument, buildPastoralReportText } from "@/lib/marriage-pastoral-report-data";

import type { PublicMember } from "@/lib/auth-types";
import type { MarriagePastoralReportKind } from "@/lib/marriage-certificate-types";
import { buildPastoralReportDocument } from "@/lib/marriage-pastoral-report-data";
import { renderPastoralReportPdf } from "@/lib/marriage-pastoral-report-pdf";

export async function buildPastoralReportPdf(
  viewer: PublicMember,
  journeyId: string,
  kind: MarriagePastoralReportKind,
) {
  const doc = await buildPastoralReportDocument(viewer, journeyId, kind);
  return renderPastoralReportPdf(doc);
}
