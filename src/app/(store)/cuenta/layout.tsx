import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AccountNav } from "@/features/account/account-nav";
import { requireUserPage } from "@/lib/auth/guards";

export const metadata: Metadata = { title: { default: "Mi cuenta", template: "%s · Mi cuenta" }, robots: { index: false } };

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUserPage("/cuenta");
  return (
    <div className="container-page grid gap-6 py-6 sm:py-10 lg:grid-cols-[230px_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-36 lg:self-start"><AccountNav /></aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
