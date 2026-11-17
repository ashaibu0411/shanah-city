import { notFound, redirect } from "next/navigation";
import { getVisionActor, canReadVision } from "@/lib/vision-center-access-server";
import { VisionCenterHub } from "@/components/vision/VisionCenterHub";
import { VisionAccessGate } from "@/components/vision/VisionAccessGate";
import { prisma } from "@/lib/db";

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
  if (!planId) notFound();
  const exists = await prisma.visionPlan.findUnique({ where: { id: planId }, select: { id: true } });
  if (!exists) notFound();
  if (!(await canReadVision(planId, user.id, isOwner))) return <VisionAccessGate />;
  return <VisionCenterHub owner={isOwner} planId={planId} />;
}
