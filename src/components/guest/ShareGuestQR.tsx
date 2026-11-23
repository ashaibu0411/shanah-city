"use client";

import { useState } from "react";

export function ShareGuestQR({ url, label }: { url: string; label: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: label, text: "Connect with Shanah City — no app download required.", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Registration link copied. You can share it by text, WhatsApp, or email.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Use the registration link shown below to share.");
    }
  }
  return (
    <div className="mt-5 space-y-2">
      <button type="button" onClick={share} className="rounded-xl border border-blue-700 px-6 py-3 font-semibold text-blue-700 dark:text-blue-300">
        Share registration link
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}
