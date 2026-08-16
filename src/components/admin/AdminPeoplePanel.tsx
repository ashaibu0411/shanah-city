"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Button, Card } from "@/components/ui";
import { getCampus } from "@/lib/site";
import type { AdminPeopleEntry } from "@/lib/member-types";

export function AdminPeoplePanel() {
  const [people, setPeople] = useState<AdminPeopleEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/people")
      .then((response) => response.json())
      .then((data) => {
        if (data.people) {
          setPeople(data.people);
          setMessage(null);
        } else {
          setMessage(data.error ?? "Could not load people.");
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage("Could not load people.");
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) => {
      const haystack = [
        person.name,
        person.email,
        person.phone ?? "",
        person.campusId,
        person.role ?? "",
        ...person.groups.map((group) => group.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [people, query]);

  const selected = people.find((person) => person.id === selectedId) ?? null;

  function updatePerson(updated: AdminPeopleEntry) {
    setPeople((current) =>
      current.map((person) => (person.id === updated.id ? updated : person)),
    );
  }

  if (loading) {
    return (
      <>
        <AdminSubNav />
        <Card>Loading member directory…</Card>
      </>
    );
  }

  return (
    <>
      <AdminSubNav />

      <Card className="mb-6">
        <h2 className="font-display text-xl font-semibold text-night-900">Member directory</h2>
        <p className="mt-1 text-sm text-night-600">
          Tap a member to view their full profile, family tree, role tier, and ministries. You
          can edit contact details and household members.
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, campus, or group…"
          className="mt-4 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
      </Card>

      {message && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
      )}

      {selected && (
        <div className="mb-6">
          <AdminMemberDetail
            person={selected}
            onClose={() => setSelectedId(null)}
            onUpdated={updatePerson}
          />
        </div>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-night-500">No members match your search.</p>
          </Card>
        ) : (
          filtered.map((person) => {
            const isSelected = person.id === selectedId;
            return (
              <Card
                key={person.id}
                className={isSelected ? "ring-2 ring-night-900/20" : undefined}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : person.id)}
                    className="text-left"
                  >
                    <h3 className="font-display text-lg font-semibold text-night-900 hover:underline">
                      {person.name}
                    </h3>
                    <p className="text-sm text-night-600">{person.email}</p>
                    {person.phone && (
                      <p className="text-sm text-night-600">{person.phone}</p>
                    )}
                  </button>
                  <div className="text-right text-sm text-night-600">
                    <p>{getCampus(person.campusId).name}</p>
                    {person.role && person.role !== "member" && (
                      <p className="capitalize">{person.role} tier</p>
                    )}
                    <p className="text-xs text-night-500">
                      Joined {new Date(person.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {person.groups.length === 0 ? (
                    <span className="text-sm text-night-500">No groups yet</span>
                  ) : (
                    person.groups.map((group) => (
                      <span
                        key={`${person.id}-${group.id}-${group.status}`}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          group.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sand-100 text-night-700"
                        }`}
                      >
                        {group.name}
                        {group.status === "pending" ? " (pending)" : ""}
                      </span>
                    ))
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={isSelected ? "secondary" : undefined}
                    onClick={() => setSelectedId(isSelected ? null : person.id)}
                  >
                    {isSelected ? "Hide profile" : "View profile"}
                  </Button>
                  {person.familyCount > 0 && (
                    <span className="self-center text-xs text-night-500">
                      {person.familyCount} family member{person.familyCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
