import { ShopGrid } from "@/components/shop/ShopGrid";
import { PageHeader } from "@/components/ui";

export default function ShopPage() {
  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Church Shop"
        description="Merch, books, music, and event passes — support the mission while representing Shanah City."
      />
      <ShopGrid />
    </>
  );
}
