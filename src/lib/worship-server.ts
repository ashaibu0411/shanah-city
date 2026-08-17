import { useDatabase } from "@/lib/use-database";
import * as worshipDb from "@/lib/stores/worship-db";
import * as worshipJson from "@/lib/stores/worship-json";

const store = () => (useDatabase() ? worshipDb : worshipJson);

export const listWorshipPlans = (options?: Parameters<typeof worshipJson.listWorshipPlans>[0]) =>
  store().listWorshipPlans(options);
export const getWorshipPlan = (serviceDate: string, serviceTime: string) =>
  store().getWorshipPlan(serviceDate, serviceTime);
export const saveWorshipPlan = (input: Parameters<typeof worshipJson.saveWorshipPlan>[0]) =>
  store().saveWorshipPlan(input);
export const updateWorshipMemberStatus = (
  input: Parameters<typeof worshipJson.updateWorshipMemberStatus>[0],
) => store().updateWorshipMemberStatus(input);
export const deleteWorshipPlan = (serviceDate: string, serviceTime: string) =>
  store().deleteWorshipPlan(serviceDate, serviceTime);
