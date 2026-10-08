import { prisma } from "@/lib/db";

/** Remove all private Couples Hub data when a spouse link is disconnected. */
export async function purgeCoupleWorkspaceData(coupleLinkId: string) {
  const weeks = await prisma.coupleCheckInWeek.findMany({
    where: { coupleLinkId },
    select: { id: true },
  });
  const weekIds = weeks.map((week) => week.id);

  await prisma.$transaction([
    prisma.coupleCalendarEvent.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleLoveNote.deleteMany({ where: { coupleLinkId } }),
    prisma.couplePrayerJournalEntry.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleMarriageGoal.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleDateNightPlan.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleDevotionalRead.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleGameState.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleEnrichmentProgress.deleteMany({ where: { coupleLinkId } }),
    prisma.couplePrayerPost.deleteMany({ where: { coupleLinkId } }),
    prisma.coupleMentorRequest.deleteMany({ where: { coupleLinkId } }),
    ...(weekIds.length
      ? [prisma.coupleCheckInAnswer.deleteMany({ where: { weekId: { in: weekIds } } })]
      : []),
    prisma.coupleCheckInWeek.deleteMany({ where: { coupleLinkId } }),
  ]);
}
