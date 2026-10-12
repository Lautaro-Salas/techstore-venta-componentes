import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatOrderNumber,
  formatPrice,
  pluralize,
} from "@/lib/format";

describe("formatPrice", () => {
  it("formatea pesos enteros con separador de miles", () => {
    expect(formatPrice(329_990)).toBe("$ 329.990");
    expect(formatPrice(0)).toBe("$ 0");
    expect(formatPrice(1_500)).toBe("$ 1.500");
  });
});

describe("formatDate / formatDateTime", () => {
  it("usa la zona horaria de Buenos Aires", () => {
    // 2026-01-05 15:00 UTC → 12:00 del 05/01 en AR.
    const d = new Date(Date.UTC(2026, 0, 5, 15, 0));
    expect(formatDate(d)).toBe("05/01/2026");
    expect(formatDateTime(d)).toContain("05/01/2026");
    expect(formatDateTime(d)).toContain("12:00");
  });

  it("corre el día cuando en AR todavía es ayer", () => {
    // 2026-01-06 01:00 UTC → 22:00 del 05/01 en AR (UTC−3).
    expect(formatDate(new Date(Date.UTC(2026, 0, 6, 1, 0)))).toBe("05/01/2026");
  });

  it("acepta strings ISO", () => {
    expect(formatDate("2026-03-10T12:00:00.000Z")).toBe("10/03/2026");
  });
});

describe("formatOrderNumber", () => {
  it("rellena a 6 dígitos con numeral", () => {
    expect(formatOrderNumber(7)).toBe("#000007");
    expect(formatOrderNumber(123_456)).toBe("#123456");
  });
});

describe("pluralize", () => {
  it("elige singular sólo para 1", () => {
    expect(pluralize(1, "producto", "productos")).toBe("1 producto");
    expect(pluralize(0, "producto", "productos")).toBe("0 productos");
    expect(pluralize(2, "producto", "productos")).toBe("2 productos");
  });
});
