import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CompareView } from "@/features/compare/compare-view";

export const metadata: Metadata = { title: "Comparar productos", robots: { index: false } };

export default function ComparePage() {
  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-10">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: "Comparar", href: "/comparar" },
          ]}
        />
        <h1 className="mt-4 mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Comparar productos
        </h1>
        <CompareView />
      </div>
    </PageTransition>
  );
}
