export type LiveStreamPlatform = "all" | "youtube" | "facebook-city" | "facebook-revival";

export type LiveStreamSchedule = {
  id: string;
  title: string;
  startsAt: string;
  platform?: LiveStreamPlatform;
  notifyEnabled?: boolean;
  notifyBody?: string | null;
  notifySentAt?: string | null;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
};
