import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChoirMySchedulePage } from "@/components/groups/choir/schedule/ChoirMySchedulePage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildChoirMySchedulePayload } from "@/lib/choir-availability-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";

export const dynamic = "force-dynamic";

type MySchedulePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupMySchedulePage({ params }: MySchedulePageProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/groups/${id}/my-schedule`)}`);
  }

  const group = await getGroupDetail(id, user.id);
  if (!group?.isMember) {
    redirect(`/groups/${id}`);
  }

  if (await isMemberTrainingRequired(user.id, group)) {
    redirect(`/groups/${id}?training=required`);
  }

  let initialData = null;
  let initialError: string | null = null;
  try {
    initialData = await buildChoirMySchedulePayload(user, id);
    if (!initialData) {
      initialError = "Access denied.";
    }
  } catch (error) {
    console.error("[groups/my-schedule]", error);
    initialError = error instanceof Error ? error.message : "Could not load your schedule.";
  }

  return (
    <div className="min-h-full bg-[#FAF7F1] px-4 pb-6 pt-2 dark:bg-[var(--color-bg)]">
      <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading your schedule…</div>}>
        <ChoirMySchedulePage groupId={id} initialData={initialData} initialError={initialError} />
      </Suspense>
    </div>
  );
}
