import { useDatabase } from "@/lib/use-database";
import * as liveScheduleDb from "@/lib/stores/live-schedule-db";
import * as liveScheduleJson from "@/lib/stores/live-schedule-json";

import { recurringLiveSchedules } from "@/lib/recurring-live-service-utils";
import { resolvePublicLiveStreamDisplay, filterUpcomingLiveStreamSchedules, sortLiveStreamSchedules } from "@/lib/live-schedule-utils";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";

async function combinedSchedules():Promise<LiveStreamSchedule[]> {
 const manual=await store().getLiveStreamSchedules();
 const recurring=recurringLiveSchedules();
 // A manually scheduled service takes priority over an automatic service on the same Denver calendar date.
 const dateKey=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Denver",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));
 const overridden=new Set(manual.map(s=>dateKey(s.startsAt)));
 return sortLiveStreamSchedules([...manual,...recurring.filter(s=>!overridden.has(dateKey(s.startsAt)))]);
}
const store = () => (useDatabase() ? liveScheduleDb : liveScheduleJson);

export const getPublicLiveStreamSchedule = async () => resolvePublicLiveStreamDisplay(await combinedSchedules());
export const getUpcomingLiveStreamSchedule = async () => (await getUpcomingLiveStreamSchedules())[0] ?? null;
export const getUpcomingLiveStreamSchedules = async () => filterUpcomingLiveStreamSchedules(await combinedSchedules());
export const getLiveStreamSchedules = () => store().getLiveStreamSchedules();
export const getLiveStreamSchedule = () => store().getLiveStreamSchedule();
export const saveLiveStreamSchedule = (
  input: Parameters<typeof liveScheduleJson.saveLiveStreamSchedule>[0],
) => store().saveLiveStreamSchedule(input);
export const clearLiveStreamSchedule = (id?: string) => store().clearLiveStreamSchedule(id);
export const markLiveStreamNotifySent = (id: string) => store().markLiveStreamNotifySent(id);
