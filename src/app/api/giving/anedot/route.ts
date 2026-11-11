import { NextResponse } from "next/server";
import { anedotPublicCheckoutAvailable } from "@/lib/anedot-env";
import { GIVING_CHECKOUT_FUNDS, GIVING_CHECKOUT_FREQUENCIES } from "@/lib/giving-types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      enabled: anedotPublicCheckoutAvailable(),
      funds: GIVING_CHECKOUT_FUNDS,
      frequencies: GIVING_CHECKOUT_FREQUENCIES,
      provider: "anedot",
      checkoutMode: "hosted_redirect",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
