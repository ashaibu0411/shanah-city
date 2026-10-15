"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageJoinInvite() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/marriage/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", code }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not join.");
      setLoading(false);
      return;
    }
    router.push("/marriage");
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Join a counseling journey</h1>
      <p className={marriagePremium.cardMuted}>
        Enter the invitation code from your partner or counselor. You must be signed in to your own account.
      </p>
      <form onSubmit={submit} className={`${marriagePremium.card} mt-6`}>
        <label className="text-xs font-bold uppercase text-night-500" htmlFor="invite-code">
          Invitation code
        </label>
        <input
          id="invite-code"
          className="mt-2 min-h-[44px] w-full rounded-xl border border-night-900/10 px-3 font-mono text-lg tracking-widest uppercase dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoComplete="off"
          required
        />
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <button type="submit" className={`${marriagePremium.primaryCta} mt-4`} disabled={loading}>
          {loading ? "Joining…" : "Join journey"}
        </button>
      </form>
    </div>
  );
}
