"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/** Visibility hint only; the destination and data API enforce authorization. */
export function VisionAssignmentShortcut() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) { return; }
    let cancelled = false;
    void fetch("/api/vision/plans", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled) setCount(Array.isArray(data?.plans) ? data.plans.length : 0); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [user]);
  if (!user || count === 0) return null;
  return (
    <Link href="/leadership/vision" className="mb-4 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <span><strong>My 2027 Vision Assignments</strong><span className="block text-xs text-blue-700">Review your ministry vision and share your ideas.</span></span>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{count}</span>
    </Link>
  );
}
