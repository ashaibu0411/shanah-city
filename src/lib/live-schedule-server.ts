import { useDatabase } from "@/lib/use-database";
import * as liveScheduleDb from "@/lib/stores/live-schedule-db";
import * as liveScheduleJson from "@/lib/stores/live-schedule-json";

const store = () => (useDatabase() ? liveScheduleDb : liveScheduleJson);

export const getUpcomingLiveStreamSchedule = () => store().getUpcomingLiveStreamSchedule();
export const getLiveStreamSchedule = () => store().getLiveStreamSchedule();
export const saveLiveStreamSchedule = (
  input: Parameters<typeof liveScheduleJson.saveLiveStreamSchedule>[0],
) => store().saveLiveStreamSchedule(input);
export const clearLiveStreamSchedule = () => store().clearLiveStreamSchedule();
export const markLiveStreamNotifySent = () => store().markLiveStreamNotifySent();
