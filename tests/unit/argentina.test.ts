import { describe, expect, it } from "vitest";
import { PROVINCES, isValidCuit, isValidDni, isValidPostalCode, onlyDigits } from "@/lib/argentina";

describe("onlyDigits", () => {
  it("elimina todo lo que no sea dígito", () => {
    expect(onlyDigits("30.111.222")).toBe("30111222");
    expect(onlyDigits("DNI 41.222.333")).toBe("41222333");
    expect(onlyDigits("abc")).toBe("");
  });
});

describe("isValidDni", () => {
  it("acepta 7 u 8 dígitos, con o sin formato", () => {
    expect(isValidDni("12345678")).toBe(true);
    expect(isValidDni("1234567")).toBe(true);
    expect(isValidDni("12.345.678")).toBe(true);
  });

  it("rechaza longitudes fuera de rango y entradas sin dígitos", () => {
    expect(isValidDni("123456")).toBe(false);
    expect(isValidDni("123456789")).toBe(false);
    expect(isValidDni("abcdefgh")).toBe(false);
    expect(isValidDni("...")).toBe(false);
    expect(isValidDni("")).toBe(false);
  });
});

describe("isValidCuit", () => {
  // Esperados calculados con módulo 11: ver CUIT_WEIGHTS en src/lib/argentina.ts.
  it("acepta CUIT con dígito verificador válido", () => {
    expect(isValidCuit("20345678957")).toBe(true);
    expect(isValidCuit("20-34567895-7")).toBe(true);
    // Caso resto 0 → verificador 0.
    expect(isValidCuit("20269613840")).toBe(true);
    // Caso resto 10 → verificador 9.
    expect(isValidCuit("20345678999")).toBe(true);
  });

  it("rechaza dígito verificador incorrecto", () => {
    expect(isValidCuit("20345678958")).toBe(false);
    expect(isValidCuit("20-34567895-0")).toBe(false);
  });

  it("rechaza longitudes distintas de 11 dígitos", () => {
    expect(isValidCuit("2034567895")).toBe(false);
    expect(isValidCuit("203456789571")).toBe(false);
    expect(isValidCuit("")).toBe(false);
    expect(isValidCuit("abcdefghijk")).toBe(false);
  });
});

describe("isValidPostalCode", () => {
  it("acepta CP de 4 dígitos y CPA", () => {
    expect(isValidPostalCode("1425")).toBe(true);
    expect(isValidPostalCode("C1425ABC")).toBe(true);
    expect(isValidPostalCode(" 1425 ")).toBe(true);
  });

  it("rechaza formatos inválidos", () => {
    expect(isValidPostalCode("142")).toBe(false);
    expect(isValidPostalCode("14256")).toBe(false);
    expect(isValidPostalCode("C1425AB")).toBe(false);
    expect(isValidPostalCode("")).toBe(false);
  });
});

describe("PROVINCES", () => {
  it("son 24 jurisdicciones únicas (23 provincias + CABA)", () => {
    expect(PROVINCES).toHaveLength(24);
    expect(new Set(PROVINCES).size).toBe(24);
    expect(PROVINCES).toContain("Ciudad Autónoma de Buenos Aires");
    expect(PROVINCES).toContain("Tucumán");
  });
});
