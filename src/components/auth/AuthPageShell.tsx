"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const memberBenefits = [
  "Your profile and campus (Aurora, Accra, or Online)",
  "Download photos from the church gallery",
  "Daily devotions and member messages",
  "Prayer wall, check-in, and push notifications",
];

type AuthPageShellProps = {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
};

export function AuthPageShell({ mode, children }: AuthPageShellProps) {
  return (
    <div className="auth-page-shell mx-auto w-full max-w-4xl py-4 lg:py-10">
      <div className="auth-page-grid grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-8">
        <section className="rounded-3xl bg-gradient-to-br from-night-950 to-night-800 p-6 text-white shadow-lg lg:p-8">
          <Image
            src="/shanah-city-logo.png"
            alt="Shanah City"
            width={160}
            height={80}
            className="h-16 w-auto object-contain brightness-0 invert"
            priority
          />
          <h1 className="mt-6 font-display text-3xl font-semibold">
            {mode === "sign-up" ? "Join Shanah City" : "Welcome back"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            {mode === "sign-up"
              ? "Create your free member account to connect with worship, devotions, photos, and community."
              : "Sign in to your member profile, messages, photo downloads, and more."}
          </p>

          <ul className="mt-6 space-y-3 text-sm text-white/90">
            {memberBenefits.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-sand-300">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-white/60">
            By creating an account you agree to use church content respectfully. Photo
            downloads require agreement to the gallery policy.
          </p>
        </section>

        <section>{children}</section>
      </div>

      <p className="mt-8 text-center text-sm text-night-500">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-night-900 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Shanah City?{" "}
            <Link href="/sign-up" className="font-semibold text-night-900 hover:underline">
              Create your profile
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/profile";
  }
  return next;
}
