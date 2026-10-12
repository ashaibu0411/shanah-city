export type ChoirAssignmentView = {
  planKey: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
  dateTimeLabel: string;
  location: string;
  roleLabel: string | null;
  songCount: number;
  worshipHref: string;
  isPersonal: boolean;
};

export type ChoirRehearsalView = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  notes?: string;
  source: "worship-plan" | "service-schedule";
  calendarHref: string;
};

export type ChoirAnnouncementView = {
  id: string;
  title: string;
  authorName: string;
  excerpt: string;
  createdAt: string;
  detailHref: string;
  isSample?: boolean;
};

export type ChoirHomeDashboard = {
  assignment: ChoirAssignmentView | null;
  upcomingServicePreview: ChoirAssignmentView | null;
  rehearsal: ChoirRehearsalView | null;
  announcements: ChoirAnnouncementView[];
  preparationPlanKey: string | null;
  preparationChecked: string[];
  canManageSchedule: boolean;
  canManageWorship: boolean;
  rehearsalRoomHref: string | null;
};
