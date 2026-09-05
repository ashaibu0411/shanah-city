import { useDatabase } from "@/lib/use-database";
import * as commsDb from "@/lib/stores/comms-db";
import * as commsJson from "@/lib/stores/comms-json";

const store = () => (useDatabase() ? commsDb : commsJson);

export const listCommsRequests = () => store().listCommsRequests();
export const getCommsRequestById = (id: string) => store().getCommsRequestById(id);
export const saveCommsRequest = (
  input: Parameters<typeof commsJson.saveCommsRequest>[0],
) => store().saveCommsRequest(input);
export const listCommsCalendarItems = (weekStart?: string) =>
  store().listCommsCalendarItems(weekStart);
export const getCommsCalendarItemById = (id: string) => store().getCommsCalendarItemById(id);
export const saveCommsCalendarItem = (
  input: Parameters<typeof commsJson.saveCommsCalendarItem>[0],
) => store().saveCommsCalendarItem(input);
export const deleteCommsCalendarItem = (id: string) => store().deleteCommsCalendarItem(id);
