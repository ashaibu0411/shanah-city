"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import type { GroupJoinRequest } from "@/lib/group-types";

export function AdminApprovalsPanel() {
  const { permissions } = useAuth();
  const [pending, setPending] = useState<GroupJoinRequest[]>([]);
  const [mine, setMine] = useState<GroupJoinRequest[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/join-requests");
    const data = await response.json();
    if (response.ok) {
      setPending(data.pending ?? []);
      setMine(data.mine ?? []);
      setMessage(null);
      setError(null);
    } else {
      setMessage(null);
      setError(data.error ?? "Could not load requests.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(requestId: string, action: "approve" | "reject") {
    setReviewingId(requestId);
    setMessage(null);
    setError(null);
    const response = await fetch("/api/admin/join-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, requestId }),
    });
    const data = await response.json();
    setReviewingId(null);
    if (response.ok) {
      setMessage(
        action === "approve"
          ? `Approved ${data.request?.userName ?? "member"} for ${data.request?.groupName ?? "the group"}.`
          : "Request declined.",
      );
      load();
    } else {
      setError(data.error ?? "Could not update request.");
    }
  }

  if (loading) {
    return <Card>Loading approvals…</Card>;
  }

  return (
    <div className="space-y-6">
      {!permissions.canManageAdmin && pending.length === 0 && (
        <Card>
          <h2 className="font-display text-xl font-semibold text-night-900">
            Ministry requests
          </h2>
          <p className="mt-2 text-sm text-night-600">
            You can view your own pending ministry requests below. Only Admin Group members
            can approve others.
          </p>
        </Card>
      )}

      {permissions.canManageAdmin && (
        <Card>
          <h2 className="font-display text-xl font-semibold text-night-900">
            Pending approvals
          </h2>
          <p className="mt-1 text-sm text-night-600">
            Review ministry and leadership access requests from sign-up and group joins.
          </p>
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
              {error}
            </p>
          )}
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-night-500">No pending requests.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((request) => (
                <li
                  key={request.id}
                  className="rounded-xl bg-sand-50 p-4 ring-1 ring-night-900/5"
                >
                  <p className="font-medium text-night-900">{request.userName}</p>
                  <p className="text-sm text-night-600">{request.userEmail}</p>
                  <p className="mt-1 text-sm text-night-700">
                    Wants to join: <strong>{request.groupName}</strong>
                  </p>
                  <p className="text-xs text-night-500">
                    Requested {new Date(request.requestedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => review(request.id, "approve")}
                      disabled={reviewingId === request.id}
                    >
                      {reviewingId === request.id ? "Saving…" : "Approve"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => review(request.id, "reject")}
                      disabled={reviewingId === request.id}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Your requests</h2>
        {mine.filter((request) => request.status === "pending").length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No pending requests on your account.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mine
              .filter((request) => request.status === "pending")
              .map((request) => (
                <li key={request.id} className="text-sm text-night-700">
                  <strong>{request.groupName}</strong> — waiting for approval
                </li>
              ))}
          </ul>
        )}
      </Card>

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
