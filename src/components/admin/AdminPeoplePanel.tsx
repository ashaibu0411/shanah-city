"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";
import { Card } from "@/components/ui";
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
    return <Card>Loading member directory…</Card>;
  }

  return (
    <>
      {message && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card className={`p-0 ${selected ? "hidden lg:block" : ""}`}>
          <div className="border-b border-night-900/5 px-4 py-4">
            <h2 className="font-display text-lg font-semibold text-night-900">Members</h2>
            <p className="mt-1 text-xs text-night-500">
              {filtered.length} of {people.length} shown
            </p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names…"
              className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </div>

          <div className="max-h-[min(70vh,720px)] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-sm text-night-500">No members match your search.</p>
            ) : (
              <ul className="divide-y divide-night-900/5">
                {filtered.map((person) => {
                  const isSelected = person.id === selectedId;
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(person.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                          isSelected
                            ? "bg-night-900 text-sand-50"
                            : "hover:bg-sand-50"
                        }`}
                      >
                        <span className="truncate font-medium">{person.name}</span>
                        <span
                          className={`shrink-0 text-xs ${
                            isSelected ? "text-sand-300" : "text-night-400"
                          }`}
                        >
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <div className={selected ? "" : "hidden lg:block"}>
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-night-600 hover:text-night-900 lg:hidden"
              >
                ← Back to list
              </button>
              <AdminMemberDetail
                person={selected}
                onClose={() => setSelectedId(null)}
                onUpdated={updatePerson}
              />
            </>
          ) : (
            <Card className="flex min-h-[320px] items-center justify-center bg-sand-50/80">
              <div className="max-w-sm px-6 text-center">
                <p className="font-display text-xl font-semibold text-night-900">
                  Select a member
                </p>
                <p className="mt-2 text-sm leading-relaxed text-night-600">
                  Choose a name from the list to view contact details, ministries, and family
                  information.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
