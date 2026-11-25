import { redirect, notFound } from "next/navigation";
import { getVisionActor } from "@/lib/vision-center-access-server";
import { getUsers } from "@/lib/auth-server";
import { CommunicationsComposer } from "@/components/communications/CommunicationsComposer";
export const dynamic = "force-dynamic";
export default async function CommunicationsPage() {
  const { user, isOwner } = await getVisionActor();
  if (!user) redirect("/sign-in?next=/leadership/communications");
  if (!isOwner) notFound();
  const members = (await getUsers()).map(m => ({ id: m.id, name: m.displayName || m.name, role: m.role || "member" }));
  return <CommunicationsComposer members={members} />;
}
