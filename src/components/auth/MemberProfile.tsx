"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApp } from "@/components/app/AppProvider";
import { LeaderPromotionPanel } from "@/components/auth/LeaderPromotionPanel";
import { ProfileAvatarUpload } from "@/components/auth/ProfileAvatarUpload";
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
  const { user, activity, loading, signOut, setUser } = useAuth();
  const { setCampusId } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof relationships)[number]["value"]>("child");
  const [birthYear, setBirthYear] = useState("");

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
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_family",
        name: memberName,
        relationship,
        birthYear,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data.user);
      setMemberName("");
      setBirthYear("");
      setMessage(`${memberName} added to your family.`);
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

      <div className="mb-6 flex flex-wrap gap-3">
        <Button href="/messages">Messages</Button>
        {user.role === "leader" && (
          <Button href="/admin/devotions" variant="secondary">
            Write devotions
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PushNotificationSettings />
          <LeaderPromotionPanel />
          <Card>
            <ProfileAvatarUpload user={user} onUpdated={setUser} />
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold text-night-900">
              Profile
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
              <input
                value={user.email}
                disabled
                className="rounded-xl border border-night-900/10 bg-sand-100 px-3 py-2.5 text-sm text-night-500"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
              <input
                value={campus.name}
                disabled
                className="rounded-xl border border-night-900/10 bg-sand-100 px-3 py-2.5 text-sm text-night-500"
              />
            </div>
            {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
            <Button className="mt-4" onClick={saveProfile}>
              Save profile
            </Button>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold text-night-900">
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
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-semibold text-night-900">
              Quick links
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/check-in" className="font-medium text-night-800 hover:underline">
                  Kids check-in →
                </a>
              </li>
              <li>
                <a href="/give" className="font-medium text-night-800 hover:underline">
                  Give →
                </a>
              </li>
              <li>
                <a href="/community" className="font-medium text-night-800 hover:underline">
                  Community →
                </a>
              </li>
              <li>
                <a href="/calendar" className="font-medium text-night-800 hover:underline">
                  Calendars →
                </a>
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold text-night-900">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-night-500">No activity yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-night-600">
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

          <Card className="bg-night-900 text-sand-50">
            <h2 className="font-display text-lg font-semibold">Coming soon</h2>
            <ul className="mt-3 space-y-2 text-sm text-sand-200/90">
              <li>• Giving history</li>
              <li>• Sermon watch history</li>
              <li>• Volunteer hours</li>
              <li>• Event RSVPs</li>
            </ul>
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
