"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";

type MemberCandidate = {
  id: string;
  name: string;
  email: string;
  campusId: string;
};

export function GroupMemberAddForm({
  groupId,
  disabled,
  onAdded,
  onStatus,
}: {
  groupId: string;
  disabled?: boolean;
  onAdded: () => Promise<void> | void;
  onStatus: (message: string, isError?: boolean) => void;
}) {
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [candidates, setCandidates] = useState<MemberCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (memberSearch.trim().length < 2) {
      setCandidates([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      const params = new URLSearchParams({
        memberSearch: "1",
        groupId,
        q: memberSearch.trim(),
      });
      const response = await fetch(`/api/groups?${params.toString()}`);
      const data = await response.json();
      setSearchLoading(false);
      if (response.ok) {
        setCandidates(data.members ?? []);
      } else {
        setCandidates([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [groupId, memberSearch]);

  const showResults = memberSearch.trim().length >= 2;

  const filteredCandidates = useMemo(() => candidates.slice(0, 8), [candidates]);

  async function addMember(payload: { email?: string; userId?: string; label: string }) {
    setBusy(true);
    onStatus("");
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-member",
        groupId,
        email: payload.email,
        userId: payload.userId,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      onStatus(data.error ?? "Could not add member.", true);
      return;
    }

    setAddMemberEmail("");
    setMemberSearch("");
    setCandidates([]);
    onStatus(`Added ${payload.label}.`);
    await onAdded();
  }

  return (
    <div className="mt-3 space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!addMemberEmail.trim()) return;
          await addMember({ email: addMemberEmail.trim(), label: addMemberEmail.trim() });
        }}
      >
        <input
          type="email"
          value={addMemberEmail}
          onChange={(event) => setAddMemberEmail(event.target.value)}
          placeholder="Add by email address"
          className="min-w-0 flex-1 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={disabled || busy || !addMemberEmail.trim()}
        >
          Add by email
        </Button>
      </form>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-night-500">
          Or search app members
        </label>
        <input
          value={memberSearch}
          onChange={(event) => setMemberSearch(event.target.value)}
          placeholder="Search by name or email"
          className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        {searchLoading && showResults ? (
          <p className="mt-2 text-xs text-night-500">Searching…</p>
        ) : null}
        {showResults && !searchLoading && filteredCandidates.length === 0 ? (
          <p className="mt-2 text-xs text-night-500">No matching accounts found.</p>
        ) : null}
        {showResults && filteredCandidates.length > 0 ? (
          <ul className="mt-2 space-y-1 rounded-xl bg-white p-2 ring-1 ring-night-900/10">
            {filteredCandidates.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => addMember({ userId: member.id, label: member.name })}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-sand-50"
                >
                  <span>
                    <span className="block text-sm font-medium text-night-900">{member.name}</span>
                    <span className="block text-xs text-night-500">{member.email}</span>
                  </span>
                  <span className="text-xs font-semibold text-night-700">Add</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
