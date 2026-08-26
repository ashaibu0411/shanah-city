import { useDatabase } from "@/lib/use-database";
import * as ministryReportDb from "@/lib/stores/ministry-report-db";
import * as ministryReportJson from "@/lib/stores/ministry-report-json";

const store = () => (useDatabase() ? ministryReportDb : ministryReportJson);

export const listMinistryReports = (
  options?: Parameters<typeof ministryReportJson.listMinistryReports>[0],
) => store().listMinistryReports(options);

export const getMinistryReport = (reportMonth: string, groupId: string) =>
  store().getMinistryReport(reportMonth, groupId);

export const saveMinistryReport = (
  input: Parameters<typeof ministryReportJson.saveMinistryReport>[0],
) => store().saveMinistryReport(input);

export const reviewMinistryReport = (
  input: Parameters<typeof ministryReportJson.reviewMinistryReport>[0],
) => store().reviewMinistryReport(input);

export const summarizeMinistryReports = (reportMonth: string) =>
  store().summarizeMinistryReports(reportMonth);
