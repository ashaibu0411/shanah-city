import { useDatabase } from "@/lib/use-database";
import { enrichPlanSongsFromLibrary } from "@/lib/worship-plan-library-sync-server";
import * as worshipDb from "@/lib/stores/worship-db";
import * as worshipJson from "@/lib/stores/worship-json";

const store = () => (useDatabase() ? worshipDb : worshipJson);

export const listWorshipPlans = (options?: Parameters<typeof worshipJson.listWorshipPlans>[0]) =>
  store().listWorshipPlans(options);
export const getWorshipPlan = async (serviceDate: string, serviceTime: string) => {
  const plan = await store().getWorshipPlan(serviceDate, serviceTime);
  if (!plan) return null;
  return { ...plan, songs: await enrichPlanSongsFromLibrary(plan.songs) };
};
export const saveWorshipPlan = async (input: Parameters<typeof worshipJson.saveWorshipPlan>[0]) => {
  const songs = await enrichPlanSongsFromLibrary(input.songs ?? []);
  return store().saveWorshipPlan({ ...input, songs });
};
export const updateWorshipMemberStatus = (
  input: Parameters<typeof worshipJson.updateWorshipMemberStatus>[0],
) => store().updateWorshipMemberStatus(input);
export const deleteWorshipPlan = (serviceDate: string, serviceTime: string) =>
  store().deleteWorshipPlan(serviceDate, serviceTime);
export const findPreviousWorshipPlan = (serviceDate: string, serviceTime: string) =>
  store().findPreviousWorshipPlan(serviceDate, serviceTime);
export const markRehearsalReminderSent = (serviceDate: string, serviceTime: string) =>
  store().markRehearsalReminderSent(serviceDate, serviceTime);
export const markUploadDutyReminderSent = (serviceDate: string, serviceTime: string) =>
  store().markUploadDutyReminderSent(serviceDate, serviceTime);
export const updateWorshipPlanContent = (
  serviceDate: string,
  serviceTime: string,
  updater: (plan: import("@/lib/worship-types").WorshipServicePlan) => import("@/lib/worship-types").WorshipServicePlan | null,
) => store().updateWorshipPlanContent(serviceDate, serviceTime, updater);
