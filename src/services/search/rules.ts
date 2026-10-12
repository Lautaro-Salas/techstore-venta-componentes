/** Utilidades puras de búsqueda: normalización y tolerancia a errores de tipeo. */

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeQuery(raw: string | undefined | null): string {
  if (!raw) return "";
  return normalizeText(raw).slice(0, MAX_QUERY_LENGTH);
}

export function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter((t) => t.length > 0);
}

/** Distancia de Levenshtein (edición mínima) con memoria O(n). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }
  return previous[b.length]!;
}

/** Errores tolerados según el largo de la palabra. */
export function allowedTypos(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 6) return 1;
  return 2;
}

/**
 * Sugiere el término del vocabulario más parecido a cada palabra de la búsqueda.
 * Devuelve null si la búsqueda ya coincide o no hay sugerencias razonables.
 */
export function suggestCorrection(query: string, vocabulary: string[]): string | null {
  const words = tokenize(query);
  const vocab = Array.from(new Set(vocabulary.flatMap(tokenize)));
  let changed = false;
  const corrected = words.map((word) => {
    if (vocab.includes(word)) return word;
    let best: { term: string; distance: number } | null = null;
    for (const term of vocab) {
      const distance = levenshtein(word, term);
      if (distance <= allowedTypos(word) && (!best || distance < best.distance)) best = { term, distance };
    }
    if (best) {
      changed = true;
      return best.term;
    }
    return word;
  });
  return changed ? corrected.join(" ") : null;
}
