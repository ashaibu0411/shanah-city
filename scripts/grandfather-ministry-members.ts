import "./load-project-env";
import { prisma } from "../src/lib/db";
import { resolveMinistryReadiness } from "../src/lib/ministry-readiness-types";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

async function main() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      memberIds: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const group of groups) {
    const pack = resolveMinistryReadiness(group);
    if (!pack) continue;

    const memberIds = parseStringArray(group.memberIds);
    for (const userId of memberIds) {
      const existing = await prisma.ministryReadinessCompletion.findUnique({
        where: {
          userId_readinessKey: {
            userId,
            readinessKey: pack.readinessKey,
          },
        },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.ministryReadinessCompletion.create({
        data: {
          id: `readiness-existing-${userId}-${pack.readinessKey}`,
          userId,
          readinessKey: pack.readinessKey,
          groupId: group.id,
          groupName: group.name,
          score: 0,
          totalQuestions: 0,
          answers: {},
          agreedAt: new Date(),
          source: "existing_member",
        },
      });
      created += 1;
    }
  }

  console.log(`Grandfathered ${created} existing ministry members (${skipped} already had records).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
