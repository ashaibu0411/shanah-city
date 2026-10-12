import { Suspense } from "react";
import { cookies } from "next/headers";
import { ChoirAvailabilityCenterPage } from "@/components/groups/choir/availability/ChoirAvailabilityCenterPage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  buildChoirAvailabilityHomePayload,
  buildChoirMySchedulePayload,
} from "@/lib/choir-availability-server";

export const dynamic = "force-dynamic";

type AvailabilityPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function GroupAvailabilityPage({ params, searchParams }: AvailabilityPageProps) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const isMyScheduleTab = tabParam === "my-schedule" || tabParam === "schedule";

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  let initialHomePayload = null;
  let initialHomeError: string | null = null;
  let initialMySchedule = null;
  let initialMyScheduleError: string | null = null;

  if (user) {
    try {
      if (isMyScheduleTab) {
        initialMySchedule = await buildChoirMySchedulePayload(user, id);
        if (!initialMySchedule) {
          initialMyScheduleError = "Access denied.";
        }
      } else {
        initialHomePayload = await buildChoirAvailabilityHomePayload(user, id);
        if (!initialHomePayload) {
          initialHomeError = "Access denied.";
        }
      }
    } catch (error) {
      console.error("[groups/availability]", error);
      const message = error instanceof Error ? error.message : "Unable to load your availability.";
      if (isMyScheduleTab) {
        initialMyScheduleError = message;
      } else {
        initialHomeError = message;
      }
    }
  }

  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading availability center…</div>}>
      <ChoirAvailabilityCenterPage
        groupId={id}
        initialHomePayload={initialHomePayload}
        initialHomeError={initialHomeError}
        initialMySchedule={initialMySchedule}
        initialMyScheduleError={initialMyScheduleError}
      />
    </Suspense>
  );
}
