/**
 * Límites de día y mes en horario de Argentina, independientes de la zona
 * horaria del servidor (que en producción suele ser UTC).
 */
export const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DAY_MS = 86_400_000;
const SECOND_MS = 1000;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: AR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zonedParts(date: Date): ZonedParts {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts as unknown as ZonedParts;
}

/** Diferencia en ms entre la hora local argentina y UTC en ese instante. */
function offsetMs(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / SECOND_MS) * SECOND_MS;
}

/** Instante UTC de la medianoche argentina para una fecha local (mes 1-12). */
function zonedMidnight(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day));
  return new Date(guess.getTime() - offsetMs(guess));
}

export function startOfDayAR(date: Date = new Date()): Date {
  const p = zonedParts(date);
  return zonedMidnight(p.year, p.month, p.day);
}

export function startOfMonthAR(date: Date = new Date()): Date {
  const p = zonedParts(date);
  return zonedMidnight(p.year, p.month, 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Clave "AAAA-MM-DD" del día argentino (también sirve como valor de <input type="date">). */
export function dayKeyAR(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Convierte "AAAA-MM-DD" a la medianoche argentina de ese día. */
export function parseDayKeyAR(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return zonedMidnight(year ?? 0, month ?? 1, day ?? 1);
}

/** Último milisegundo del día argentino "AAAA-MM-DD". */
export function endOfDayKeyAR(value: string): Date {
  return new Date(addDays(parseDayKeyAR(value), 1).getTime() - 1);
}
