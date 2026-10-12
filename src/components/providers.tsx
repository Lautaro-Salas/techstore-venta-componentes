"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { ToastProvider } from "@/components/ui/toast";
import { WishlistProvider } from "@/features/wishlist/wishlist-context";

export function Providers({ children, wishlistIds, isAuthenticated }: { children: ReactNode; wishlistIds: string[]; isAuthenticated: boolean }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <WishlistProvider initialIds={wishlistIds} isAuthenticated={isAuthenticated}>
          <OfflineBanner />
          {children}
        </WishlistProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
