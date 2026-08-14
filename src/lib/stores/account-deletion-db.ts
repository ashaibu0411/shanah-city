import { prisma } from "@/lib/db";
import { deleteUserAvatar } from "@/lib/avatar-server";

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export async function deleteUserAccountData(userId: string) {
  await deleteUserAvatar(userId);

  await prisma.$transaction(async (tx) => {
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.groupJoinRequest.deleteMany({ where: { userId } });
    await tx.userBlock.deleteMany({
      where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] },
    });
    await tx.messageReport.deleteMany({
      where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] },
    });
    await tx.galleryDownload.deleteMany({ where: { userId } });
    await tx.meetingClick.deleteMany({ where: { userId } });

    await tx.messageThread.deleteMany({
      where: { OR: [{ participantAId: userId }, { participantBId: userId }] },
    });

    await tx.devotion.updateMany({
      where: { authorId: userId },
      data: { authorId: null },
    });

    await tx.galleryPhoto.deleteMany({ where: { uploadedBy: userId } });

    const groups = await tx.group.findMany();
    for (const group of groups) {
      const memberIds = parseStringArray(group.memberIds).filter((id) => id !== userId);
      const adminIds = parseStringArray(group.adminIds).filter((id) => id !== userId);
      if (
        memberIds.length !== parseStringArray(group.memberIds).length ||
        adminIds.length !== parseStringArray(group.adminIds).length
      ) {
        await tx.group.update({
          where: { id: group.id },
          data: {
            memberIds,
            adminIds,
            updatedAt: new Date(),
          },
        });
      }
    }

    await tx.user.delete({ where: { id: userId } });
  });
}
