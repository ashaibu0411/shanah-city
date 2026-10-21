/**
 * Session renewal + auth refresh resilience (JSON store).
 * Run: npx.cmd tsx scripts/auth-session-resilience.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const root = mkdtempSync(join(tmpdir(), "auth-session-"));
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  const prevAuth = process.env.AUTH_DATA_DIR;
  const prevDb = process.env.DATABASE_URL;
  const prevCwd = process.cwd();
  process.env.AUTH_DATA_DIR = dataDir;
  delete process.env.DATABASE_URL;
  process.chdir(root);

  const now = new Date().toISOString();
  writeFileSync(
    join(dataDir, "users.json"),
    JSON.stringify([
      {
        id: "user-1",
        name: "Test Member",
        email: "test@example.com",
        campusId: "campus-1",
        role: "member",
        passwordHash: "stub",
        family: [],
        createdAt: now,
        updatedAt: now,
      },
    ]),
  );

  try {
    const { createSession, deleteSession, getUserFromSession, renewSession } = await import(
      "../src/lib/auth-server"
    );

    const session = await createSession("user-1");
    const before = await getUserFromSession(session.token);
    assert.ok(before?.id === "user-1");

    const renewed = await renewSession(session.token);
    assert.equal(renewed, true);
    assert.ok(await getUserFromSession(session.token));

    const bogus = await renewSession("not-a-real-token");
    assert.equal(bogus, false);
    assert.equal(await getUserFromSession("not-a-real-token"), null);

    writeFileSync(
      join(dataDir, "sessions.json"),
      JSON.stringify([
        {
          token: "expired-token",
          userId: "user-1",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        },
      ]),
    );
    assert.equal(await renewSession("expired-token"), false);
    assert.equal(await getUserFromSession("expired-token"), null);

    const loggedOut = await createSession("user-1");
    await deleteSession(loggedOut.token);
    assert.equal(await renewSession(loggedOut.token), false);
    assert.equal(await getUserFromSession(loggedOut.token), null);

    writeFileSync(
      join(dataDir, "sessions.json"),
      JSON.stringify([
        {
          token: "orphan-user-token",
          userId: "user-deleted",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
      ]),
    );
    assert.equal(await renewSession("orphan-user-token"), false);
    assert.equal(await getUserFromSession("orphan-user-token"), null);

    console.log("auth-session-resilience.test.ts: all passed");
  } finally {
    process.chdir(prevCwd);
    if (prevAuth !== undefined) process.env.AUTH_DATA_DIR = prevAuth;
    else delete process.env.AUTH_DATA_DIR;
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
