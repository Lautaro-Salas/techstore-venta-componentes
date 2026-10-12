import { AppError } from "@/lib/errors";

export interface StockState {
  quantity: number;
  reserved: number;
}

export type StockLevel = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export const STOCK_LEVEL_LABEL: Record<StockLevel, string> = {
  IN_STOCK: "En stock",
  LOW_STOCK: "Stock bajo",
  OUT_OF_STOCK: "Sin stock",
};

/** Por debajo de este número la tienda muestra "Últimas unidades". */
export const LAST_UNITS_THRESHOLD = 3;

export function availableStock(state: StockState): number {
  return Math.max(state.quantity - state.reserved, 0);
}

export function stockLevel(available: number, minStock: number): StockLevel {
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= minStock) return "LOW_STOCK";
  return "IN_STOCK";
}

function assertPositive(units: number): void {
  if (!Number.isInteger(units) || units <= 0) {
    throw new AppError("VALIDATION", "La cantidad debe ser un entero positivo.");
  }
}

/** Reserva unidades para un pedido pendiente. */
export function reserve(state: StockState, units: number): StockState {
  assertPositive(units);
  if (availableStock(state) < units) {
    throw new AppError("OUT_OF_STOCK", "No hay stock suficiente para completar la operación.");
  }
  return { quantity: state.quantity, reserved: state.reserved + units };
}

/** Libera una reserva (pedido cancelado). */
export function release(state: StockState, units: number): StockState {
  assertPositive(units);
  return { quantity: state.quantity, reserved: Math.max(state.reserved - units, 0) };
}

/** Convierte una reserva en venta efectiva (descuenta stock físico). */
export function commit(state: StockState, units: number): StockState {
  assertPositive(units);
  if (state.reserved < units) {
    throw new AppError("CONFLICT", "La reserva de stock es menor a la cantidad a confirmar.");
  }
  return { quantity: state.quantity - units, reserved: state.reserved - units };
}

/** Ajuste manual: delta positivo (ingreso) o negativo (egreso). */
export function adjust(state: StockState, delta: number): StockState {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new AppError("VALIDATION", "El ajuste debe ser un entero distinto de cero.");
  }
  const quantity = state.quantity + delta;
  if (quantity < state.reserved) {
    throw new AppError("CONFLICT", "El stock no puede quedar por debajo de lo reservado.");
  }
  return { quantity, reserved: state.reserved };
}
