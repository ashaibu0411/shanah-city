"use client";

import { premiumV4PublicGreeting } from "@/lib/home-premium-v4";

export function PremiumHomeV4Greeting({ firstName }: { firstName?: string | null }) {
  const title = premiumV4PublicGreeting(firstName);
  return (
    <header className="ph4-greeting" aria-label="Greeting">
      <h1 className="ph4-greeting__title">{title}</h1>
      <p className="ph4-greeting__sub">Welcome to your church family.</p>
    </header>
  );
}