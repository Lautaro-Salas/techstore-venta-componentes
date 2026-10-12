"use client";

import { useState } from "react";
import { useFormAction } from "@/hooks/use-form-action";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { createReviewAction } from "@/features/engagement/actions";
import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5];
const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { state, pending, onSubmit, errors } = useFormAction(createReviewAction);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok === true) {
    return <p className="rounded-xl bg-success-soft p-4 text-sm font-medium text-success" role="status">¡Gracias! Tu reseña ya está publicada.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tu calificación <span className="text-danger" aria-hidden>*</span></legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {STARS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              aria-label={`${s} ${s === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === s}
              className="rounded p-0.5"
            >
              <Star className={cn("size-7 transition-colors", (hover || rating) >= s ? "fill-amber-400 text-amber-400" : "text-border")} aria-hidden />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">{LABELS[hover || rating]}</span>
        </div>
        {errors.rating && <p className="mt-1 text-xs font-medium text-danger" role="alert">{errors.rating}</p>}
      </fieldset>
      <Input name="title" label="Título (opcional)" maxLength={80} error={errors.title} />
      <Textarea name="comment" label="Tu opinión" required minLength={10} maxLength={1500} error={errors.comment} hint="Contá cómo te funcionó el producto." />
      {state.ok === false && !state.fieldErrors && <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>}
      <Button type="submit" loading={pending} className="self-start">Publicar reseña</Button>
    </form>
  );
}
