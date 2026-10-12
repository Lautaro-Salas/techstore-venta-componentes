"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";
import { useToast } from "@/components/ui/toast";
import { validate } from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

interface Options<T, R> {
  schema: z.ZodType;
  initial: T;
  submit: (values: T) => Promise<ActionResult<R>>;
  onSuccess?: (data: R) => void;
  successMessage?: string;
}

/**
 * Estado de formulario validado con el mismo esquema Zod que usa la server action.
 * Muestra errores por campo (cliente y servidor) y notifica el resultado con un toast.
 */
export function useSchemaForm<T extends object, R = void>({ schema, initial, submit, onSuccess, successMessage }: Options<T, R>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function set<K extends keyof T>(key: K, value: T[K]): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event?: FormEvent): void {
    event?.preventDefault();
    const check = validate(schema, values);
    if (!check.ok) {
      setErrors(check.errors);
      toast.error("Revisá los campos marcados.");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await submit(values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      if (successMessage) toast.success(successMessage);
      onSuccess?.(result.data);
    });
  }

  return { values, setValues, set, errors, pending, handleSubmit };
}
