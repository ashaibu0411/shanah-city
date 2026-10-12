import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChoirAnnouncementsPage } from "@/components/groups/choir/announcements/ChoirAnnouncementsPage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export const dynamic = "force-dynamic";

type AnnouncementsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupAnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/groups/${id}/announcements`)}`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F1] px-4 pb-6 pt-2 dark:bg-[var(--color-bg)]">
      <ChoirAnnouncementsPage groupId={id} />
    </div>
  );
}
