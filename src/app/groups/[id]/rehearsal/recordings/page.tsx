import { redirect } from "next/navigation";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChoirRehearsalRecordingsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const groupId = id === SHANAH_WORSHIP_GROUP_ID ? id : SHANAH_WORSHIP_GROUP_ID;
  const query = await searchParams;
  const filter = query.filter === "mine" ? "mine" : undefined;
  const suffix = filter ? `&filter=${filter}` : "";
  redirect(`/groups/${groupId}/rehearsal?tab=library${suffix}`);
}
