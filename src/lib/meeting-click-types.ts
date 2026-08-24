export type MeetingClickSource = "meetings_page" | "group_page" | "push" | "home";

export type MeetingClickLog = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  meetingId?: string;
  meetingTitle: string;
  groupId?: string;
  groupName?: string;
  campusId?: string;
  platform?: string;
  source: MeetingClickSource;
  joinUrl: string;
  clickedAt: string;
};

export type MeetingJoinTarget = {
  meetingId?: string;
  meetingTitle: string;
  groupId?: string;
  groupName?: string;
  campusId?: string;
  platform?: string;
  joinUrl: string;
};
