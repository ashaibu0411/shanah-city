import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GroupDetailView } from "@/components/groups/GroupDetailView";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroupDetail } from "@/lib/group-server";

export const dynamic = "force-dynamic";

type GroupDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chat?: string; report?: string; calendar?: string }>;
};

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const { id } = await params;
  const { chat, report, calendar } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const group = await getGroupDetail(id, user?.id);

  if (!group) {
    notFound();
  }

  return (
    <GroupDetailView
      initialGroup={group}
      initialSection={
        chat === "1" ? "chat" : report === "1" ? "report" : calendar === "1" ? "calendar" : "overview"
      }
    />
  );
}
