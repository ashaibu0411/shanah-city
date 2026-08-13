import { existsSync, readFileSync } from "fs";
import { defineConfig } from "prisma/config";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function getMigrationDatabaseUrl() {
  const direct =
    process.env.DIRECT_URL?.trim() || process.env.DIRECT_DATABASE_URL?.trim();
  if (direct) {
    return direct;
  }

  const pooled = process.env.DATABASE_URL?.trim();
  if (pooled?.includes("-pooler.")) {
    return pooled.replace("-pooler.", ".");
  }

  return pooled ?? "postgresql://localhost:5432/shanah_city";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx scripts/migrate-json-to-db.ts",
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
