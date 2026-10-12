/**
 * Logger mínimo del servidor. Centraliza la salida para poder reemplazarlo
 * por un servicio externo (Sentry, Datadog, etc.) sin tocar el resto del código.
 */
type Level = "info" | "warn" | "error";

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "test" && level === "info") return;
  const entry = JSON.stringify({ level, message, time: new Date().toISOString(), ...meta });
  if (level === "error") console.error(entry);
  else console.warn(entry);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) =>
    write("error", message, {
      ...meta,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    }),
};
