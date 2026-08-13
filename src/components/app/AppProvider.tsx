"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { campuses, getCampus } from "@/lib/site";
import type { ShopProduct } from "@/lib/types";

type AppContextValue = {
  campusId: string;
  setCampusId: (id: string) => void;
  campus: (typeof campuses)[number];
  cart: ShopProduct[];
  addToCart: (product: ShopProduct) => void;
  removeFromCart: (productId: string) => void;
  cartCount: number;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [campusId, setCampusId] = useState("colorado");
  const [cart, setCart] = useState<ShopProduct[]>([]);

  const value = useMemo<AppContextValue>(
    () => ({
      campusId,
      setCampusId,
      campus: getCampus(campusId),
      cart,
      addToCart: (product) =>
        setCart((items) => [...items, product]),
      removeFromCart: (productId) =>
        setCart((items) => items.filter((item) => item.id !== productId)),
      cartCount: cart.length,
    }),
    [campusId, cart],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
