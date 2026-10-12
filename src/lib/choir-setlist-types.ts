import type { WorshipServiceTime } from "@/lib/worship-types";

export type ChoirSetlistServiceSummary = {
  planKey: string;
  serviceDate: string;
  serviceTime: WorshipServiceTime | string;
  title: string;
  dateTimeLabel: string;
  songCount: number;
  status: "draft" | "published";
};

export type ChoirSetlistPagePayload = {
  services: ChoirSetlistServiceSummary[];
  favoriteSongIds: string[];
  canManage: boolean;
  groupChatHref: string;
};
