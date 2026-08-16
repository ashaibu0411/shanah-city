import { Button, PageHeader } from "@/components/ui";

export default function GiveCancelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Checkout canceled"
        description="No payment was made. You can try again whenever you are ready."
      />
      <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
        <div className="flex flex-wrap gap-3">
          <Button href="/give">Try again</Button>
          <Button href="/" variant="secondary">
            Home
          </Button>
        </div>
      </div>
    </>
  );
}
