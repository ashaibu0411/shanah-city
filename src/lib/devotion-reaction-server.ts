import { useDatabase } from "@/lib/use-database";
import * as devotionReactionDb from "@/lib/stores/devotion-reaction-db";
import * as devotionReactionJson from "@/lib/stores/devotion-reaction-json";

const store = () => (useDatabase() ? devotionReactionDb : devotionReactionJson);

export const getDevotionReactions = (devotionId: string) =>
  store().getDevotionReactions(devotionId);

export const toggleDevotionReaction = (
  input: Parameters<typeof devotionReactionJson.toggleDevotionReaction>[0],
) => store().toggleDevotionReaction(input);

export const deleteDevotionReactionsForUser = (userId: string) =>
  store().deleteDevotionReactionsForUser(userId);
