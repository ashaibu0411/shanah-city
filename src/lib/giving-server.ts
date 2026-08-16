import { useDatabase } from "@/lib/use-database";
import * as givingDb from "@/lib/stores/giving-db";
import * as givingJson from "@/lib/stores/giving-json";

const store = () => (useDatabase() ? givingDb : givingJson);

export const listGivingRecords = (options?: Parameters<typeof givingJson.listGivingRecords>[0]) =>
  store().listGivingRecords(options);
export const createGivingRecord = (input: Parameters<typeof givingJson.createGivingRecord>[0]) =>
  store().createGivingRecord(input);
export const updateGivingRecord = (
  id: string,
  update: Parameters<typeof givingJson.updateGivingRecord>[1],
) => store().updateGivingRecord(id, update);
export const deleteGivingRecord = (id: string) => store().deleteGivingRecord(id);
export const getGivingRecordByStripeSessionId = (stripeSessionId: string) =>
  store().getGivingRecordByStripeSessionId(stripeSessionId);
export const getGivingRecordByStripeInvoiceId = (stripeInvoiceId: string) =>
  store().getGivingRecordByStripeInvoiceId(stripeInvoiceId);
