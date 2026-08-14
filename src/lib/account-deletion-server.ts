import { useDatabase } from "@/lib/use-database";
import * as accountDeletionDb from "@/lib/stores/account-deletion-db";
import * as accountDeletionJson from "@/lib/stores/account-deletion-json";

const store = () => (useDatabase() ? accountDeletionDb : accountDeletionJson);

export async function deleteUserAccount(userId: string) {
  await store().deleteUserAccountData(userId);
}
