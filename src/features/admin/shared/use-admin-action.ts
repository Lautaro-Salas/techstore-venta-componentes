"use client";

import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/types/actions";

/** Ejecuta una server action puntual (botón) con estado de carga y toasts. */
export function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function run<R>(action: () => Promise<ActionResult<R>>, options: { success?: string | ((data: R) => string); onSuccess?: (data: R) => void } = {}): void {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const message = typeof options.success === "function" ? options.success(result.data) : options.success;
      if (message) toast.success(message);
      options.onSuccess?.(result.data);
    });
  }

  return { pending, run };
}
