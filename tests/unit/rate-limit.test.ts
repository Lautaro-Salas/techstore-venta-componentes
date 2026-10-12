import { describe, expect, it } from "vitest";
import { RATE_LIMITS, checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("permite hasta el límite y bloquea la siguiente", () => {
    const now = 1_000;
    for (let i = 0; i < RATE_LIMITS.login.limit; i++) {
      expect(checkRateLimit("login", "rl-a", now)).toBe(true);
    }
    expect(checkRateLimit("login", "rl-a", now)).toBe(false);
  });

  it("la ventana deslizante libera el contador pasado el windowMs", () => {
    const now = 2_000;
    const { windowMs } = RATE_LIMITS.login;
    for (let i = 0; i < RATE_LIMITS.login.limit; i++) checkRateLimit("login", "rl-b", now);
    expect(checkRateLimit("login", "rl-b", now)).toBe(false);
    // Todavía dentro de la ventana: bloqueado.
    expect(checkRateLimit("login", "rl-b", now + windowMs - 1)).toBe(false);
    // Vencida la ventana: vuelve a permitir.
    expect(checkRateLimit("login", "rl-b", now + windowMs)).toBe(true);
  });

  it("los identificadores son independientes", () => {
    const now = 3_000;
    for (let i = 0; i < RATE_LIMITS.login.limit; i++) checkRateLimit("login", "rl-c1", now);
    expect(checkRateLimit("login", "rl-c1", now)).toBe(false);
    expect(checkRateLimit("login", "rl-c2", now)).toBe(true);
  });

  it("las políticas tienen límite y ventana positivos", () => {
    for (const policy of Object.values(RATE_LIMITS)) {
      expect(policy.limit).toBeGreaterThan(0);
      expect(policy.windowMs).toBeGreaterThan(0);
    }
  });

  it("el tope global por IP es mayor que el límite por ip:email (antiguo credential stuffing)", () => {
    expect(RATE_LIMITS.loginIp.limit).toBeGreaterThan(RATE_LIMITS.login.limit);
  });

  it("un caudal de claves no reinicia los contadores vigentes (regresión del clear())", () => {
    const now = 5_000_000;
    // Acercar el mapa al tope de 10.000 claves.
    for (let i = 0; i < 9_000; i++) checkRateLimit("login", `ev-flood-${i}`, now);
    // Víctima: queda bloqueada.
    for (let i = 0; i < RATE_LIMITS.login.limit; i++) checkRateLimit("login", "ev-victim", now);
    expect(checkRateLimit("login", "ev-victim", now)).toBe(false);
    // Empujar por encima del tope para disparar la poda (borra las más viejas).
    for (let i = 9_000; i < 10_100; i++) checkRateLimit("login", `ev-flood-${i}`, now);
    // La víctima sigue bloqueada: la poda no hizo clear() global.
    expect(checkRateLimit("login", "ev-victim", now)).toBe(false);
  });
});
