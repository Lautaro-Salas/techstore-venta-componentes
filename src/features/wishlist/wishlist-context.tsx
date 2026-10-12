"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface WishlistContextValue {
  isAuthenticated: boolean;
  has: (productId: string) => boolean;
  set: (productId: string, inWishlist: boolean) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ initialIds, isAuthenticated, children }: { initialIds: string[]; isAuthenticated: boolean; children: ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initialIds));
  const has = useCallback((id: string) => ids.has(id), [ids]);
  const set = useCallback((id: string, inWishlist: boolean) => {
    setIds((current) => {
      const next = new Set(current);
      if (inWishlist) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ isAuthenticated, has, set }), [isAuthenticated, has, set]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  return ctx;
}
