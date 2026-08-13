"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { shopProducts } from "@/lib/site";
import type { ShopProduct } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

const categories = ["All", ...new Set(shopProducts.map((p) => p.category))];

function ProductCard({ product }: { product: ShopProduct }) {
  const { addToCart } = useApp();
  const [added, setAdded] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="text-4xl">{product.image}</span>
        {product.badge && <Badge>{product.badge}</Badge>}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-night-500">
        {product.category}
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-night-900">
        {product.name}
      </h3>
      <p className="mt-2 text-sm text-night-600">{product.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-bold text-night-900">${product.price}</p>
        <Button
          variant={added ? "secondary" : "primary"}
          onClick={() => {
            addToCart(product);
            setAdded(true);
          }}
        >
          {added ? "Added ✓" : "Add to cart"}
        </Button>
      </div>
    </Card>
  );
}

export function ShopGrid() {
  const [category, setCategory] = useState("All");
  const { cart, removeFromCart } = useApp();

  const filtered = useMemo(
    () =>
      category === "All"
        ? shopProducts
        : shopProducts.filter((product) => product.category === category),
    [category],
  );

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              category === item
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <h3 className="font-semibold text-night-900">
            Cart ({cart.length} items) · ${total.toFixed(2)}
          </h3>
          <ul className="mt-3 space-y-2">
            {cart.map((item) => (
              <li
                key={`${item.id}-${item.name}`}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.image} {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-4">Checkout (Stripe ready)</Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
