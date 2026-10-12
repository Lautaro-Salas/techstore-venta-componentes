import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { DeleteReviewButton } from "@/features/account/delete-review-button";
import { requireUserPage } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { listUserReviews } from "@/services/reviews/reviews.service";

export const metadata: Metadata = { title: "Mis reseñas" };

export default async function MyReviewsPage() {
  const user = await requireUserPage("/cuenta/resenas");
  const reviews = await listUserReviews(user.id);
  return (
    <PageTransition>
      <div>
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Mis reseñas</h1>
        {reviews.length === 0 ? (
          <EmptyState
            icon={<Star />}
            title="Todavía no escribiste reseñas"
            description="Podés opinar sobre los productos que compraste desde su página."
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((r) => (
              <li key={r.id} className="card flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/producto/${r.product.slug}`}
                    className="hover:text-primary font-semibold"
                  >
                    {r.product.name}
                  </Link>
                  {r.status === "HIDDEN" && <Badge tone="warning">Oculta por moderación</Badge>}
                </div>
                <Rating value={r.rating} />
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="text-muted text-sm whitespace-pre-line">{r.comment}</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted text-xs">{formatDate(r.createdAt)}</span>
                  <DeleteReviewButton reviewId={r.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
