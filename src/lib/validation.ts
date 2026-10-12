import type { z } from "zod";

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

/** Validación en cliente con los mismos esquemas Zod que usa el servidor. */
export function validate<T extends z.ZodType>(schema: T, input: unknown): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
