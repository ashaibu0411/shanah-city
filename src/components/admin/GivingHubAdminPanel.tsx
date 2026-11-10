"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import type { AdminGivingHubMethod } from "@/lib/giving-hub-types";

export function GivingHubAdminPanel() {
  const [methods, setMethods] = useState<AdminGivingHubMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/giving/hub/methods", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Load failed");
        setMethods(data.methods ?? []);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function verify(id: string, publish: boolean) {
    const res = await fetch("/api/admin/giving/hub/methods/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, publish }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Verify failed");
      return;
    }
    load();
  }

  async function togglePublished(id: string, published: boolean) {
    const res = await fetch("/api/admin/giving/hub/methods", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, published }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Update failed");
      return;
    }
    load();
  }

  return (
    <Card className="mt-10">
      <h2 className="font-display text-xl font-semibold text-night-950 dark:text-sand-50">
        Giving Hub — payment methods
      </h2>
      <p className="mt-2 text-sm text-night-600 dark:text-sand-300">
        Verify Zelle and Cash App recipients before publishing. Unverified methods stay hidden on /give.
        Stripe Checkout is unchanged and does not use this table.
      </p>
      {loading ? <p className="mt-4 text-sm">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-4 space-y-4">
        {methods.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-night-900/8 p-4 dark:border-white/10"
          >
            <MethodRow m={m} />
            <div className="mt-3 flex flex-wrap gap-2">
              {!m.verified ? (
                <>
                  <Button type="button" onClick={() => void verify(m.id, false)}>
                    Verify recipient (draft)
                  </Button>
                  <Button type="button" onClick={() => void verify(m.id, true)}>
                    Verify &amp; publish
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void togglePublished(m.id, !m.published)}
                >
                  {m.published ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MethodRow({ m }: { m: AdminGivingHubMethod }) {
  return (
    <>
      <p className="font-semibold text-night-900 dark:text-sand-100">
        {m.displayName}{" "}
        <span className="text-xs font-normal text-night-500">({m.methodKey})</span>
      </p>
      <p className="mt-1 text-sm text-night-600 dark:text-sand-300">{m.description}</p>
      <p className="mt-2 text-xs text-night-500">
        Recipient (admin): {m.recipientValue ?? "—"} · Verified: {m.verified ? "yes" : "no"} ·
        Published: {m.published ? "yes" : "no"}
      </p>
    </>
  );
}
