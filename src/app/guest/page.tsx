import { GuestCaptureForm } from "@/components/guest/GuestCaptureForm";
import { PageHeader } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest connect",
  description: "Connect with Shanah City — no account required.",
};

export default function GuestPage() {
  return (
    <>
      <PageHeader
        eyebrow="Welcome"
        title="We're glad you're here"
        description="Share your info with our welcome team. No sign-in or account needed."
      />
      <GuestCaptureForm />
    </>
  );
}
