import "server-only";
import { z } from "zod";
import { AppError, GENERIC_ERROR_MESSAGE, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/types/actions";

/** Convierte errores de Zod en un mapa campo → mensaje. */
function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fields[key] ??= issue.message;
  }
  return fields;
}

export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError("VALIDATION", "Revisá los datos ingresados.", zodFieldErrors(result.error));
  }
  return result.data;
}

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) obj[key] = value;
  });
  return obj;
}

/**
 * Envuelve la lógica de una server action: devuelve un resultado tipado y
 * nunca expone detalles internos ni stack traces al cliente.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code, fieldErrors: error.fieldErrors };
    }
    if (isNextControlFlow(error)) throw error;
    logger.error("Error no controlado en server action", error);
    return { ok: false, error: GENERIC_ERROR_MESSAGE, code: "INTERNAL" };
  }
}

/** redirect()/notFound() de Next lanzan errores especiales que deben propagarse. */
function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK)/.test(
      (error as { digest: string }).digest,
    )
  );
}
