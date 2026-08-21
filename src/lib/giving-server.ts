import { useDatabase } from "@/lib/use-database";
import * as givingDb from "@/lib/stores/giving-db";
import * as givingJson from "@/lib/stores/giving-json";

const store = () => (useDatabase() ? givingDb : givingJson);

export const listGivingRecords = (options?: Parameters<typeof givingJson.listGivingRecords>[0]) =>
  store().listGivingRecords(options);
export const linkGivingRecordsToUser = (
  email: string,
  userId: string,
) => store().linkGivingRecordsToUser(email, userId);

export async function getDonorYearToDateTotal(record: {
  userId?: string | null;
  donorEmail?: string | null;
  givenOn: string;
}) {
  const year = record.givenOn.slice(0, 4);
  const since = `${year}-01-01`;
  const until = `${year}-12-31`;

  const records = record.userId
    ? await listGivingRecords({ userId: record.userId, since, until })
    : record.donorEmail
      ? await listGivingRecords({ donorEmail: record.donorEmail, since, until })
      : [];

  return records.reduce((sum, entry) => sum + entry.amount, 0);
}
export const createGivingRecord = (input: Parameters<typeof givingJson.createGivingRecord>[0]) =>
  store().createGivingRecord(input);
export const updateGivingRecord = (
  id: string,
  update: Parameters<typeof givingJson.updateGivingRecord>[1],
) => store().updateGivingRecord(id, update);
export const deleteGivingRecord = (id: string) => store().deleteGivingRecord(id);
export const getGivingRecordById = (id: string) => store().getGivingRecordById(id);
export const markThankYouSent = (id: string) => store().markThankYouSent(id);
export const getGivingRecordByStripeSessionId = (stripeSessionId: string) =>
  store().getGivingRecordByStripeSessionId(stripeSessionId);
export const getGivingRecordByStripeInvoiceId = (stripeInvoiceId: string) =>
  store().getGivingRecordByStripeInvoiceId(stripeInvoiceId);
