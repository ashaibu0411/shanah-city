import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import type { ChoirSetlistServiceSummary } from "@/lib/choir-setlist-types";

export type ChoirRehearsalPagePayload = {
  services: ChoirSetlistServiceSummary[];
  canManage: boolean;
  groupChatHref: string;
  memberRoleLabel: string | null;
  memberPartRole: string | null;
  rehearsal: ChoirRehearsalView | null;
};
