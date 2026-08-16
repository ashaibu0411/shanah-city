import { useDatabase } from "@/lib/use-database";
import * as financeDb from "@/lib/stores/finance-db";
import * as financeJson from "@/lib/stores/finance-json";

const store = () => (useDatabase() ? financeDb : financeJson);

export const listFinanceSheets = (options?: Parameters<typeof financeJson.listFinanceSheets>[0]) =>
  store().listFinanceSheets(options);
export const getFinanceSheetByWeek = (weekEnding: string) =>
  store().getFinanceSheetByWeek(weekEnding);
export const saveFinanceSheet = (input: Parameters<typeof financeJson.saveFinanceSheet>[0]) =>
  store().saveFinanceSheet(input);
export const reopenFinanceSheet = (weekEnding: string) => store().reopenFinanceSheet(weekEnding);
export const deleteFinanceSheet = (weekEnding: string) => store().deleteFinanceSheet(weekEnding);
