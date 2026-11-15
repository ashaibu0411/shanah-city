import { notFound, redirect } from "next/navigation";
import { getVisionActor, canReadVision } from "@/lib/vision-center-access-server";
import { VisionCenterHub } from "@/components/vision/VisionCenterHub";

export const dynamic = "force-dynamic";

/**
 * A dedicated private page for each ministry vision.
 * Server authorization is checked before rendering, and the API checks again
 * before returning any plan details or accepting mutations.
 */
export default async function VisionPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const { user, isOwner } = await getVisionActor();
  if (!user) redirect("/sign-in?next=" + encodeURIComponent("/leadership/vision/" + planId));
  if (!planId || !(await canReadVision(planId, user.id, isOwner))) notFound();
  return <VisionCenterHub owner={isOwner} planId={planId} />;
}
