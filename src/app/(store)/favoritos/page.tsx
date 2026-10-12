import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WishlistGrid } from "@/features/wishlist/wishlist-grid";
import { requireUserPage } from "@/lib/auth/guards";
import { getWishlistProducts } from "@/services/wishlist/wishlist.service";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUserPage("/favoritos");
  const products = await getWishlistProducts(user.id);
  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Favoritos</h1>
        {products.length === 0 ? (
          <EmptyState
            icon={<Heart />}
            title="Todavía no guardaste favoritos"
            description="Tocá el corazón en cualquier producto para guardarlo y comprarlo después."
            action={<ButtonLink href="/productos">Explorar productos</ButtonLink>}
          />
        ) : (
          <WishlistGrid products={products} />
        )}
      </div>
    </PageTransition>
  );
}
