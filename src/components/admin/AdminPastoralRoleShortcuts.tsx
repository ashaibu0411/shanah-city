"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import type { PastoralRoleAssignmentView } from "@/lib/pastoral-roles-types";

export function AdminPastoralRoleShortcuts({ className = "" }: { className?: string }) {
  const [assignments, setAssignments] = useState<PastoralRoleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/pastoral-roles")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.assignments)) {
          setAssignments(data.assignments);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className={`${className} border-violet-200/60 bg-violet-50/40`}>
      <h3 className="font-display text-lg font-semibold text-night-900">Pastoral roles</h3>
      <p className="mt-1 text-sm text-night-600">
        Admin assigns one Senior Pastor and one Associate Pastor. These are roles, not groups, and
        each role can only belong to one person.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(loading ? [] : assignments).map((assignment) => (
          <div
            key={assignment.role}
            className="rounded-xl bg-white px-4 py-3 ring-1 ring-night-900/10"
          >
            <p className="font-semibold text-night-900">{assignment.label}</p>
            <p className="mt-1 text-sm text-night-600">
              {assignment.userName ?? "Not assigned yet"}
            </p>
          </div>
        ))}
        {loading ? (
          <p className="text-sm text-night-500 sm:col-span-2">Loading pastoral roles…</p>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-night-500">
        Open a member profile in{" "}
        <Link href="/admin/people" className="font-semibold text-violet-800 underline">
          People
        </Link>{" "}
        to assign or change these roles.
      </p>
    </Card>
  );
}
