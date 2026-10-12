/**
 * Errores de dominio con mensajes seguros para mostrar al usuario.
 * Cualquier error que no sea AppError se considera interno y se oculta.
 */
export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "OUT_OF_STOCK"
  | "INTERNAL";

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  OUT_OF_STOCK: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get status(): number {
    return HTTP_STATUS[this.code];
  }
}

export const GENERIC_ERROR_MESSAGE = "Ocurrió un error inesperado. Intentá nuevamente en unos minutos.";

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function notFound(entity: string): AppError {
  return new AppError("NOT_FOUND", `${entity} no encontrado.`);
}
