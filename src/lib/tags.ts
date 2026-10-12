/**
 * `Product.tags` se almacena como JSON en la base (SQLite no soporta arrays de primitivos).
 * Estos helpers normalizan el valor a un array de strings.
 */
export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((t): t is string => typeof t === "string");
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}
