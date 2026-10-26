import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at IS NOT NULL AS applied, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY migration_name
  `;
  const duplicateActiveCerts = await prisma.$queryRaw`
    SELECT "journeyId", COUNT(*)::int AS c
    FROM "MarriagePremaritalFinalCertificate"
    WHERE status = 'active'
    GROUP BY "journeyId"
    HAVING COUNT(*) > 1
    LIMIT 5
  `;
  console.log(JSON.stringify({ migrations, duplicateActiveCerts }));
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
