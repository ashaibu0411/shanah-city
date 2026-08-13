/**
 * Step 1: import auth data from data/users.json, sessions.json, activity.json.
 * For a full import of all JSON domains, run: npm run db:seed
 */
import { migrateActivity, migrateSessions, migrateUsers } from "./migrate-json-to-db";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  console.log("Importing auth data from data/ …");
  await migrateUsers();
  await migrateSessions();
  await migrateActivity();
  console.log("Auth migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
