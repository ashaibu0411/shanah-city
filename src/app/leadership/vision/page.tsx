import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getUserFromSession } from "@/lib/auth-server";
import { getVisionActor } from "@/lib/vision-center-access-server";
import { VisionCenterHub } from "@/components/vision/VisionCenterHub";

export const dynamic = "force-dynamic";

export default async function VisionCenterPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) redirect("/sign-in?next=/leadership/vision");
  const { isOwner } = await getVisionActor();
  return <VisionCenterHub owner={isOwner} />;
}
