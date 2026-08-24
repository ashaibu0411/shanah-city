"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { useApp } from "@/components/app/AppProvider";
import { DeleteAccountPanel } from "@/components/auth/DeleteAccountPanel";
import { MemberGivingHistory } from "@/components/give/MemberGivingHistory";
import { ProfileAvatarUpload } from "@/components/auth/ProfileAvatarUpload";
import { MemberEventRsvps } from "@/components/calendar/MemberEventRsvps";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { Button, Card, PageHeader } from "@/components/ui";
import { campuses, getCampus, site } from "@/lib/site";

const relationships = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
] as const;

export function MemberProfile() {
  const router = useRouter();
  const { isMobileApp } = useAppShell();
  const { user, activity, loading, signOut, setUser, permissions } = useAuth();
  const { setCampusId } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof relationships)[number]["value"]>("child");
  const [birthYear, setBirthYear] = useState("");
  const [childAllergies, setChildAllergies] = useState("");
  const [childMedicalNotes, setChildMedicalNotes] = useState("");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      setCampusId(user.campusId);
    }
  }, [user, loading, router, setCampusId]);

  if (loading || !user) {
    return <p className="text-night-600">Loading your profile...</p>;
  }

  const campus = getCampus(user.campusId);

  async function saveProfile() {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, campusId: user!.campusId }),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data.user);
      setMessage("Profile updated.");
    }
  }

  async function addFamilyMember() {
    if (!memberName.trim()) return;
    const payload: Record<string, unknown> = {
      action: "add_family",
      name: memberName,
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
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data.user);
      setMemberName("");
      setBirthYear("");
      setChildAllergies("");
      setChildMedicalNotes("");
      setPickupName("");
      setPickupPhone("");
      setMessage(`${memberName} added to your family.`);
    }
  }

  async function saveFamilyMember(memberId: string) {
    const member = user!.family.find((entry) => entry.id === memberId);
    if (!member) return;
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
          : member.authorizedPickup,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data.user);
      setEditingMemberId(null);
      setChildAllergies("");
      setChildMedicalNotes("");
      setPickupName("");
      setPickupPhone("");
      setMessage("Family member updated.");
    }
  }

  async function removeMember(memberId: string) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_family", memberId }),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data.user);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Your Shanah City member profile, family tree, and activity."
      />

      <div className={`${isMobileApp ? "mb-3 gap-2" : "mb-6 gap-3"} flex flex-wrap`}>
        <Button href="/messages" className={isMobileApp ? "!px-3 !py-2 text-xs" : ""}>
          Messages
        </Button>
        {permissions.canManageAdmin && (
          <Button href="/admin/people" variant="secondary" className={isMobileApp ? "!px-3 !py-2 text-xs" : ""}>
            Member directory
          </Button>
        )}
        {permissions.canManageAdmin && (
          <Button href="/admin/approvals" variant="secondary">
            Admin approvals
          </Button>
        )}
        {permissions.canManageAdmin && (
          <Button href="/admin/giving" variant="secondary">
            Giving records
          </Button>
        )}
        {permissions.canAccessFinance && (
          <Button href="/admin/finance" variant="secondary">
            Weekly count
          </Button>
        )}
        {permissions.canAccessWorshipPlanner && (
          <Button href="/worship" variant="secondary">
            Worship planner
          </Button>
        )}
        {permissions.canAccessKidsMinistry && (
          <Button href="/kids-ministry" variant="secondary">
            Kids ministry
          </Button>
        )}
        {permissions.canWriteDevotions && (
          <Button href="/admin/devotions" variant="secondary">
            Write devotions
          </Button>
        )}
      </div>

      <div className={`grid ${isMobileApp ? "gap-3" : "gap-6 lg:grid-cols-3"}`}>
        <div className={`${isMobileApp ? "space-y-3" : "space-y-6 lg:col-span-2"}`}>
          <MemberGivingHistory />
          <PushNotificationSettings />
          <Card>
            <ProfileAvatarUpload user={user} onUpdated={setUser} />
          </Card>
          <Card className={isMobileApp ? "!p-3.5" : ""}>
            <h2 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-xl"}`}>
              Profile
            </h2>
            <div className={`mt-3 grid gap-2.5 ${isMobileApp ? "grid-cols-1" : "sm:grid-cols-2"}`}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
              <input
                value={user.email}
                disabled
                className="rounded-xl border border-night-900/10 bg-sand-100 px-3 py-2 text-sm text-night-500"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
              <input
                value={campus.name}
                disabled
                className="rounded-xl border border-night-900/10 bg-sand-100 px-3 py-2 text-sm text-night-500"
              />
            </div>
            {message && <p className="mt-2.5 text-sm text-emerald-700">{message}</p>}
            <Button className="mt-3" onClick={saveProfile}>
              Save profile
            </Button>
          </Card>

          <Card className={isMobileApp ? "!p-3.5" : ""}>
            <h2 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-xl"}`}>
              Family tree
            </h2>
            <p className="mt-1 text-sm text-night-600">
              Add household members for faster kids check-in and family updates.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
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
                placeholder="Birth year (optional)"
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
            <Button className="mt-3" variant="secondary" onClick={addFamilyMember}>
              Add family member
            </Button>

            {user.family.length === 0 ? (
              <p className="mt-4 text-sm text-night-500">No family members added yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {user.family.map((member) => (
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
                      {member.relationship === "child" && member.allergies && (
                        <p className="text-amber-700">Allergy: {member.allergies}</p>
                      )}
                      {member.relationship === "child" && member.medicalNotes && (
                        <p className="text-red-700">Medical: {member.medicalNotes}</p>
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
                        >
                          Edit
                        </button>
                      )}
                      <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:underline"
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
                  <Button onClick={() => saveFamilyMember(editingMemberId)}>Save child info</Button>
                  <Button variant="secondary" onClick={() => setEditingMemberId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <DeleteAccountPanel />
        </div>

        <div className={isMobileApp ? "space-y-3" : "space-y-6"}>
          <Card className={isMobileApp ? "!p-3.5" : ""}>
            <h2 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-lg"}`}>
              Quick links
            </h2>
            <ul className={`mt-2.5 text-sm ${isMobileApp ? "divide-y divide-night-900/5" : "space-y-2"}`}>
              <li className={isMobileApp ? "py-2" : ""}>
                <a href="/check-in" className="font-medium text-night-800 hover:underline">
                  Kids check-in →
                </a>
              </li>
              {permissions.canAccessKidsMinistry && (
                <li className={isMobileApp ? "py-2" : ""}>
                  <a href="/kids-ministry" className="font-medium text-night-800 hover:underline">
                    Kids ministry dashboard →
                  </a>
                </li>
              )}
              <li className={isMobileApp ? "py-2" : ""}>
                <a href="/give" className="font-medium text-night-800 hover:underline">
                  Give →
                </a>
              </li>
              <li className={isMobileApp ? "py-2" : ""}>
                <a href="/community" className="font-medium text-night-800 hover:underline">
                  Community →
                </a>
              </li>
              <li className={isMobileApp ? "py-2" : ""}>
                <a href="/calendar" className="font-medium text-night-800 hover:underline">
                  Calendars →
                </a>
              </li>
            </ul>
          </Card>

          <Card className={isMobileApp ? "!p-3.5" : ""}>
            <h2 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-lg"}`}>
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className={`text-sm text-night-500 ${isMobileApp ? "mt-2" : "mt-3"}`}>No activity yet.</p>
            ) : (
              <ul className={`text-sm text-night-600 ${isMobileApp ? "mt-2 divide-y divide-night-900/5" : "mt-3 space-y-2"}`}>
                {activity.map((item) => (
                  <li key={item.id} className="rounded-lg bg-sand-50 px-3 py-2">
                    {item.label}
                    <span className="block text-xs text-night-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <MemberEventRsvps />

          <Card className="bg-night-900 text-sand-50">
            <h2 className="font-display text-lg font-semibold">Member tools</h2>
            <ul className="mt-3 space-y-2 text-sm text-sand-200/90">
              <li>• Giving history on your profile</li>
              <li>• Sermon watch history</li>
              <li>• Volunteer hours</li>
            </ul>
            {permissions.canManageAdmin && (
              <p className="mt-3 text-sm text-sand-200">
                Admins can record gifts under{" "}
                <a href="/admin/giving" className="font-semibold underline">
                  Giving records
                </a>
                .
              </p>
            )}
            <p className="mt-3 text-xs text-sand-400">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-sm text-night-500">
        Questions? Contact {site.email}
      </p>
    </>
  );
}
