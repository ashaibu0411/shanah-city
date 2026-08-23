import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import {
  createShopCheckoutSession,
  isStripeShopConfigured,
  type ShopCheckoutItem,
} from "@/lib/shop-checkout-server";

export async function GET() {
  return NextResponse.json({
    enabled: isStripeShopConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isStripeShopConfigured()) {
    return NextResponse.json(
      { error: "Online shop checkout is not configured yet." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(`shop:checkout:${ip}`, {
    limit: 20,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const body = await request.json();
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: ShopCheckoutItem[] = rawItems
    .map((item: { productId?: string; quantity?: number }) => ({
      productId: String(item.productId ?? "").trim(),
      quantity: Math.max(1, Math.floor(Number(item.quantity ?? 1))),
    }))
    .filter((item: ShopCheckoutItem) => item.productId);

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    const session = await createShopCheckoutSession({ items, user });
    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start checkout." },
      { status: 400 },
    );
  }
}
