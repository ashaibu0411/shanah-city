"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { site } from "@/lib/site";

export function DeleteAccountPanel() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function deleteAccount() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirmText }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not delete your account.");
      return;
    }

    await signOut();
    router.push("/?accountDeleted=1");
    router.refresh();
  }

  return (
    <Card className="border border-red-200 bg-red-50/40">
      <h2 className="font-display text-xl font-semibold text-night-900">Delete account</h2>
      <p className="mt-2 text-sm text-night-600">
        Permanently remove your Shanah City member account from the app. This cannot be undone.
      </p>

      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-night-700">
        <li>Profile, phone, campus, and family members</li>
        <li>Private messages and notification settings</li>
        <li>Group memberships and pending ministry requests</li>
        <li>Profile photo and photos you uploaded</li>
      </ul>
      <p className="mt-3 text-sm text-night-600">
        Community posts may still appear under the name you used when you posted them. Contact{" "}
        {site.email} if you need help removing specific content.
      </p>

      {!open ? (
        <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-white p-4">
          <p className="text-sm font-semibold text-red-800">
            Type DELETE and enter your password to confirm.
          </p>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder='Type "DELETE"'
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={deleteAccount}
              className={`bg-red-700 text-white hover:bg-red-800 ${loading ? "opacity-70" : ""}`}
              disabled={loading || confirmText !== "DELETE" || password.length < 6}
            >
              {loading ? "Deleting..." : "Permanently delete account"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirmText("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
