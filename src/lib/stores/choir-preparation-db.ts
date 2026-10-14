import { prisma } from "@/lib/db";

function parseChecked(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export async function getChoirPreparation(userId: string, planKey: string) {
  const record = await prisma.choirPreparationChecklist.findUnique({
    where: { userId_planKey: { userId, planKey } },
  });
  return parseChecked(record?.checked);
}

export async function setChoirPreparationChecked(
  userId: string,
  planKey: string,
  itemId: string,
  checked: boolean,
) {
  const existing = await prisma.choirPreparationChecklist.findUnique({
    where: { userId_planKey: { userId, planKey } },
  });
  const current = parseChecked(existing?.checked);
  const next = checked
    ? current.includes(itemId)
      ? current
      : [...current, itemId]
    : current.filter((id) => id !== itemId);

  await prisma.choirPreparationChecklist.upsert({
    where: { userId_planKey: { userId, planKey } },
    create: {
      userId,
      planKey,
      checked: next,
      updatedAt: new Date(),
    },
    update: {
      checked: next,
      updatedAt: new Date(),
    },
  });

  return next;
}
