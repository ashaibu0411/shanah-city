import { useDatabase } from "@/lib/use-database";
import * as eventDb from "@/lib/stores/event-db";
import * as eventJson from "@/lib/stores/event-json";

const store = () => (useDatabase() ? eventDb : eventJson);

export const getEvents = (options?: Parameters<typeof eventJson.getEvents>[0]) =>
  store().getEvents(options);
export const createEvent = (input: Parameters<typeof eventJson.createEvent>[0]) =>
  store().createEvent(input);
export const updateEvent = (
  id: string,
  update: Parameters<typeof eventJson.updateEvent>[1],
) => store().updateEvent(id, update);
export const deleteEvent = (id: string) => store().deleteEvent(id);
