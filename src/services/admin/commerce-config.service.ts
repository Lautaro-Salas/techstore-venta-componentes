import "server-only";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { getPaymentProvider } from "@/services/payments/registry";
import type {
  InstallmentPlanInput,
  PaymentMethodInput,
  ShippingMethodInput,
} from "@/schemas/admin";
import { recordAudit } from "./audit.service";

/** Proveedor de cotización derivado del tipo de envío. */
const providerForType = (type: "HOME_DELIVERY" | "PICKUP") =>
  type === "PICKUP" ? "pickup" : "flat";

function conflict(field: string, message: string): AppError {
  return new AppError("CONFLICT", message, { [field]: message });
}

/* ------------------------------------------------------------------ */
/*  Métodos de envío                                                   */
/* ------------------------------------------------------------------ */

export interface ShippingMethodRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  provider: string;
  price: number;
  freeThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  sortOrder: number;
}

export async function listShippingMethods(): Promise<ShippingMethodRow[]> {
  return db.shippingMethod.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createShippingMethod(
  input: ShippingMethodInput,
  userId: string,
): Promise<string> {
  const existing = await db.shippingMethod.findFirst({
    where: { code: input.code },
    select: { id: true },
  });
  if (existing)
    throw conflict("code", "Ya existe un método de envío con ese código.");
  const method = await db.shippingMethod.create({
    data: { ...input, provider: providerForType(input.type) },
    select: { id: true },
  });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Método de envío creado: ${input.code} (${input.name})`,
  });
  return method.id;
}

export async function updateShippingMethod(
  id: string,
  input: ShippingMethodInput,
  userId: string,
): Promise<void> {
  const current = await db.shippingMethod.findUnique({
    where: { id },
    select: { id: true, code: true },
  });
  if (!current) throw notFound("Método de envío");
  const existing = await db.shippingMethod.findFirst({
    where: { code: input.code, NOT: { id } },
    select: { id: true },
  });
  if (existing)
    throw conflict("code", "Ya existe un método de envío con ese código.");
  await db.shippingMethod.update({
    where: { id },
    data: { ...input, provider: providerForType(input.type) },
  });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Método de envío editado: ${input.code} (${input.name})`,
  });
}

export async function deleteShippingMethod(
  id: string,
  userId: string,
): Promise<void> {
  const method = await db.shippingMethod.findUnique({
    where: { id },
    select: { id: true, code: true },
  });
  if (!method) throw notFound("Método de envío");
  // El pedido guarda el código como snapshot: si hay pedidos, no se borra.
  const orders = await db.order.count({
    where: { shippingMethodCode: method.code },
  });
  if (orders > 0) {
    throw new AppError(
      "CONFLICT",
      `Hay ${orders} pedido(s) con este método. Desactívalo en lugar de eliminarlo.`,
    );
  }
  await db.shippingMethod.delete({ where: { id } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Método de envío eliminado: ${method.code}`,
  });
}

export async function toggleShippingMethod(
  id: string,
  userId: string,
): Promise<boolean> {
  const method = await db.shippingMethod.findUnique({
    where: { id },
    select: { id: true, code: true, isActive: true },
  });
  if (!method) throw notFound("Método de envío");
  const isActive = !method.isActive;
  await db.shippingMethod.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Método de envío ${method.code}: ${isActive ? "activado" : "desactivado"}`,
  });
  return isActive;
}

/* ------------------------------------------------------------------ */
/*  Medios de pago                                                     */
/* ------------------------------------------------------------------ */

export interface PaymentMethodRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
}

export async function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  return db.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createPaymentMethod(
  input: PaymentMethodInput,
  userId: string,
): Promise<string> {
  if (!getPaymentProvider(input.code)) {
    throw new AppError("VALIDATION", "Elegí un proveedor de pagos válido.", {
      code: "Proveedor desconocido",
    });
  }
  const existing = await db.paymentMethod.findFirst({
    where: { code: input.code },
    select: { id: true },
  });
  if (existing)
    throw conflict("code", "Ya existe un medio de pago con ese código.");
  const method = await db.paymentMethod.create({
    data: input,
    select: { id: true },
  });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Medio de pago creado: ${input.code} (${input.name})`,
  });
  return method.id;
}

export async function updatePaymentMethod(
  id: string,
  input: PaymentMethodInput,
  userId: string,
): Promise<void> {
  const current = await db.paymentMethod.findUnique({
    where: { id },
    select: { id: true, code: true },
  });
  if (!current) throw notFound("Medio de pago");
  // El código identifica al proveedor registrado: no cambia en la edición.
  await db.paymentMethod.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      discountPercent: input.discountPercent,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Medio de pago editado: ${current.code} (${input.name})`,
  });
}

