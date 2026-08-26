import type { PublicMember } from "@/lib/auth-types";
import { shopProducts } from "@/lib/site";
import {
  getAppBaseUrl,
  getStripe,
  isStripeGivingConfigured,
  STRIPE_CHECKOUT_PAYMENT_METHOD_OPTIONS,
  STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES,
} from "@/lib/stripe-server";

export function isStripeShopConfigured() {
  return isStripeGivingConfigured();
}

export type ShopCheckoutItem = {
  productId: string;
  quantity: number;
};

export async function createShopCheckoutSession(input: {
  items: ShopCheckoutItem[];
  user?: PublicMember | null;
}) {
  if (!isStripeShopConfigured()) {
    throw new Error("Online shop checkout is not configured yet.");
  }

  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string; description: string };
      unit_amount: number;
    };
    quantity: number;
  }> = [];

  for (const item of input.items) {
    if (!item.productId || item.quantity < 1) {
      throw new Error("Each cart item needs a product and quantity.");
    }

    const product = shopProducts.find((entry) => entry.id === item.productId);
    if (!product) {
      throw new Error("One or more products are no longer available.");
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    });
  }

  if (lineItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/shop`,
    client_reference_id: input.user?.id,
    customer_email: input.user?.email,
    metadata: {
      type: "shop",
      userId: input.user?.id ?? "",
    },
    payment_method_types: STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES,
    payment_method_options: STRIPE_CHECKOUT_PAYMENT_METHOD_OPTIONS,
  });
}
