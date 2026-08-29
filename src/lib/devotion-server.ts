import { unstable_noStore as noStore } from "next/cache";
import { useDatabase } from "@/lib/use-database";
import * as devotionDb from "@/lib/stores/devotion-db";
import * as devotionJson from "@/lib/stores/devotion-json";

const store = () => (useDatabase() ? devotionDb : devotionJson);

export const getDevotions = (options?: Parameters<typeof devotionJson.getDevotions>[0]) =>
  store().getDevotions(options);
export const getTodayDevotion = () => {
  noStore();
  return store().getTodayDevotion();
};
export const getDevotionById = (id: string) => store().getDevotionById(id);
export const createDevotion = (
  input: Parameters<typeof devotionJson.createDevotion>[0],
  author: Parameters<typeof devotionJson.createDevotion>[1],
) => store().createDevotion(input, author);
export const updateDevotion = (
  id: string,
  update: Parameters<typeof devotionJson.updateDevotion>[1],
) => store().updateDevotion(id, update);
export const deleteDevotion = (id: string) => store().deleteDevotion(id);
export const getDevotionsDueForNotification = (now?: Date) =>
  store().getDevotionsDueForNotification(now);
export const markDevotionNotified = (id: string) => store().markDevotionNotified(id);
export const clearDevotionNotified = (id: string) => store().clearDevotionNotified(id);
