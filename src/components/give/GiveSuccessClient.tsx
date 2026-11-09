"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui";

type ConfirmState = "idle" | "confirming" | "recorded" | "pending" | "skipped" | "error";

export function GiveSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const { user, loading } = useAuth();
  const [state, setState] = useState<ConfirmState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !sessionId) return;
    if (state !== "idle") return;

    setState("confirming");
    fetch("/api/giving/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          setState(data.recorded ? "recorded" : "skipped");
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("giving-history-refresh", String(Date.now()));
          }
          return;
        }
        if (response.status === 409) {
          setState("pending");
          setMessage("Your bank payment is still processing. Check back in Profile → Your giving shortly.");
          return;
        }
        if (response.status === 422) {
          setState("skipped");
          return;
        }
        setState("error");
        setMessage(data.error ?? "Could not sync this gift yet.");
      })
      .catch(() => {
        setState("error");
        setMessage("Could not sync this gift yet. Your payment may still appear after processing.");
      });
  }, [loading, user, sessionId, state]);

  return (
    <div className="mt-4 space-y-2 text-sm text-night-600">
      {sessionId && user ? (
        <p>
          {state === "confirming" ? "Saving your gift to your profile…" : null}
          {state === "recorded" ? (
            <span className="font-semibold text-night-800">
              Your gift is on your profile now.
            </span>
          ) : null}
          {state === "pending" ? message : null}
          {state === "error" ? message : null}
        </p>
      ) : sessionId && !loading && !user ? (
        <p>
          <Link href={`/sign-in?next=/give/success?session_id=${encodeURIComponent(sessionId)}`} className="font-semibold underline">
            Sign in
          </Link>{" "}
          with the same email you used at checkout so we can attach this gift to your account.
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/profile#your-giving">View profile</Button>
        <Button href="/give" variant="secondary">
          Back to giving
        </Button>
        <Link href="/" className="self-center text-sm font-semibold text-night-700 underline">
          Home
        </Link>
      </div>
    </div>
  );
}
