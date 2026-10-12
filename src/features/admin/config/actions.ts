"use server";

import { revalidatePath } from "next/cache";
import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { idSchema } from "@/schemas/common";
import {
  installmentPlanSchema,
  paymentMethodSchema,
  shippingMethodSchema,
  type InstallmentPlanFormValues,
  type PaymentMethodFormValues,
  type ShippingMethodFormValues,
} from "@/schemas/admin";
import { storeSettingsFormSchema } from "@/schemas/settings";
import type { StoreSettingsFormValues } from "@/schemas/settings";
import * as config from "@/services/admin/commerce-config.service";
import { recordAudit } from "@/services/admin/audit.service";
import { saveStoreSettings } from "@/services/settings/settings.service";
import { revalidateCommerceConfig } from "@/lib/cache/revalidate";
import type { ActionResult } from "@/types/actions";

const revalidateCommerce = revalidateCommerceConfig;

/* ---------------- Configuración general de la tienda ---------------- */

export async function saveStoreSettingsAction(
  values: StoreSettingsFormValues,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const settings = parseOrThrow(storeSettingsFormSchema, values);
    await saveStoreSettings(settings);
    // El layout (header, footer, WhatsApp) y la portada leen la configuración.
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/configuracion");
    await recordAudit({
      action: "SETTINGS_UPDATE",
      entity: "settings",
      userId: user.id,
      detail: "Configuración de la tienda",
    });
  });
}

/* ---------------- Métodos de envío ---------------- */

export async function saveShippingMethodAction(
  values: ShippingMethodFormValues,
  methodId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const input = parseOrThrow(shippingMethodSchema, values);
    let id: string;
    if (methodId) {
      id = parseOrThrow(idSchema, methodId);
      await config.updateShippingMethod(id, input, user.id);
    } else {
      id = await config.createShippingMethod(input, user.id);
    }
    revalidateCommerce();
    return { id };
  });
}

export async function deleteShippingMethodAction(
  methodId: string,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    await config.deleteShippingMethod(parseOrThrow(idSchema, methodId), user.id);
    revalidateCommerce();
  });
}

export async function toggleShippingMethodAction(
  methodId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const isActive = await config.toggleShippingMethod(
      parseOrThrow(idSchema, methodId),
      user.id,
    );
    revalidateCommerce();
    return { isActive };
  });
}

/* ---------------- Medios de pago ---------------- */

export async function savePaymentMethodAction(
  values: PaymentMethodFormValues,
  methodId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const input = parseOrThrow(paymentMethodSchema, values);
    let id: string;
    if (methodId) {
      id = parseOrThrow(idSchema, methodId);
      await config.updatePaymentMethod(id, input, user.id);
    } else {
      id = await config.createPaymentMethod(input, user.id);
    }
    revalidateCommerce();
    return { id };
  });
}

export async function deletePaymentMethodAction(
  methodId: string,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    await config.deletePaymentMethod(parseOrThrow(idSchema, methodId), user.id);
    revalidateCommerce();
  });
}

export async function togglePaymentMethodAction(
  methodId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const isActive = await config.togglePaymentMethod(
      parseOrThrow(idSchema, methodId),
      user.id,
    );
    revalidateCommerce();
    return { isActive };
  });
}

/* ---------------- Planes de cuotas ---------------- */

export async function saveInstallmentPlanAction(
  values: InstallmentPlanFormValues,
  installments?: number,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const input = parseOrThrow(installmentPlanSchema, values);
    if (installments !== undefined) {
      await config.updateInstallmentPlan(installments, input, user.id);
    } else {
      await config.createInstallmentPlan(input, user.id);
    }
    revalidateCommerce();
  });
}

export async function deleteInstallmentPlanAction(
  installments: number,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    await config.deleteInstallmentPlan(installments, user.id);
    revalidateCommerce();
  });
}

export async function toggleInstallmentPlanAction(
  installments: number,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("settings:write");
    const isActive = await config.toggleInstallmentPlan(
      installments,
      user.id,
    );
    revalidateCommerce();
    return { isActive };
  });
}
