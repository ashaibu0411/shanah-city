import { notFound, redirect } from "next/navigation";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export const dynamic = "force-dynamic";

type RehearsalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; time?: string; song?: string }>;
};

/** Bridge until Rehearsal Room (Page 3) ships — opens the existing service practice view. */
export default async function GroupRehearsalPage({ params, searchParams }: RehearsalPageProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const { date, time, song } = await searchParams;
  if (!date?.trim() || !time?.trim()) {
    redirect(`/groups/${id}/setlists`);
  }

  const query = new URLSearchParams({ date: date.trim(), time: time.trim() });
  if (song?.trim()) {
    query.set("song", song.trim());
  }
  redirect(`/worship/service?${query.toString()}`);
}
