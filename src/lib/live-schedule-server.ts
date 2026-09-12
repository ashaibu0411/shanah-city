import { useDatabase } from "@/lib/use-database";
import * as liveScheduleDb from "@/lib/stores/live-schedule-db";
import * as liveScheduleJson from "@/lib/stores/live-schedule-json";

const store = () => (useDatabase() ? liveScheduleDb : liveScheduleJson);

export const getPublicLiveStreamSchedule = () => store().getPublicLiveStreamSchedule();
export const getUpcomingLiveStreamSchedule = () => store().getUpcomingLiveStreamSchedule();
export const getUpcomingLiveStreamSchedules = () => store().getUpcomingLiveStreamSchedules();
export const getLiveStreamSchedules = () => store().getLiveStreamSchedules();
export const getLiveStreamSchedule = () => store().getLiveStreamSchedule();
export const saveLiveStreamSchedule = (
  input: Parameters<typeof liveScheduleJson.saveLiveStreamSchedule>[0],
) => store().saveLiveStreamSchedule(input);
export const clearLiveStreamSchedule = (id?: string) => store().clearLiveStreamSchedule(id);
export const markLiveStreamNotifySent = (id: string) => store().markLiveStreamNotifySent(id);
