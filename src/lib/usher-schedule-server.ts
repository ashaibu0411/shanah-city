import { useDatabase } from "@/lib/use-database";
import * as usherScheduleDb from "@/lib/stores/usher-schedule-db";
import * as usherScheduleJson from "@/lib/stores/usher-schedule-json";

const store = () => (useDatabase() ? usherScheduleDb : usherScheduleJson);

export const listUsherSchedules = (
  options?: Parameters<typeof usherScheduleJson.listUsherSchedules>[0],
) => store().listUsherSchedules(options);

export const getUsherSchedule = (serviceDate: string, serviceTime: string) =>
  store().getUsherSchedule(serviceDate, serviceTime);

export const findPreviousUsherSchedule = (serviceDate: string, serviceTime: string) =>
  store().findPreviousUsherSchedule(serviceDate, serviceTime);

export const saveUsherSchedule = (
  input: Parameters<typeof usherScheduleJson.saveUsherSchedule>[0],
) => store().saveUsherSchedule(input);

export const deleteUsherSchedule = (serviceDate: string, serviceTime: string) =>
  store().deleteUsherSchedule(serviceDate, serviceTime);
