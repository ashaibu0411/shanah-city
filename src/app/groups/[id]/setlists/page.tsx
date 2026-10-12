import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChoirSetlistPage } from "@/components/groups/choir/setlist/ChoirSetlistPage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export const dynamic = "force-dynamic";

type SetlistsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupSetlistsPage({ params }: SetlistsPageProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/groups/${id}/setlists`)}`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F1] px-4 pb-6 pt-2 dark:bg-[var(--color-bg)]">
      <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading setlists…</div>}>
        <ChoirSetlistPage groupId={id} />
      </Suspense>
    </div>
  );
}
