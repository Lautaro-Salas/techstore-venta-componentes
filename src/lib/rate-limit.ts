/**
 * Rate limiting en memoria (ventana deslizante por clave).
 * Suficiente para una instancia. Con múltiples instancias, reemplazar el store por Redis
 * implementando la misma interfaz RateLimitStore.
 */
export interface RateLimitStore {
  hit(key: string, windowMs: number, now: number): number;
}

class MemoryStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private static readonly MAX_KEYS = 10_000;

  hit(key: string, windowMs: number, now: number): number {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    this.hits.set(key, recent);
    // Si el mapa se llena, se descartan sólo las entradas vencidas y, si alcanza,
    // las más viejas por orden de inserción. Antes se limpiaba TODO el mapa con un
    // clear(), lo que reiniciaba todos los contadores (evadible con 10k claves).
    if (this.hits.size >= MemoryStore.MAX_KEYS) {
      const target = Math.floor(MemoryStore.MAX_KEYS * 0.9);
      for (const [k, times] of this.hits) {
        if (this.hits.size <= target) break;
        if (times.every((t) => now - t >= windowMs)) this.hits.delete(k);
      }
      for (const k of this.hits.keys()) {
        if (this.hits.size <= target) break;
        if (k !== key) this.hits.delete(k);
      }
    }
    return recent.length;
  }
}

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

const MINUTE = 60_000;

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * MINUTE },
  /** Tope global por IP (además del por ip:email) para frenar credential stuffing. */
  loginIp: { limit: 40, windowMs: 15 * MINUTE },
  register: { limit: 5, windowMs: 60 * MINUTE },
  passwordReset: { limit: 3, windowMs: 60 * MINUTE },
  contact: { limit: 5, windowMs: 60 * MINUTE },
  search: { limit: 60, windowMs: MINUTE },
  checkout: { limit: 10, windowMs: 10 * MINUTE },
  review: { limit: 10, windowMs: 60 * MINUTE },
  newsletter: { limit: 5, windowMs: 60 * MINUTE },
} satisfies Record<string, RateLimitPolicy>;

export type RateLimitName = keyof typeof RATE_LIMITS;

const store: RateLimitStore = new MemoryStore();

export function checkRateLimit(name: RateLimitName, identifier: string, now = Date.now()): boolean {
  const policy = RATE_LIMITS[name];
  return store.hit(`${name}:${identifier}`, policy.windowMs, now) <= policy.limit;
}
