import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnalyticsScripts } from "@/components/layout/analytics-scripts";
import { PageLoader } from "@/components/navigation/page-loader";
import { getCurrentUser } from "@/lib/auth/session";
import { getEnvSiteUrl } from "@/lib/site";
import { getStoreSettings } from "@/services/settings/settings.service";
import { getWishlistProductIds } from "@/services/wishlist/wishlist.service";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const description = settings.tagline || "Tienda de tecnología en Argentina.";
  return {
    metadataBase: new URL(getEnvSiteUrl()),
    title: {
      default: `${settings.name} - Hardware, periféricos y monitores`,
      template: `%s | ${settings.name}`,
    },
    description,
    applicationName: settings.name,
    openGraph: { type: "website", locale: "es_AR", siteName: settings.name, description },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#060a12" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Una sola ronda: getCurrentUser() está memoizado con cache(), así que la
  // segunda llamada reutiliza la misma promesa y no duplica la query de sesión.
  const [settings, user, wishlistIds] = await Promise.all([
    getStoreSettings(),
    getCurrentUser(),
    getCurrentUser().then((u) => (u ? getWishlistProductIds(u.id) : Promise.resolve<string[]>([]))),
  ]);
  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={inter.variable}
      style={{ "--brand": settings.primaryColor } as CSSProperties}
    >
      <body className="min-h-dvh font-sans">
        <Providers wishlistIds={wishlistIds} isAuthenticated={Boolean(user)}>
          {children}
        </Providers>
        <AnalyticsScripts />
        <PageLoader />
      </body>
    </html>
  );
}
