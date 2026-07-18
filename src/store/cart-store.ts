"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A snapshot of a product captured when it's added to the cart. Storing the
 * display fields here (rather than only an ID) means the cart and checkout can
 * render without re-fetching — and, crucially, it works for database-backed
 * products whose IDs aren't known to any static list.
 */
export interface CartItemSnapshot {
  partId: string;
  name: string;
  slug: string;
  price: number; // effective (already discounted) price
  image: string;
  storeName: string;
}

export interface CartLine extends CartItemSnapshot {
  quantity: number;
}

interface CartState {
  items: CartLine[];
  addItem: (item: CartItemSnapshot, quantity?: number) => void;
  removeItem: (partId: string) => void;
  setQuantity: (partId: string, quantity: number) => void;
  clear: () => void;
  totalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.partId === item.partId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.partId === item.partId ? { ...i, ...item, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
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
    {
      name: "carvista-cart",
      version: 1,
      // v0 stored only { partId, quantity } with no product snapshot, which the
      // new UI can't render — reset those old carts on upgrade.
      migrate: () => ({ items: [] as CartLine[] }),
    },
  ),
);

export interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  /** Replace the whole set — used to hydrate from the database on load. */
  setIds: (ids: string[]) => void;
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
      add: (id) => set((state) => (state.ids.includes(id) ? state : { ids: [...state.ids, id] })),
      remove: (id) => set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      setIds: (ids) => set({ ids: Array.from(new Set(ids)) }),
      has: (id) => get().ids.includes(id),
    }),
    { name: "carvista-wishlist" },
  ),
);
