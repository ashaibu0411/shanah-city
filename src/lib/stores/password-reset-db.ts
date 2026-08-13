import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export async function createPasswordResetToken(userId: string) {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return prisma.passwordResetToken.create({
    data: {
      id: `reset-${Date.now()}`,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    },
  });
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return null;
  }

  await prisma.passwordResetToken.delete({ where: { id: record.id } });
  return record;
}

export async function deletePasswordResetTokensForUser(userId: string) {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
}
