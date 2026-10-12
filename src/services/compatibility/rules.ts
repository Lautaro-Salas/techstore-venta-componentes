import { SPEC, type ComponentKind } from "./kinds";

export interface CompatibilityItem {
  kind: ComponentKind;
  name: string;
  specs: Record<string, string>;
}

export type CompatibilityStatus = "compatible" | "incompatible" | "unknown";

export interface CompatibilityResult {
  ruleId: string;
  status: CompatibilityStatus;
  message: string;
}

/**
 * Una regla compara dos tipos de componente. Para agregar una regla nueva
 * basta con sumarla a COMPATIBILITY_RULES: el motor la aplica en ambos sentidos.
 */
export interface CompatibilityRule {
  id: string;
  kinds: [ComponentKind, ComponentKind];
  check: (a: CompatibilityItem, b: CompatibilityItem) => CompatibilityResult;
}

const norm = (v: string | undefined) => v?.trim().toLowerCase();
const list = (v: string | undefined) => (v ? v.split(",").map((s) => s.trim().toLowerCase()) : []);
const num = (v: string | undefined) => {
  const n = v === undefined ? NaN : Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

function unknown(ruleId: string, what: string): CompatibilityResult {
  return { ruleId, status: "unknown", message: `No hay datos suficientes para verificar ${what}.` };
}

function equalsRule(id: string, kinds: [ComponentKind, ComponentKind], key: string, label: string): CompatibilityRule {
  return {
    id,
    kinds,
    check: (a, b) => {
      const va = norm(a.specs[key]);
      const vb = norm(b.specs[key]);
      if (!va || !vb) return unknown(id, label);
      return va === vb
        ? { ruleId: id, status: "compatible", message: `${label} compatible (${a.specs[key]}).` }
        : {
            ruleId: id,
            status: "incompatible",
            message: `${label} incompatible: ${a.specs[key]} vs ${b.specs[key]}.`,
          };
    },
  };
}

function maxRule(
  id: string,
  kinds: [ComponentKind, ComponentKind],
  valueKey: string,
  limitKey: string,
  label: string,
  unit: string,
): CompatibilityRule {
  return {
    id,
    kinds,
    check: (a, b) => {
      const value = num(a.specs[valueKey]);
      const limit = num(b.specs[limitKey]);
      if (value === undefined || limit === undefined) return unknown(id, label);
      return value <= limit
        ? { ruleId: id, status: "compatible", message: `${label}: ${value} ${unit} de ${limit} ${unit} admitidos.` }
        : {
            ruleId: id,
            status: "incompatible",
            message: `${label}: requiere ${value} ${unit} y admite hasta ${limit} ${unit}.`,
          };
    },
  };
}

function inListRule(
  id: string,
  kinds: [ComponentKind, ComponentKind],
  valueKey: string,
  listKey: string,
  label: string,
): CompatibilityRule {
  return {
    id,
    kinds,
    check: (a, b) => {
      const value = norm(a.specs[valueKey]);
      const options = list(b.specs[listKey]);
      if (!value || options.length === 0) return unknown(id, label);
      return options.includes(value)
        ? { ruleId: id, status: "compatible", message: `${label} compatible (${a.specs[valueKey]}).` }
        : { ruleId: id, status: "incompatible", message: `${label} no soportado: ${a.specs[valueKey]}.` };
    },
  };
}

export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  equalsRule("cpu-motherboard-socket", ["cpu", "motherboard"], SPEC.socket, "Socket"),
  equalsRule("ram-motherboard-type", ["ram", "motherboard"], SPEC.memoryType, "Tipo de memoria"),
  maxRule("gpu-psu-wattage", ["gpu", "psu"], SPEC.recommendedPsu, SPEC.wattage, "Potencia de fuente", "W"),
  maxRule("gpu-case-length", ["gpu", "case"], SPEC.lengthMm, SPEC.maxGpuLengthMm, "Largo de placa", "mm"),
  inListRule("motherboard-case-form", ["motherboard", "case"], SPEC.formFactor, SPEC.supportedFormFactors, "Formato"),
  inListRule("cpu-cooler-socket", ["cpu", "cooler"], SPEC.socket, SPEC.sockets, "Socket del cooler"),
  maxRule("cpu-cooler-tdp", ["cpu", "cooler"], SPEC.tdp, SPEC.maxTdp, "Disipación (TDP)", "W"),
  maxRule("cooler-case-height", ["cooler", "case"], SPEC.heightMm, SPEC.maxCoolerHeightMm, "Altura del cooler", "mm"),
];

/** Evalúa todas las reglas aplicables a un par de componentes (en cualquier orden). */
export function checkPair(
  x: CompatibilityItem,
  y: CompatibilityItem,
  rules: CompatibilityRule[] = COMPATIBILITY_RULES,
): CompatibilityResult[] {
  const results: CompatibilityResult[] = [];
  for (const rule of rules) {
    const [first, second] = rule.kinds;
    if (x.kind === first && y.kind === second) results.push(rule.check(x, y));
    else if (y.kind === first && x.kind === second) results.push(rule.check(y, x));
  }
  return results;
}

export function overallStatus(results: CompatibilityResult[]): CompatibilityStatus {
  if (results.some((r) => r.status === "incompatible")) return "incompatible";
  if (results.length > 0 && results.every((r) => r.status === "compatible")) return "compatible";
  return "unknown";
}

export function isIncompatible(x: CompatibilityItem, y: CompatibilityItem): boolean {
  return overallStatus(checkPair(x, y)) === "incompatible";
}
