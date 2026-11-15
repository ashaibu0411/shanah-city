import { redirect } from "next/navigation";
import { getVisionActor } from "@/lib/vision-center-access-server";
import { VisionCenterHub } from "@/components/vision/VisionCenterHub";

export const dynamic = "force-dynamic";

export default async function VisionCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  // Preserve links sent before dedicated pages existed, including existing push notifications.
  const { plan } = await searchParams;
  if (plan) redirect("/leadership/vision/" + encodeURIComponent(plan));

  const { user, isOwner } = await getVisionActor();
  if (!user) redirect("/sign-in?next=/leadership/vision");
  return <VisionCenterHub owner={isOwner} />;
}
