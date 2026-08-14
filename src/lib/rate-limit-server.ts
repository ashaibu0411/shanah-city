import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const memory = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function enforceRateLimitMemory(
  key: string,
  options: { limit: number; windowSeconds: number },
  now: number,
  windowMs: number,
): RateLimitResult {
  const existing = memory.get(key);
  if (!existing || existing.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

async function enforceRateLimitDb(
  key: string,
  options: { limit: number; windowSeconds: number },
  now: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const resetAt = new Date(now + windowMs);
  const existing = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!existing || existing.resetAt.getTime() <= now) {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { allowed: true };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt.getTime() - now) / 1000),
      ),
    };
  }

  await prisma.rateLimitEntry.update({
    where: { key },
    data: { count: existing.count + 1 },
  });
  return { allowed: true };
}

export async function enforceRateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  if (useDatabase()) {
    return enforceRateLimitDb(key, options, now, windowMs);
  }

  return enforceRateLimitMemory(key, options, now, windowMs);
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many attempts. Try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}
