"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";

export function LeaderPromotionPanel() {
  const { user, setUser } = useAuth();
  const [pin, setPin] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetRole, setTargetRole] = useState<"leader" | "team">("leader");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function becomeLeader() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "become_leader", pin }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not upgrade account.");
      return;
    }

    setUser(data.user);
    setStatus("Your account is now a leader. You can write devotions without entering a PIN each time.");
    setPin("");
  }

  async function promoteMember() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "promote_member",
        email: targetEmail,
        role: targetRole,
        pin,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not promote member.");
      return;
    }

    setStatus(`${data.promotedName} is now a ${targetRole}.`);
    setTargetEmail("");
    setPin("");
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-night-900">
        Leader & team access
      </h2>

      {user.role === "leader" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-night-600">
            You are a <strong>leader</strong>. Promote pastors, admins, or backend team members
            below.
          </p>
          <input
            value={targetEmail}
            onChange={(event) => setTargetEmail(event.target.value)}
            placeholder="Member email to promote"
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <select
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value as "leader" | "team")}
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            <option value="leader">Leader (write devotions)</option>
            <option value="team">Team (upload photos)</option>
          </select>
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Leader PIN to confirm"
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <Button onClick={promoteMember} disabled={busy || !targetEmail.trim()}>
            Promote member
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-night-600">
            Pastors and leaders can unlock devotion writing permanently by entering the leader PIN
            once on this account.
          </p>
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Leader PIN"
            className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <Button onClick={becomeLeader} disabled={busy || !pin.trim()}>
            Become a leader
          </Button>
        </div>
      )}

      {status && (
        <p className="mt-4 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">{status}</p>
      )}
    </Card>
  );
}
