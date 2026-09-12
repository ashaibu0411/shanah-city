import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GroupDetailView } from "@/components/groups/GroupDetailView";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroupDetail } from "@/lib/group-server";
import { enrichGroupDetailWithReadiness } from "@/lib/ministry-readiness-server";

export const dynamic = "force-dynamic";

type GroupDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    chat?: string;
    report?: string;
    calendar?: string;
    resources?: string;
    prayer?: string;
    mentors?: string;
    growth?: string;
    info?: string;
    manage?: string;
    guests?: string;
    rosterDate?: string;
    rosterTime?: string;
  }>;
};

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const { id } = await params;
  const {
    chat,
    report,
    calendar,
    resources,
    prayer,
    mentors,
    growth,
    info,
    manage,
    guests,
    rosterDate,
    rosterTime,
  } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const group = await enrichGroupDetailWithReadiness(await getGroupDetail(id, user?.id), user?.id);

  if (!group) {
    notFound();
  }

  return (
    <GroupDetailView
      initialGroup={group}
      rosterDate={rosterDate?.trim()}
      rosterTime={rosterTime?.trim()}
      initialSection={
        chat === "1"
          ? "chat"
          : guests === "1"
            ? "guests"
            : report === "1"
              ? "report"
              : calendar === "1"
                ? "calendar"
                : resources === "1"
                  ? "resources"
                  : prayer === "1"
                    ? "prayer"
                    : mentors === "1"
                      ? "mentors"
                      : growth === "1"
                        ? "growth"
                        : info === "1"
                          ? "info"
                          : manage === "1" || rosterDate?.trim() || rosterTime?.trim()
                            ? "manage"
                            : "overview"
      }
    />
  );
}