export async function deletePaymentMethod(
  id: string,
  userId: string,
): Promise<void> {
  const method = await db.paymentMethod.findUnique({
    where: { id },
    select: { id: true, code: true },
  });
  if (!method) throw notFound("Medio de pago");
  const orders = await db.order.count({
    where: { paymentMethodCode: method.code },
  });
  if (orders > 0) {
    throw new AppError(
      "CONFLICT",
      `Hay ${orders} pedido(s) con este medio. Desactívalo en lugar de eliminarlo.`,
    );
  }
  await db.paymentMethod.delete({ where: { id } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Medio de pago eliminado: ${method.code}`,
  });
}

export async function togglePaymentMethod(
  id: string,
  userId: string,
): Promise<boolean> {
  const method = await db.paymentMethod.findUnique({
    where: { id },
    select: { id: true, code: true, isActive: true },
  });
  if (!method) throw notFound("Medio de pago");
  const isActive = !method.isActive;
  await db.paymentMethod.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Medio de pago ${method.code}: ${isActive ? "activado" : "desactivado"}`,
  });
  return isActive;
}

/* ------------------------------------------------------------------ */
/*  Planes de cuotas                                                   */
/* ------------------------------------------------------------------ */

export interface InstallmentPlanRow {
  id: string;
  installments: number;
  interestRateBps: number;
  isActive: boolean;
}

export async function listInstallmentPlans(): Promise<InstallmentPlanRow[]> {
  return db.installmentPlan.findMany({
    orderBy: { installments: "asc" },
  });
}

const bps = (interestPercent: number): number =>
  Math.round(interestPercent * 100);

export async function createInstallmentPlan(
  input: InstallmentPlanInput,
  userId: string,
): Promise<void> {
  const existing = await db.installmentPlan.findUnique({
    where: { installments: input.installments },
    select: { id: true },
  });
  if (existing) {
    throw conflict(
      "installments",
      "Ya existe un plan con esa cantidad de cuotas.",
    );
  }
  await db.installmentPlan.create({
    data: {
      installments: input.installments,
      interestRateBps: bps(input.interestPercent),
      isActive: input.isActive,
    },
  });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Plan de cuotas creado: ${input.installments} cuotas (${input.interestPercent}%)`,
  });
}

export async function updateInstallmentPlan(
  installments: number,
  input: InstallmentPlanInput,
  userId: string,
): Promise<void> {
  const current = await db.installmentPlan.findUnique({
    where: { installments },
    select: { id: true, installments: true },
  });
  if (!current) throw notFound("Plan de cuotas");
  // Las cuotas son la clave primaria: si cambian, se reemplaza el plan.
  // Borrar y crear van en la misma transacción: si el upsert fallara después del
  // delete, el plan anterior quedaba sin sustituto.
  if (current.installments !== input.installments) {
    const existing = await db.installmentPlan.findUnique({
      where: { installments: input.installments },
      select: { id: true },
    });
    if (existing) {
      throw conflict(
        "installments",
        "Ya existe un plan con esa cantidad de cuotas.",
      );
    }
    await db.$transaction([
      db.installmentPlan.delete({ where: { installments } }),
      db.installmentPlan.create({
        data: {
          installments: input.installments,
          interestRateBps: bps(input.interestPercent),
          isActive: input.isActive,
        },
      }),
    ]);
  } else {
    await db.installmentPlan.update({
      where: { installments },
      data: {
        interestRateBps: bps(input.interestPercent),
        isActive: input.isActive,
      },
    });
  }
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Plan de cuotas editado: ${input.installments} cuotas (${input.interestPercent}%)`,
  });
}

export async function deleteInstallmentPlan(
  installments: number,
  userId: string,
): Promise<void> {
  const plan = await db.installmentPlan.findUnique({
    where: { installments },
    select: { id: true },
  });
  if (!plan) throw notFound("Plan de cuotas");
  await db.installmentPlan.delete({ where: { installments } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Plan de cuotas eliminado: ${installments} cuotas`,
  });
}

export async function toggleInstallmentPlan(
  installments: number,
  userId: string,
): Promise<boolean> {
  const plan = await db.installmentPlan.findUnique({
    where: { installments },
    select: { id: true, isActive: true },
  });
  if (!plan) throw notFound("Plan de cuotas");
  const isActive = !plan.isActive;
  await db.installmentPlan.update({ where: { installments }, data: { isActive } });
  await recordAudit({
    action: "SETTINGS_UPDATE",
    entity: "settings",
    userId,
    detail: `Plan de ${installments} cuotas: ${isActive ? "activado" : "desactivado"}`,
  });
  return isActive;
}
