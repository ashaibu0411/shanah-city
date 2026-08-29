import { useDatabase } from "@/lib/use-database";
import * as meetingDb from "@/lib/stores/meeting-db";
import * as meetingJson from "@/lib/stores/meeting-json";

const store = () => (useDatabase() ? meetingDb : meetingJson);

export const getMeetings = (options?: Parameters<typeof meetingJson.getMeetings>[0]) =>
  store().getMeetings(options);
export const createMeeting = (input: Parameters<typeof meetingJson.createMeeting>[0]) =>
  store().createMeeting(input);
export const updateMeeting = (
  id: string,
  update: Parameters<typeof meetingJson.updateMeeting>[1],
) => store().updateMeeting(id, update);
export const deleteMeeting = (id: string) => store().deleteMeeting(id);
export const getMeetingById = (id: string) => store().getMeetingById(id);
export const clearMeetingLastNotified = (id: string) => store().clearMeetingLastNotified(id);
