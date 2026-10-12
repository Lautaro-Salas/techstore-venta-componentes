"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteReviewAction } from "@/features/engagement/actions";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-danger"
      loading={pending}
      icon={<Trash2 className="size-3.5" aria-hidden />}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteReviewAction(reviewId);
          if (result.ok) toast.success("Reseña eliminada");
          else toast.error("No pudimos eliminar la reseña", result.error);
        })
      }
    >
      Eliminar
    </Button>
  );
}
