import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const env = getEnvStatus();

  const database: { configured: boolean; connected?: boolean } = {
    configured: env.database.configured,
  };

  if (env.database.configured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database.connected = true;
    } catch {
      database.connected = false;
    }
  }

  const ok =
    (!database.configured || database.connected === true) &&
    (env.production?.ok ?? true);

  return NextResponse.json({
    ok,
    database,
    blob: env.blob,
    push: env.push,
    cron: env.cron,
    adminBootstrap: env.adminBootstrap,
    passwordResetEmail: env.passwordResetEmail,
  });
}
