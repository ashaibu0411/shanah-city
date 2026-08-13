"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSafeNextPath } from "@/components/auth/AuthPageShell";
import { Button, Card } from "@/components/ui";
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
  const { setUser } = useAuth();
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

    setUser(data.user);
    router.push(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">Sign in</h2>
      <p className="mt-1 text-sm text-night-600">
        Use the email and password from your member account.
      </p>

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
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [campusId, setCampusId] = useState("colorado");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

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
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Sign up failed.");
      return;
    }

    setUser(data.user);
    router.push(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">
        Create your profile
      </h2>
      <p className="mt-1 text-sm text-night-600">
        Set up your member account in about a minute. You can add family members on
        your profile after signing up.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
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

        <Button type="submit" className={`w-full ${loading ? "opacity-70" : ""}`}>
          {loading ? "Creating account..." : "Create account & go to profile"}
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
