import Link from "next/link";
import { Button, PageHeader } from "@/components/ui";

export default function ShopSuccessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Thank you"
        description="Your order helps support Shanah City ministry and merch."
      />
      <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
        <p className="text-night-700">
          Your payment was submitted successfully. We will follow up about pickup or shipping
          details if needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/shop">Back to shop</Button>
          <Link href="/" className="self-center text-sm font-semibold text-night-700 underline">
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
