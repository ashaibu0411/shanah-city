import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";

export const dynamic = "force-dynamic";

type AcademyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ChoirAcademyLayout({ children, params }: AcademyLayoutProps) {
  const { id } = await params;
  if (id !== SHANAH_WORSHIP_GROUP_ID) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/groups/${id}/academy`)}`);
  }

  const group = await getGroupDetail(id, user.id);
  if (!group?.isMember) {
    redirect(`/groups/${id}`);
  }

  if (await isMemberTrainingRequired(user.id, group)) {
    redirect(`/groups/${id}?training=required`);
  }

  return (
    <div className="min-h-full bg-[#FAF7F1] px-4 pb-6 pt-2 dark:bg-[var(--color-bg)]">{children}</div>
  );
}
