import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx scripts/migrate-json-to-db.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/shanah_city",
  },
});
