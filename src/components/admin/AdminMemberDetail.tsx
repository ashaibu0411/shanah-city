"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { campuses, getCampus } from "@/lib/site";
import type { AdminPeopleEntry } from "@/lib/member-types";
import { Button, Card } from "@/components/ui";

const relationships = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
] as const;

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "leader", label: "Leader" },
  { value: "team", label: "Team" },
  { value: "media", label: "Media" },
] as const;

export function AdminMemberDetail({
  person,
  onClose,
  onUpdated,
}: {
  person: AdminPeopleEntry;
  onClose: () => void;
  onUpdated: (person: AdminPeopleEntry) => void;
}) {
  const [name, setName] = useState(person.name);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [campusId, setCampusId] = useState(person.campusId);
  const [role, setRole] = useState(person.role ?? "member");
  const [familyName, setFamilyName] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof relationships)[number]["value"]>("child");
  const [birthYear, setBirthYear] = useState("");
  const [childAllergies, setChildAllergies] = useState("");
  const [childMedicalNotes, setChildMedicalNotes] = useState("");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(person.name);
    setPhone(person.phone ?? "");
    setCampusId(person.campusId);
    setRole(person.role ?? "member");
  }, [person]);

  async function saveProfile() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: person.id, name, phone, campusId, role }),
    });
    const data = await response.json();
    setBusy(false);

    if (response.ok) {
      onUpdated(data.person);
      setMessage("Profile saved.");
    } else {
      setMessage(data.error ?? "Could not save profile.");
    }
  }

  async function addFamilyMember() {
    if (!familyName.trim()) return;
    setBusy(true);
    setMessage(null);
    const payload: Record<string, unknown> = {
      userId: person.id,
      action: "add_family",
      name: familyName,
      relationship,
      birthYear,
    };
    if (relationship === "child") {
      payload.allergies = childAllergies;
      payload.medicalNotes = childMedicalNotes;
      if (pickupName.trim()) {
        payload.authorizedPickup = [
          {
            name: pickupName.trim(),
            phone: pickupPhone.trim() || undefined,
            relationship: "Authorized pickup",
          },
        ];
      }
    }
    const response = await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setBusy(false);

    if (response.ok) {
      onUpdated(data.person);
      setFamilyName("");
      setBirthYear("");
      setChildAllergies("");
      setChildMedicalNotes("");
      setPickupName("");
      setPickupPhone("");
      setMessage("Family member added.");
    } else {
      setMessage(data.error ?? "Could not add family member.");
    }
  }

  async function saveFamilyMember(memberId: string) {
    setBusy(true);
    setMessage(null);
    const member = person.family.find((entry) => entry.id === memberId);
    const response = await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: person.id,
        action: "update_family",
        memberId,
        allergies: childAllergies,
        medicalNotes: childMedicalNotes,
        authorizedPickup: pickupName.trim()
          ? [
              {
                name: pickupName.trim(),
                phone: pickupPhone.trim() || undefined,
                relationship: "Authorized pickup",
              },
            ]
          : member?.authorizedPickup,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (response.ok) {
      onUpdated(data.person);
      setEditingMemberId(null);
      setChildAllergies("");
      setChildMedicalNotes("");
      setPickupName("");
      setPickupPhone("");
      setMessage("Child safety info updated.");
    } else {
      setMessage(data.error ?? "Could not update family member.");
    }
  }

  async function removeFamilyMember(memberId: string) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: person.id,
        action: "remove_family",
        memberId,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (response.ok) {
      onUpdated(data.person);
      setMessage("Family member removed.");
    } else {
      setMessage(data.error ?? "Could not remove family member.");
    }
  }

  const hasPendingGroups = person.groups.some((group) => group.status === "pending");

  return (
    <Card className="border-night-900/15 ring-2 ring-night-900/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
            Member profile
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
            {person.name}
          </h3>
          <p className="text-sm text-night-600">{person.email}</p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="font-semibold text-night-900">Contact & access</h4>
          <div className="mt-3 grid gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Name"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={campusId}
              onChange={(event) => setCampusId(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
              <option value="online">Online</option>
            </select>
            <label className="text-sm text-night-700">
              <span className="font-semibold">Role tier</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button className="mt-4" onClick={saveProfile} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div>
          <h4 className="font-semibold text-night-900">Ministries & groups</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {person.groups.length === 0 ? (
              <p className="text-sm text-night-500">No groups yet.</p>
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
          {hasPendingGroups && (
            <p className="mt-3 text-sm text-night-600">
              Approve pending ministries on{" "}
              <Link href="/admin/approvals" className="font-semibold text-night-900 underline">
                Admin approvals
              </Link>
              .
            </p>
          )}
          <p className="mt-3 text-xs text-night-500">
            Joined {new Date(person.createdAt).toLocaleDateString()} ·{" "}
            {getCampus(person.campusId).name}
          </p>
          <p className="mt-2 text-sm">
            <Link
              href={`/admin/giving?member=${person.id}`}
              className="font-semibold text-night-900 underline"
            >
              View giving records
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-night-900/10 pt-6">
        <h4 className="font-semibold text-night-900">Family tree</h4>
        <p className="mt-1 text-sm text-night-600">
          Household members used for kids check-in and family updates.
        </p>

        {person.family.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No family members on file.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {person.family.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-night-900">{member.name}</p>
                  <p className="text-night-500 capitalize">
                    {member.relationship}
                    {member.birthYear ? ` · born ${member.birthYear}` : ""}
                  </p>
                  {member.notes && (
                    <p className="mt-1 text-xs text-night-500">{member.notes}</p>
                  )}
                  {member.relationship === "child" && member.allergies && (
                    <p className="mt-1 text-amber-700">Allergy: {member.allergies}</p>
                  )}
                  {member.relationship === "child" && member.medicalNotes && (
                    <p className="mt-1 text-red-700">Medical: {member.medicalNotes}</p>
                  )}
                  {member.relationship === "child" &&
                    member.authorizedPickup &&
                    member.authorizedPickup.length > 0 && (
                      <p className="mt-1 text-xs text-night-500">
                        Pickup: {member.authorizedPickup.map((contact) => contact.name).join(", ")}
                      </p>
                    )}
                </div>
                <div className="flex gap-3">
                  {member.relationship === "child" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(member.id);
                        setChildAllergies(member.allergies ?? "");
                        setChildMedicalNotes(member.medicalNotes ?? "");
                        setPickupName(member.authorizedPickup?.[0]?.name ?? "");
                        setPickupPhone(member.authorizedPickup?.[0]?.phone ?? "");
                      }}
                      className="text-night-700 hover:underline"
                      disabled={busy}
                    >
                      Edit safety
                    </button>
                  )}
                  <button
                  type="button"
                  onClick={() => removeFamilyMember(member.id)}
                  className="text-red-600 hover:underline"
                  disabled={busy}
                >
                  Remove
                </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editingMemberId && (
          <div className="mt-4 rounded-xl border border-night-900/10 bg-sand-50 p-4">
            <p className="text-sm font-medium text-night-900">Update child safety info</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={childAllergies}
                onChange={(event) => setChildAllergies(event.target.value)}
                placeholder="Allergies"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
              <input
                value={childMedicalNotes}
                onChange={(event) => setChildMedicalNotes(event.target.value)}
                placeholder="Medical notes"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
              <input
                value={pickupName}
                onChange={(event) => setPickupName(event.target.value)}
                placeholder="Authorized pickup name"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
              <input
                value={pickupPhone}
                onChange={(event) => setPickupPhone(event.target.value)}
                placeholder="Authorized pickup phone"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => saveFamilyMember(editingMemberId)} disabled={busy}>
                Save child info
              </Button>
              <Button variant="secondary" onClick={() => setEditingMemberId(null)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            placeholder="Name"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <select
            value={relationship}
            onChange={(event) =>
              setRelationship(event.target.value as typeof relationship)
            }
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {relationships.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
            placeholder="Birth year"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </div>
        {relationship === "child" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={childAllergies}
              onChange={(event) => setChildAllergies(event.target.value)}
              placeholder="Allergies (optional)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={childMedicalNotes}
              onChange={(event) => setChildMedicalNotes(event.target.value)}
              placeholder="Medical notes (optional)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={pickupName}
              onChange={(event) => setPickupName(event.target.value)}
              placeholder="Authorized pickup name"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={pickupPhone}
              onChange={(event) => setPickupPhone(event.target.value)}
              placeholder="Authorized pickup phone"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </div>
        )}
        <Button className="mt-3" variant="secondary" onClick={addFamilyMember} disabled={busy}>
          Add family member
        </Button>
      </div>

      {message && (
        <p className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </Card>
  );
}
