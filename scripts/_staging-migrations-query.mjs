import pg from "pg";

const connectionString =
  process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString?.trim()) {
  console.error("MISSING_DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({ connectionString: connectionString.trim() });

async function main() {
  await client.connect();
  const migrations = (
    await client.query(`
      SELECT migration_name,
             (finished_at IS NOT NULL) AS applied,
             rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY migration_name
    `)
  ).rows;
  const duplicateActiveCerts = (
    await client.query(`
      SELECT "journeyId", COUNT(*)::int AS c
      FROM "MarriagePremaritalFinalCertificate"
      WHERE status = 'active'
      GROUP BY "journeyId"
      HAVING COUNT(*) > 1
      LIMIT 20
    `)
  ).rows;
  const activeCertTotals = (
    await client.query(`
      SELECT COUNT(*)::int AS active_rows,
             COUNT(DISTINCT "journeyId")::int AS journeys_with_active
      FROM "MarriagePremaritalFinalCertificate"
      WHERE status = 'active'
    `)
  ).rows[0];
  console.log(JSON.stringify({ migrations, duplicateActiveCerts, activeCertTotals }));
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => client.end().catch(() => {}));
