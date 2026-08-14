"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSafeNextPath } from "@/components/auth/AuthPageShell";
import { Button, Card } from "@/components/ui";
import type { SignupGroupOption } from "@/lib/group-types";
import { campuses } from "@/lib/site";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-night-800">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const resetSuccess = searchParams.get("reset") === "1";
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Sign in failed.");
      return;
    }

    await refresh();
    router.push(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">Sign in</h2>
      <p className="mt-1 text-sm text-night-600">
        Use the email and password from your member account.
      </p>

      {resetSuccess && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Password updated. Sign in with your new password.
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field id="sign-in-email" label="Email">
          <input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className={inputClassName}
          />
        </Field>

        <Field id="sign-in-password" label="Password">
          <input
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            required
            className={inputClassName}
          />
        </Field>

        <p className="text-right text-sm">
          <Link href="/forgot-password" className="font-semibold text-night-800 hover:underline">
            Forgot password?
          </Link>
        </p>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className={`w-full ${loading ? "opacity-70" : ""}`}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-night-600">
        Need an account?{" "}
        <Link
          href={`/sign-up?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-night-900 hover:underline"
        >
          Create your profile
        </Link>
      </p>
    </Card>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const { refresh } = useAuth();
  const [step, setStep] = useState<"account" | "ministries" | "confirm">("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [campusId, setCampusId] = useState("colorado");
  const [ministryOptions, setMinistryOptions] = useState<SignupGroupOption[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/groups/signup-options")
      .then((response) => response.json())
      .then((data) => setMinistryOptions(data.groups ?? []))
      .catch(() => setMinistryOptions([]));
  }, []);

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  function continueToMinistries(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStep("ministries");
  }

  async function submitSignup() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        name,
        email,
        phone,
        password,
        campusId,
        groupIds: selectedGroupIds,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Sign up failed.");
      return;
    }

    await refresh();
    router.push(nextPath);
    router.refresh();
  }

  const selectedGroups = ministryOptions.filter((group) =>
    selectedGroupIds.includes(group.id),
  );
  const pendingGroups = selectedGroups.filter((group) => group.requiresApproval);
  const instantGroups = selectedGroups.filter((group) => !group.requiresApproval);

  if (step === "ministries") {
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-night-900">
          Your ministries
        </h2>
        <p className="mt-1 text-sm text-night-600">
          Select the groups you belong to. Leadership groups require admin approval before
          you receive access.
        </p>

        <div className="mt-6 space-y-3">
          {ministryOptions.map((group) => (
            <label
              key={group.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-night-900/10 bg-sand-50 p-4"
            >
              <input
                type="checkbox"
                checked={selectedGroupIds.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
                className="mt-1"
              />
              <span>
                <span className="font-semibold text-night-900">{group.name}</span>
                {group.requiresApproval && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    Approval required
                  </span>
                )}
                <span className="mt-1 block text-sm text-night-600">{group.description}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setStep("account")}>
            Back
          </Button>
          <Button onClick={() => setStep("confirm")}>Review selections</Button>
        </div>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-night-900">
          Confirm your profile
        </h2>
        <p className="mt-1 text-sm text-night-600">
          Check your details before creating your account.
        </p>

        <div className="mt-6 space-y-4 text-sm text-night-700">
          <p>
            <strong>Name:</strong> {name}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Campus:</strong>{" "}
            {campuses.find((campus) => campus.id === campusId)?.name ?? campusId}
          </p>
          {selectedGroups.length === 0 ? (
            <p>
              <strong>Ministries:</strong> None selected — you can join groups later from
              the Groups page.
            </p>
          ) : (
            <>
              {instantGroups.length > 0 && (
                <div>
                  <strong>Joining now:</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {instantGroups.map((group) => (
                      <li key={group.id}>{group.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pendingGroups.length > 0 && (
                <div>
                  <strong>Pending approval:</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {pendingGroups.map((group) => (
                      <li key={group.id}>{group.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setStep("ministries")}>
            Back
          </Button>
          <Button onClick={submitSignup} className={loading ? "opacity-70" : ""}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">
        Create your profile
      </h2>
      <p className="mt-1 text-sm text-night-600">
        Step 1 of 3 — account details. Next you&apos;ll choose your ministries.
      </p>

      <form onSubmit={continueToMinistries} className="mt-6 space-y-4">
        <Field id="sign-up-name" label="Full name">
          <input
            id="sign-up-name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            className={inputClassName}
          />
        </Field>

        <Field id="sign-up-email" label="Email">
          <input
            id="sign-up-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className={inputClassName}
          />
        </Field>

        <Field id="sign-up-phone" label="Phone (optional)">
          <input
            id="sign-up-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="720-555-0100"
            className={inputClassName}
          />
        </Field>

        <Field id="sign-up-campus" label="Your campus">
          <select
            id="sign-up-campus"
            value={campusId}
            onChange={(event) => setCampusId(event.target.value)}
            className={inputClassName}
          >
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name} · {campus.city}
              </option>
            ))}
          </select>
        </Field>

        <Field id="sign-up-password" label="Password">
          <input
            id="sign-up-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
            className={inputClassName}
          />
        </Field>

        <Field id="sign-up-confirm" label="Confirm password">
          <input
            id="sign-up-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter password"
            minLength={6}
            required
            className={inputClassName}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className="w-full">
          Continue to ministries
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-night-600">
        Already registered?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-night-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not send reset email.");
      return;
    }

    setMessage(data.message ?? "If an account exists for that email, we sent instructions.");
    if (data.devResetUrl) {
      setDevResetUrl(data.devResetUrl);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">Forgot password</h2>
      <p className="mt-1 text-sm text-night-600">
        Enter your member email and we&apos;ll send a reset link if an account exists.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field id="forgot-email" label="Email">
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className={inputClassName}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
        )}
        {devResetUrl && (
          <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">
            Dev reset link:{" "}
            <Link href={devResetUrl} className="font-semibold underline">
              Reset password
            </Link>
          </p>
        )}

        <Button type="submit" className={`w-full ${loading ? "opacity-70" : ""}`}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-night-600">
        <Link href="/sign-in" className="font-semibold text-night-900 hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }

    router.push("/sign-in?reset=1");
    router.refresh();
  }

  if (!token) {
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-night-900">Invalid link</h2>
        <p className="mt-2 text-sm text-night-600">
          This password reset link is missing or expired. Request a new one.
        </p>
        <Button href="/forgot-password" className="mt-4">
          Request reset link
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">Choose a new password</h2>
      <p className="mt-1 text-sm text-night-600">Use at least 8 characters.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field id="reset-password" label="New password">
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className={inputClassName}
          />
        </Field>

        <Field id="reset-confirm" label="Confirm new password">
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
            className={inputClassName}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className={`w-full ${loading ? "opacity-70" : ""}`}>
          {loading ? "Saving..." : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
