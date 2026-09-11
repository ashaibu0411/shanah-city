"use client";

import { useEffect, useState } from "react";
type PoolMember = { userId: string; name: string };

type LookupMember = { id: string; name: string };

export function RotationPoolEditor({
  pool,
  onChange,
  lookupUrl = "/api/admin/prayer-schedule",
  chipClassName = "bg-copper-600",
}: {
  pool: PoolMember[];
  onChange: (pool: PoolMember[]) => void;
  lookupUrl?: string;
  chipClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LookupMember[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `${lookupUrl}?lookup=${encodeURIComponent(needle)}`,
        );
        const data = await response.json();
        setResults(response.ok ? (data.members ?? []) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [lookupUrl, query]);

  function addMember(member: LookupMember) {
    if (pool.some((entry) => entry.userId === member.id)) return;
    onChange([...pool, { userId: member.id, name: member.name }]);
    setQuery("");
    setResults([]);
  }

  function removeMember(userId: string) {
    onChange(pool.filter((entry) => entry.userId !== userId));
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-night-800">Rotation pool</p>
      <p className="mt-1 text-xs text-night-500">
        Search and add only the members who belong in this rotation. The schedule rotates through
        this list — not everyone in the app.
      </p>

      {pool.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {pool.map((member, index) => (
            <span
              key={member.userId}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${chipClassName}`}
            >
              <span>
                {index + 1}. {member.name}
              </span>
              <button
                type="button"
                onClick={() => removeMember(member.userId)}
                className="rounded-full bg-white/15 px-2 py-0.5 text-xs hover:bg-white/25"
                aria-label={`Remove ${member.name} from rotation pool`}
              >
                Remove
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-600">
          No one is in the pool yet. Search below to add members.
        </p>
      )}

      <label className="mt-4 block text-sm text-night-700">
        <span className="font-semibold">Add someone to the pool</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
        />
      </label>

      {searching ? <p className="mt-2 text-xs text-night-500">Searching…</p> : null}

      {results.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {results.map((member) => {
            const alreadyAdded = pool.some((entry) => entry.userId === member.id);
            return (
              <button
                key={member.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => addMember(member)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  alreadyAdded
                    ? "cursor-not-allowed bg-sand-100 text-night-400"
                    : "bg-sand-100 text-night-700 hover:bg-sand-200"
                }`}
              >
                {alreadyAdded ? `${member.name} added` : `Add ${member.name}`}
              </button>
            );
          })}
        </div>
      ) : null}

      {pool.length > 0 && (
        <p className="mt-3 text-xs text-night-500">
          Rotation order: {pool.map((entry) => entry.name).join(" → ")}
        </p>
      )}
    </div>
  );
}
