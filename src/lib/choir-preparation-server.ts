import { useDatabase } from "@/lib/use-database";
import * as choirPreparationDb from "@/lib/stores/choir-preparation-db";
import * as choirPreparationJson from "@/lib/stores/choir-preparation-json";

const store = () => (useDatabase() ? choirPreparationDb : choirPreparationJson);

export const getChoirPreparation = (userId: string, planKey: string) =>
  store().getChoirPreparation(userId, planKey);

export const setChoirPreparationChecked = (
  userId: string,
  planKey: string,
  itemId: string,
  checked: boolean,
) => store().setChoirPreparationChecked(userId, planKey, itemId, checked);
