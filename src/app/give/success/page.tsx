import Link from "next/link";
import { Button, PageHeader } from "@/components/ui";

export default function GiveSuccessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Thank you"
        description="Your gift helps Shanah City proclaim the gospel and serve our community."
      />
      <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
        <p className="text-night-700">
          Your payment was submitted successfully. If you signed in before giving, your gift will
          appear on your profile shortly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/profile">View profile</Button>
          <Button href="/give" variant="secondary">
            Back to giving
          </Button>
          <Link href="/" className="self-center text-sm font-semibold text-night-700 underline">
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
