import { Prisma } from "@prisma/client";
import type { PublicMember } from "@/lib/auth-types";
import {
  classifyDatabaseUrlTarget,
  isPhase3mDatabaseIdentityDiagnosticActive,
  type Phase3mDatabaseIdentityClassification,
} from "@/lib/marriage-phase3m-database-identity-diagnostic";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";

export type Phase3mAuthDbContextDiagPayload = {
  tag: "phase3m-auth-db-context-diag";
  stagingProjectActive: boolean;
  storageBackend: "db" | "json";
  authLookupSucceeded: boolean;
  sessionUserRowExists: boolean | null;
  lookupConsistent: boolean | null;
  currentDatabase: string | null;
  currentSchema: string | null;
  databaseUrlClassification: Phase3mDatabaseIdentityClassification;
};

export type Phase3mAuthDbContextDiagFailedPayload = {
  tag: "phase3m-auth-db-context-diag-failed";
  stagingProjectActive: boolean;
};

export function computeAuthDbLookupConsistent(
  authLookupSucceeded: boolean,
  sessionUserRowExists: boolean | null,
): boolean | null {
  if (sessionUserRowExists === null) {
    return null;
  }
  return authLookupSucceeded === sessionUserRowExists;
}

export function buildPhase3mAuthDbContextDiagPayload(input: {
  storageBackend: "db" | "json";
  authLookupSucceeded: boolean;
  sessionUserRowExists: boolean | null;
  currentDatabase: string | null;
  currentSchema: string | null;
  databaseUrlClassification: Phase3mDatabaseIdentityClassification;
}): Phase3mAuthDbContextDiagPayload {
  return {
    tag: "phase3m-auth-db-context-diag",
    stagingProjectActive: true,
    storageBackend: input.storageBackend,
    authLookupSucceeded: input.authLookupSucceeded,
    sessionUserRowExists: input.sessionUserRowExists,
    lookupConsistent: computeAuthDbLookupConsistent(
      input.authLookupSucceeded,
      input.sessionUserRowExists,
    ),
    currentDatabase: input.currentDatabase,
    currentSchema: input.currentSchema,
    databaseUrlClassification: input.databaseUrlClassification,
  };
}

async function queryDbContextForSessionUser(sessionUserId: string): Promise<{
  currentDatabase: string;
  currentSchema: string;
  sessionUserRowExists: boolean;
}> {
  const rows = await prisma.$queryRaw<
    {
      currentDatabase: string;
      currentSchema: string;
      sessionUserRowExists: boolean;
    }[]
  >(Prisma.sql`
    SELECT
      current_database() AS "currentDatabase",
      current_schema() AS "currentSchema",
      EXISTS (
        SELECT 1 FROM public."User" WHERE id = ${sessionUserId}
      ) AS "sessionUserRowExists"
  `);
  const row = rows[0];
  if (!row?.currentDatabase || !row?.currentSchema) {
    throw new Error("auth db context query returned no row");
  }
  return {
    currentDatabase: row.currentDatabase,
    currentSchema: row.currentSchema,
    sessionUserRowExists: Boolean(row.sessionUserRowExists),
  };
}

async function queryDbContextWithoutSessionUser(): Promise<{
  currentDatabase: string;
  currentSchema: string;
}> {
  const rows = await prisma.$queryRaw<
    {
      currentDatabase: string;
      currentSchema: string;
    }[]
  >(Prisma.sql`
    SELECT
      current_database() AS "currentDatabase",
      current_schema() AS "currentSchema"
  `);
  const row = rows[0];
  if (!row?.currentDatabase || !row?.currentSchema) {
    throw new Error("auth db context query returned no row");
  }
  return {
    currentDatabase: row.currentDatabase,
    currentSchema: row.currentSchema,
  };
}

/** Server logs only (Vercel function logs). Same request as GET /api/auth after session lookup. */
export async function logPhase3mAuthDbContextDiagnosticAfterGetAuth(
  user: PublicMember | null,
): Promise<void> {
  if (!isPhase3mDatabaseIdentityDiagnosticActive()) {
    return;
  }

  const authLookupSucceeded = user !== null;
  const databaseUrlClassification = classifyDatabaseUrlTarget();
  const storageBackend = useDatabase() ? "db" : "json";

  try {
    if (!useDatabase()) {
      console.info(
        JSON.stringify(
          buildPhase3mAuthDbContextDiagPayload({
            storageBackend: "json",
            authLookupSucceeded,
            sessionUserRowExists: null,
            currentDatabase: null,
            currentSchema: null,
            databaseUrlClassification,
          }),
        ),
      );
      return;
    }

    if (authLookupSucceeded && user) {
      const context = await queryDbContextForSessionUser(user.id);
      console.info(
        JSON.stringify(
          buildPhase3mAuthDbContextDiagPayload({
            storageBackend: "db",
            authLookupSucceeded: true,
            sessionUserRowExists: context.sessionUserRowExists,
            currentDatabase: context.currentDatabase,
            currentSchema: context.currentSchema,
            databaseUrlClassification,
          }),
        ),
      );
      return;
    }

    const context = await queryDbContextWithoutSessionUser();
    console.info(
      JSON.stringify(
        buildPhase3mAuthDbContextDiagPayload({
          storageBackend: "db",
          authLookupSucceeded: false,
          sessionUserRowExists: null,
          currentDatabase: context.currentDatabase,
          currentSchema: context.currentSchema,
          databaseUrlClassification,
        }),
      ),
    );
  } catch {
    const failed: Phase3mAuthDbContextDiagFailedPayload = {
      tag: "phase3m-auth-db-context-diag-failed",
      stagingProjectActive: true,
    };
    console.info(JSON.stringify(failed));
  }
}
