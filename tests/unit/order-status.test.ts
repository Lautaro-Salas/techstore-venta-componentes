import { describe, expect, it } from "vitest";
import {
  ORDER_PROGRESS,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  canTransition,
} from "@/services/orders/status";

describe("canTransition", () => {
  it("flujo normal de punta a punta", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("permite cancelar antes de estar en tránsito", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("no permite saltos ni ir hacia atrás", () => {
    expect(canTransition("PENDING", "PREPARING")).toBe(false);
    expect(canTransition("CONFIRMED", "SHIPPED")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("DELIVERED y CANCELLED son estados finales", () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition("DELIVERED", to)).toBe(false);
      expect(canTransition("CANCELLED", to)).toBe(false);
    }
  });
});



describe("metadatos de estados", () => {
  it("todos los estados tienen etiqueta", () => {
    for (const s of ORDER_STATUSES) expect(ORDER_STATUS_LABEL[s]).toBeTruthy();
  });

  it("el progreso del cliente excluye CANCELLED e incluye el flujo completo", () => {
    expect(ORDER_PROGRESS).toEqual(["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"]);
    expect(ORDER_PROGRESS).not.toContain("CANCELLED");
  });
});
