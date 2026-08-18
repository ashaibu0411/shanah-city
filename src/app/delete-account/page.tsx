import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata = {
  title: "Delete Account",
  description: `How to delete your ${site.name} member account and associated data.`,
};

export default function DeleteAccountPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Delete your account"
        description={`How ${site.name} members can permanently delete an account and related personal data.`}
      />

      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-night-900/5">
          <h2 className="font-display text-xl font-semibold text-night-900">
            Option 1 — In the app (recommended)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-night-700">
            <li>Sign in to the Shanah City app or website.</li>
            <li>
              Open <strong>More → Profile</strong> (or go to{" "}
              <Link href="/profile" className="font-semibold text-night-900 underline">
                /profile
              </Link>
              ).
            </li>
            <li>Scroll to <strong>Delete account</strong>.</li>
            <li>
              Type <strong>DELETE</strong>, enter your password, and confirm permanent deletion.
            </li>
          </ol>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-night-900/5">
          <h2 className="font-display text-xl font-semibold text-night-900">
            Option 2 — Email request
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-night-700">
            If you cannot sign in, email{" "}
            <a href={`mailto:${site.email}`} className="font-semibold underline">
              {site.email}
            </a>{" "}
            from the address on your account with the subject <strong>Delete my account</strong>.
            Include your full name and the email you used to register. We will verify ownership and
            delete your account within a reasonable time (typically within 30 days).
          </p>
        </section>

        <section className="rounded-2xl bg-sand-100 p-6 ring-1 ring-night-900/5">
          <h2 className="font-display text-xl font-semibold text-night-900">What is deleted</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-night-700">
            <li>Your profile, phone number, campus, and family members on your account</li>
            <li>Private messages and notification settings</li>
            <li>Group memberships and pending ministry requests</li>
            <li>Profile photo and gallery photos you uploaded</li>
            <li>Sign-in sessions and push notification subscriptions</li>
          </ul>
          <p className="mt-3 text-sm text-night-600">
            Some community posts may remain visible under the name you used when posting. Email us if
            you need specific content removed.
          </p>
        </section>

        <p className="text-sm text-night-500">
          See also our{" "}
          <Link href="/privacy" className="font-semibold text-night-800 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </>
  );
}
