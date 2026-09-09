"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { CoupleLinkView } from "@/lib/couple-link-types";

export function CoupleAccountLinkPanel() {
  const [link, setLink] = useState<CoupleLinkView | null>(null);
  const [pendingIncoming, setPendingIncoming] = useState<CoupleLinkView | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    const response = await fetch("/api/couple-link");
    const data = await response.json();
    if (response.ok) {
      setLink(data.link ?? null);
      setPendingIncoming(data.pendingIncoming ?? null);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function runAction(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/couple-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    setLink(data.link ?? null);
    setPendingIncoming(data.pendingIncoming ?? null);
    setEmail("");
    setMessage("Saved.");
  }

  return (
    <div className="mt-6 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-night-500">
        Spouse account
      </h3>
      <p className="mt-2 text-sm text-night-700">
        Link your Shanah City account to your spouse for couple RSVPs and the private Power Couples
        prayer wall.
      </p>

      {link?.status === "active" ? (
        <div className="mt-4 rounded-xl bg-white/90 p-3 ring-1 ring-rose-200/80">
          <p className="text-sm text-night-800">
            Linked with <strong>{link.partnerName}</strong>
            <span className="block text-xs text-night-500">{link.partnerEmail}</span>
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            disabled={busy}
            onClick={() => runAction({ action: "remove", linkId: link.id })}
          >
            Unlink spouse
          </Button>
        </div>
      ) : null}

      {pendingIncoming ? (
        <div className="mt-4 rounded-xl bg-white/90 p-3 ring-1 ring-teal-200/80">
          <p className="text-sm text-night-800">
            <strong>{pendingIncoming.partnerName}</strong> invited you to link spouse accounts.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => runAction({ action: "accept", linkId: pendingIncoming.id })}>
              Accept
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => runAction({ action: "decline", linkId: pendingIncoming.id })}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      {link?.status === "pending" && !link.isIncomingInvite ? (
        <div className="mt-4 rounded-xl bg-white/90 p-3 ring-1 ring-sand-200/80">
          <p className="text-sm text-night-700">
            Invite sent to <strong>{link.partnerName}</strong>. Waiting for them to accept.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            disabled={busy}
            onClick={() => runAction({ action: "remove", linkId: link.id })}
          >
            Cancel invite
          </Button>
        </div>
      ) : null}

      {!link && !pendingIncoming ? (
        <div className="mt-4">
          <label className="block">
            <span className="text-xs font-semibold text-night-600">Spouse email on Shanah City</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="spouse@email.com"
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <Button className="mt-3" disabled={busy || !email.trim()} onClick={() => runAction({ action: "invite", email })}>
            Send link invite
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
