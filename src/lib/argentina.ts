/** Datos y validaciones específicas de Argentina. */

export const PROVINCES = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type Province = (typeof PROVINCES)[number];

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const CUIT_LENGTH = 11;
const MOD = 11;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** DNI: 7 u 8 dígitos. */
export function isValidDni(value: string): boolean {
  return /^\d{7,8}$/.test(onlyDigits(value));
}

/** CUIT/CUIL con dígito verificador (módulo 11). */
export function isValidCuit(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== CUIT_LENGTH) return false;
  const nums = digits.split("").map(Number);
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * nums[i]!, 0);
  const remainder = MOD - (sum % MOD);
  const check = remainder === MOD ? 0 : remainder === 10 ? 9 : remainder;
  return check === nums[CUIT_LENGTH - 1];
}

/** Código postal: 4 dígitos (ej. 1425) o CPA (ej. C1425ABC). */
export function isValidPostalCode(value: string): boolean {
  return /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/.test(value.trim());
}
