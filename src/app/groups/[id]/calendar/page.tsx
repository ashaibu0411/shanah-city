import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChoirWorshipCalendarPage } from "@/components/groups/choir/calendar/ChoirWorshipCalendarPage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildChoirCalendarPagePayload } from "@/lib/choir-calendar-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipCalendarPage({ params }: CalendarPageProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/groups/${id}/calendar`)}`);
  }

  const group = await getGroupDetail(id, user.id);
  if (!group?.isMember) {
    redirect(`/groups/${id}`);
  }

  if (await isMemberTrainingRequired(user.id, group)) {
    redirect(`/groups/${id}?training=required`);
  }

  let initialPayload = null;
  let initialError: string | null = null;
  try {
    initialPayload = await buildChoirCalendarPagePayload(user, id);
    if (!initialPayload) {
      initialError = "Access denied.";
    }
  } catch (error) {
    console.error("[groups/calendar]", error);
    initialError = error instanceof Error ? error.message : "Unable to load the worship calendar.";
  }

  return (
    <div className="min-h-full bg-[#FAF7F1] px-4 pb-6 pt-2 dark:bg-[var(--color-bg)]">
      <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading calendar…</div>}>
        <ChoirWorshipCalendarPage
          groupId={id}
          initialPayload={initialPayload}
          initialError={initialError}
        />
      </Suspense>
    </div>
  );
}
