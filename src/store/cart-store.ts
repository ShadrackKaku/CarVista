"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  partId: string;
  quantity: number;
}

interface CartState {
  items: CartLine[];
  addItem: (partId: string, quantity?: number) => void;
  removeItem: (partId: string) => void;
  setQuantity: (partId: string, quantity: number) => void;
  clear: () => void;
  totalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (partId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.partId === partId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.partId === partId ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { partId, quantity }] };
        }),
      removeItem: (partId) =>
        set((state) => ({ items: state.items.filter((i) => i.partId !== partId) })),
      setQuantity: (partId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.partId === partId ? { ...i, quantity: Math.max(1, quantity) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "carvista-cart" },
  ),
);

export interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: "carvista-wishlist" },
  ),
);
