import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { WorshipChoirServicePanel } from "@/components/worship/WorshipChoirServicePanel";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
  canViewWorshipServicePlan,
} from "@/lib/worship-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getWorshipPlan } from "@/lib/worship-server";
import { serviceDateTimeLabel } from "@/lib/worship-types";

export const metadata: Metadata = {
  title: "Service setlist",
};

export default async function WorshipMemberServicePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; song?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    const next = `/worship/service?${new URLSearchParams({
      ...(params.date ? { date: params.date } : {}),
      ...(params.time ? { time: params.time } : {}),
      ...(params.song ? { song: params.song } : {}),
    }).toString()}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  if (!(await canAccessWorshipPlanner(user))) {
    redirect("/groups");
  }

  const serviceDate = params.date?.trim();
  const serviceTime = params.time?.trim() ?? "10:00";
  const initialSongId = params.song?.trim();

  if (!serviceDate) {
    redirect("/worship");
  }

  const plan = await getWorshipPlan(serviceDate, serviceTime);
  const canManage = await canManageWorshipPlan(user);

  if (plan && !canViewWorshipServicePlan(canManage, plan)) {
    redirect("/worship");
  }

  const title = plan?.title?.trim() || serviceDateTimeLabel(serviceDate, serviceTime);

  return (
    <>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night-500 dark:text-sand-400">
          Shanah Worship
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-night-900 dark:text-sand-100">
          Service setlist
        </h1>
        <p className="mt-2 text-sm text-night-600 dark:text-sand-300">
          Listen, lyrics, and what you need for {title} — tap a song to expand.
        </p>
      </header>
      <MarkFeedRead feed="worship" />
      <WorshipChoirServicePanel
        initialDate={serviceDate}
        initialTime={serviceTime}
        initialSongId={initialSongId}
        serverPlan={plan}
        canManage={canManage}
      />
    </>
  );
}
