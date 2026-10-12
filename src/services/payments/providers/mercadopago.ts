import "server-only";
import { createHmac } from "node:crypto";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { safeEqual } from "@/lib/auth/crypto";
import { itemizeOrderCharge } from "../charge";
import type { PaymentProvider } from "../types";

const MP_API = "https://api.mercadopago.com";

interface PreferenceResponse {
  id: string;
  init_point: string;
}

export interface MercadoPagoPayment {
  id: number;
  status:
    "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded" | "charged_back";
  external_reference: string | null;
  transaction_amount: number;
  installments: number;
}

function token(): string | undefined {
  return getEnv().MP_ACCESS_TOKEN;
}

/**
 * Mercado Pago Checkout Pro (tarjetas, cuotas, dinero en cuenta).
 * Solo se habilita si MP_ACCESS_TOKEN está configurado. Sin credenciales no se ofrece en el checkout.
 */
export const mercadoPagoProvider: PaymentProvider = {
  code: "mercadopago",
  supportsInstallments: true,
  isAvailable: () => Boolean(token()),
  async initiate(order) {
    const accessToken = token();
    if (!accessToken) throw new AppError("CONFLICT", "Mercado Pago no está configurado.");
    const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL;
    // Itemizamos el cobro con el módulo puro de "cobro itemizado": productos al
    // precio de lista + línea de envío + línea de descuento, de modo que la suma
    // de líneas sea EXACTAMENTE el total que el cliente vio en el checkout. Antes
    // se mandaba sólo el subtotal sin descuentos ni envío (se cobraba de más con
    // descuentos y no se cobraba el flete).
    const chargeItems = itemizeOrderCharge({
      lines: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      discountTotal: order.discountTotal,
      shippingTotal: order.shippingTotal,
    });
    const response = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify({
        external_reference: order.id,
        payer: { email: order.email },
        items: chargeItems.map((i) => ({
          title: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency_id: "ARS",
        })),
        back_urls: {
          success: `${siteUrl}/checkout/confirmacion/${order.id}`,
          pending: `${siteUrl}/checkout/confirmacion/${order.id}`,
          failure: `${siteUrl}/checkout/confirmacion/${order.id}`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      }),
    });
    if (!response.ok)
      throw new AppError("INTERNAL", "No pudimos iniciar el pago con Mercado Pago.");
    const preference = (await response.json()) as PreferenceResponse;
    return { status: "PENDING", redirectUrl: preference.init_point, externalId: preference.id };
  },
};

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const accessToken = token();
  if (!accessToken) throw new AppError("CONFLICT", "Mercado Pago no está configurado.");
  const response = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new AppError("NOT_FOUND", "Pago no encontrado en Mercado Pago.");
  return (await response.json()) as MercadoPagoPayment;
}

/** Verifica la firma x-signature de los webhooks de Mercado Pago. */
export function verifyMercadoPagoSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const secret = getEnv().MP_WEBHOOK_SECRET;
  if (!secret || !input.signatureHeader) return false;
  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestId ?? ""};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return safeEqual(expected, parts.v1);
}
