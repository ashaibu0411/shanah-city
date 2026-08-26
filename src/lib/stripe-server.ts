import Stripe from "stripe";

/** Card, Apple Pay, Google Pay, and US bank account (ACH) on Stripe Checkout. */
export const STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES: Stripe.Checkout.SessionCreateParams["payment_method_types"] =
  ["card", "us_bank_account"];

export const STRIPE_CHECKOUT_PAYMENT_METHOD_OPTIONS: Stripe.Checkout.SessionCreateParams["payment_method_options"] =
  {
    us_bank_account: {
      financial_connections: {
        permissions: ["payment_method"],
      },
      verification_method: "automatic",
    },
  };

export function isStripeGivingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
