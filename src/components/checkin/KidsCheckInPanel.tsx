"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { KidCheckIn } from "@/lib/member-types";
import {
  KidCheckInLabel,
  printKidCheckInLabel,
  printKidClothingLabel,
  printKidCheckInLabels,
} from "@/components/checkin/KidCheckInLabel";
import { Button, Card } from "@/components/ui";

import { KIDS_AGE_GROUPS, KIDS_SERVICES } from "@/lib/kids-types";

const ageGroups = [...KIDS_AGE_GROUPS];
const services = [...KIDS_SERVICES];

export function KidsCheckInPanel({ kiosk = false }: { kiosk?: boolean }) {
  const { user } = useAuth();
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>(ageGroups[0]);
  const [service, setService] = useState<string>(services[1]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<KidCheckIn[]>([]);
  const [lastLabel, setLastLabel] = useState<KidCheckIn | null>(null);
  const [checkoutTargetId, setCheckoutTargetId] = useState<string | null>(null);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activeServiceCount, setActiveServiceCount] = useState(0);

  const fieldClass = kiosk
    ? "rounded-2xl border border-night-900/10 bg-sand-50 px-4 py-3.5 text-lg outline-none ring-night-900/5 focus:ring-2"
    : "rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2";

  async function loadActive() {
    const response = await fetch("/api/checkin/kids");
    const data = await response.json();
    const open = data.checkins.filter((entry: KidCheckIn) => !entry.checkedOutAt);
    setActiveServiceCount(open.filter((entry: KidCheckIn) => entry.service === service).length);
    setActive(kiosk ? [] : open.slice(0, 10));
  }

  useEffect(() => {
    if (user) {
      setParentName(user.name);
    }
  }, [user]);

  const familyChildren = user?.family.filter((member) => member.relationship === "child") ?? [];

  function selectFamilyChild(memberId: string) {
    setFamilyMemberId(memberId);
    const member = familyChildren.find((entry) => entry.id === memberId);
    if (member) {
      setChildName(member.name);
    }
  }

  useEffect(() => {
    loadActive();
  }, []);

  useEffect(() => {
    loadActive();
  }, [service]);

  async function checkIn() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/checkin/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentName,
        childName,
        ageGroup,
        service,
        notes,
        familyMemberId: familyMemberId || undefined,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      if (response.status === 409 && data.checkin) {
        setLastLabel(data.checkin as KidCheckIn);
      }
      setError(data.error ?? "Check-in failed.");
      return;
    }

    const checkedName = data.checkin.childName as string;
    setLastLabel(data.checkin);
    setMessage(
      kiosk
        ? `${checkedName} checked in. Printing parent and clothing labels…`
        : `${checkedName} checked in. Print labels below — parent keeps the security code; stick the small label on the child's shirt.`,
    );
    setChildName("");
    setFamilyMemberId("");
    setNotes("");
    loadActive();

    window.setTimeout(() => printKidCheckInLabels(data.checkin), 300);
  }

  async function checkOut(id: string) {
    if (!checkoutCode.trim()) {
      setCheckoutError("Enter the pickup security code from your label.");
      return;
    }

    setLoading(true);
    setCheckoutError(null);
    const response = await fetch("/api/checkin/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout", id, securityCode: checkoutCode.trim() }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setCheckoutError(data.error ?? "Check-out failed.");
      return;
    }

    if (lastLabel?.id === id) {
      setLastLabel(null);
    }
    setCheckoutTargetId(null);
    setCheckoutCode("");
    setMessage(`${data.checkin.childName} checked out successfully.`);
    loadActive();
  }

  return (
    <div className={`space-y-6 ${kiosk ? "check-in-kiosk" : ""}`}>
      {kiosk && (
        <Card className="border-night-900/10 bg-night-900 text-sand-50">
          <p className="text-sm font-semibold uppercase tracking-wider text-sand-300">Station mode</p>
          <p className="mt-1 text-lg font-medium">
            Check in each child, print parent + shirt labels, and keep your security code private.
          </p>
          <p className="mt-2 text-sm text-sand-200">
            {activeServiceCount} children checked in for {service} (names hidden on this screen).
          </p>
        </Card>
      )}

      <Card className={kiosk ? "border-2 border-sand-200 shadow-md" : undefined}>
        <h2 className={`font-display font-semibold text-night-900 ${kiosk ? "text-2xl" : "text-xl"}`}>
          Kids check-in
        </h2>
        <p className={`mt-2 text-night-600 ${kiosk ? "text-base" : "text-sm"}`}>
          {kiosk
            ? "Greeter station — tap fields, check in, and labels print to the Brother printer."
            : "Check your child in for Friday or Sunday service. Parent and clothing labels include a pickup security code."}
        </p>

        {!kiosk && (
          <p className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-xs text-night-700">
            Safety: children are released only with the matching security code. Add allergies and authorized
            pickup contacts under Profile → Family.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
            placeholder="Parent / guardian name"
            className={fieldClass}
          />
          {familyChildren.length > 0 ? (
            <select
              value={familyMemberId}
              onChange={(event) => selectFamilyChild(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select child from family</option>
              {familyChildren.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={childName}
              onChange={(event) => setChildName(event.target.value)}
              placeholder="Child's name"
              className={fieldClass}
            />
          )}
          {familyChildren.length > 0 && (
            <input
              value={childName}
              onChange={(event) => {
                setChildName(event.target.value);
                setFamilyMemberId("");
              }}
              placeholder="Or type child's name"
              className={`${fieldClass} sm:col-span-2`}
            />
          )}
          <select
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value)}
            className={fieldClass}
          >
            {ageGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            value={service}
            onChange={(event) => setService(event.target.value)}
            className={fieldClass}
          >
            {services.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Allergies or notes (optional)"
          className={`mt-3 w-full ${fieldClass}`}
          rows={kiosk ? 3 : 2}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button
          className={`mt-4 ${kiosk ? "min-h-14 w-full text-lg" : ""}`}
          onClick={checkIn}
          disabled={loading || !parentName.trim() || !childName.trim()}
        >
          {loading ? "Checking in..." : kiosk ? "Check in & print labels" : "Check in & print labels"}
        </Button>
      </Card>

      {lastLabel && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-night-900">
                Check-in labels
              </h3>
              <p className="text-sm text-night-600">
                Parent tag + shirt sticker for {lastLabel.childName}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => printKidCheckInLabel(lastLabel)}>
                Print parent
              </Button>
              <Button variant="secondary" onClick={() => printKidClothingLabel(lastLabel)}>
                Print shirt
              </Button>
              <Button variant="secondary" onClick={() => printKidCheckInLabels(lastLabel)}>
                Print both
              </Button>
            </div>
          </div>
          <KidCheckInLabel checkIn={lastLabel} />
        </Card>
      )}

      {!kiosk && (
      <Card>
        <h3 className="font-semibold text-night-900">Currently checked in</h3>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No active check-ins right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-night-900">{entry.childName}</p>
                  <p className="text-night-500">
                    {entry.ageGroup} · {entry.service} · Code {entry.securityCode ?? "----"}
                  </p>
                  {entry.allergies && (
                    <p className="text-amber-700">Allergy: {entry.allergies}</p>
                  )}
                  {entry.medicalNotes && (
                    <p className="text-red-700">Medical: {entry.medicalNotes}</p>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setLastLabel(entry);
                        printKidCheckInLabels(entry);
                      }}
                    >
                      Reprint labels
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCheckoutTargetId(entry.id);
                        setCheckoutCode("");
                        setCheckoutError(null);
                      }}
                    >
                      Check out
                    </Button>
                  </div>
                  {checkoutTargetId === entry.id && (
                    <div className="rounded-xl border border-night-900/10 bg-white p-3">
                      <p className="text-xs text-night-600">
                        Enter the security code from your pickup label.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          value={checkoutCode}
                          onChange={(event) => setCheckoutCode(event.target.value)}
                          placeholder="Security code"
                          className="min-w-[120px] flex-1 rounded-lg border border-night-900/10 px-3 py-2 text-sm"
                        />
                        <Button onClick={() => checkOut(entry.id)} disabled={loading}>
                          Verify pickup
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutTargetId(null);
                            setCheckoutCode("");
                            setCheckoutError(null);
                          }}
                          className="text-xs font-semibold text-night-600 underline"
                        >
                          Cancel
                        </button>
                      </div>
                      {checkoutError && (
                        <p className="mt-2 text-xs text-red-700">{checkoutError}</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      )}
    </div>
  );
}
