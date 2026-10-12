import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { formatDate, pluralize } from "@/lib/format";
import {
  getReviewEligibility,
  listProductReviews,
  type ReviewSummary,
} from "@/services/reviews/reviews.service";
import { ReviewForm } from "./review-form";

function Distribution({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold tracking-tight tabular-nums">
          {summary.average.toFixed(1)}
        </span>
        <div className="pb-1">
          <Rating value={summary.average} size="md" />
          <p className="text-muted mt-1 text-sm">{pluralize(summary.count, "reseña", "reseñas")}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {summary.distribution.map((d) => {
          const pct = summary.count ? Math.round((d.count / summary.count) * 100) : 0;
          return (
            <li key={d.stars} className="flex items-center gap-2 text-sm">
              <span className="text-muted w-14">
                {d.stars} {d.stars === 1 ? "estrella" : "estr."}
              </span>
              <span
                className="bg-surface-2 h-2 flex-1 overflow-hidden rounded-full"
                role="img"
                aria-label={`${pct}% de reseñas con ${d.stars} estrellas`}
              >
                <span
                  className="block h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="text-muted w-8 text-right text-xs tabular-nums">{d.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ELIGIBILITY_MESSAGE = {
  not_purchased:
    "Solo pueden opinar quienes compraron este producto. Cuando recibas tu pedido vas a poder dejar tu reseña.",
  already_reviewed: "Ya dejaste tu reseña de este producto. ¡Gracias!",
} as const;

export async function ReviewsSection({
  productId,
  slug,
  summary,
  userId,
}: {
  productId: string;
  slug: string;
  summary: ReviewSummary;
  userId?: string;
}) {
  const [reviews, eligibility] = await Promise.all([
    listProductReviews(productId),
    getReviewEligibility(userId, productId),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-4">
        <Distribution summary={summary} />
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Dejá tu opinión</h3>
          {eligibility === "eligible" && <ReviewForm productId={productId} slug={slug} />}
          {eligibility === "anonymous" && (
            <p className="text-muted text-sm">
              <Link
                href={`/ingresar?next=/producto/${slug}`}
                className="text-primary font-medium hover:underline"
              >
                Iniciá sesión
              </Link>{" "}
              para opinar sobre productos que compraste.
            </p>
          )}
          {(eligibility === "not_purchased" || eligibility === "already_reviewed") && (
            <p className="text-muted text-sm">{ELIGIBILITY_MESSAGE[eligibility]}</p>
          )}
        </div>
      </div>
      <div>
        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText />}
            title="Todavía no hay reseñas"
            description="Las opiniones provienen solo de compradores verificados."
          />
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Rating value={r.rating} />
                  {r.title && <h4 className="font-semibold">{r.title}</h4>}
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
                <p className="text-muted mt-2 flex flex-wrap items-center gap-x-3 text-xs">
                  <span>
                    {r.user.firstName} {r.user.lastName.charAt(0)}.
                  </span>
                  <span aria-hidden className="bg-border h-3 w-px" />
                  <span>Compra verificada</span>
                  <span aria-hidden className="bg-border h-3 w-px" />
                  <span>{formatDate(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
