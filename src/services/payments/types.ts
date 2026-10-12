export interface PaymentOrderContext {
  id: string;
  number: number;
  /** Importe que el checkout mostró y que el pedido persistió (subtotal - descuentos + envío). */
  total: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  email: string;
  items: { name: string; quantity: number; unitPrice: number }[];
}

export interface PaymentInstructions {
  title: string;
  lines: { label: string; value: string }[];
  note?: string;
}

export interface PaymentInitResult {
  status: "PENDING" | "APPROVED";
  /** Si existe, el cliente debe ser redirigido (ej. checkout de Mercado Pago). */
  redirectUrl?: string;
  instructions?: PaymentInstructions;
  externalId?: string;
}

/**
 * Contrato que debe cumplir cualquier medio de pago.
 * Para sumar un proveedor nuevo: implementar esta interfaz y registrarlo en registry.ts.
 */
export interface PaymentProvider {
  code: string;
  /** false si faltan credenciales o configuración. */
  isAvailable(): boolean;
  supportsInstallments: boolean;
  initiate(order: PaymentOrderContext, installments: number): Promise<PaymentInitResult>;
}
