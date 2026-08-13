"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import type { Devotion } from "@/lib/types";

const emptyForm = {
  title: "",
  verse: "",
  reference: "",
  content: "",
  prayer: "",
  date: "",
  readingTime: "",
  published: true,
};

export function DevotionAdminPanel() {
  const { user, loading } = useAuth();
  const [pin, setPin] = useState("");
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadDevotions() {
    if (!user) return;
    const query = pin ? `?all=1&pin=${encodeURIComponent(pin)}` : "?all=1";
    const response = await fetch(`/api/devotions${query}`);
    const data = await response.json();
    if (response.ok) {
      setDevotions(data.devotions ?? []);
      setStatus("");
    } else {
      setStatus(data.error ?? "Could not load devotions.");
    }
  }

  useEffect(() => {
    if (user) {
      loadDevotions();
    }
  }, [user, pin]);

  function startEdit(devotion: Devotion) {
    setEditingId(devotion.id);
    setForm({
      title: devotion.title,
      verse: devotion.verse,
      reference: devotion.reference,
      content: devotion.content,
      prayer: devotion.prayer,
      date: devotion.date,
      readingTime: devotion.readingTime,
      published: devotion.published !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveDevotion() {
    setBusy(true);
    setStatus("");
    const payload = { ...form, pin };
    const response = await fetch("/api/devotions", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not save devotion.");
      return;
    }

    setStatus(editingId ? "Devotion updated." : "Devotion published.");
    resetForm();
    await loadDevotions();
  }

  async function removeDevotion(id: string) {
    if (!window.confirm("Delete this devotion?")) return;
    setBusy(true);
    const response = await fetch("/api/devotions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pin }),
    });
    setBusy(false);
    if (response.ok) {
      setStatus("Devotion deleted.");
      await loadDevotions();
    }
  }

  if (loading) {
    return <Card>Loading account...</Card>;
  }

  if (!user) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Leader sign-in required
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Sign in with your Shanah City account, then enter the leader PIN to write
          devotions.
        </p>
        <Button href="/sign-in" className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Leader access
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Signed in as <strong>{user.name}</strong>
          {user.role === "leader" ? " · Leader account" : " · Enter leader PIN below"}
        </p>
        {user.role !== "leader" && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-night-800">Leader PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter leader PIN"
              className="mt-2 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <Button className="mt-3" variant="secondary" onClick={loadDevotions}>
              Unlock editor
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-night-900">
              {editingId ? "Edit devotion" : "Write a devotion"}
            </h2>
            <p className="mt-1 text-sm text-night-600">
              Mobile-friendly editor for pastors and leaders.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-night-600 hover:text-night-900"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {[
            ["title", "Title", "text"],
            ["reference", "Scripture reference", "text"],
            ["date", "Display date", "text"],
            ["readingTime", "Reading time", "text"],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="text-sm font-semibold text-night-800">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form] as string}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </div>
          ))}

          {[
            ["verse", "Verse"],
            ["content", "Reflection"],
            ["prayer", "Prayer"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-semibold text-night-800">{label}</label>
              <textarea
                value={form[key as keyof typeof form] as string}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                rows={key === "content" ? 5 : 3}
                className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm font-medium text-night-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({ ...current, published: event.target.checked }))
              }
            />
            Publish to app and website
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={saveDevotion}>{busy ? "Saving..." : editingId ? "Update" : "Publish"}</Button>
          <Button href="/devotions" variant="secondary">
            View devotions
          </Button>
        </div>

        {status && (
          <p className="mt-4 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">
            {status}
          </p>
        )}
      </Card>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-night-900">
          Published devotions
        </h3>
        <div className="space-y-3">
          {devotions.map((devotion) => (
            <Card key={devotion.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-night-500">
                    {devotion.date}
                    {devotion.published === false ? " · Draft" : ""}
                  </p>
                  <h4 className="mt-1 font-display text-lg font-semibold text-night-900">
                    {devotion.title}
                  </h4>
                  <p className="mt-1 text-sm text-night-600">
                    {devotion.authorName ?? "Leader"} · {devotion.reference}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(devotion)}
                    className="rounded-lg bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDevotion(devotion.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {devotions.length === 0 && (
            <Card>
              <p className="text-sm text-night-600">
                No devotions loaded yet. Sign in, enter the leader PIN if needed, then
                tap <strong>Unlock editor</strong>.
              </p>
            </Card>
          )}
        </div>
      </section>

      <p className="text-center text-xs text-night-500">
        Need permanent leader access without a PIN? Ask admin to set{" "}
        <code className="rounded bg-white px-1">role: &quot;leader&quot;</code> on your
        account in <Link href="/profile" className="font-semibold underline">Profile</Link>.
      </p>
    </div>
  );
}
