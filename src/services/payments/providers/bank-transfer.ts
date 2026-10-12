import "server-only";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/services/settings/settings.service";
import type { PaymentProvider } from "../types";

/** Transferencia bancaria: el pedido queda pendiente hasta que el staff confirma la acreditación. */
export const bankTransferProvider: PaymentProvider = {
  code: "bank_transfer",
  supportsInstallments: false,
  isAvailable: () => true,
  async initiate(order) {
    const { bank } = await getStoreSettings();
    const lines = [
      { label: "Banco", value: bank.bankName },
      { label: "Titular", value: bank.holder },
      { label: "CUIT", value: bank.cuit },
      { label: "CBU/CVU", value: bank.cbu },
      { label: "Alias", value: bank.alias },
    ].filter((l) => l.value);
    return {
      status: "PENDING",
      instructions: {
        title: "Datos para la transferencia",
        lines: [...lines, { label: "Importe", value: formatPrice(order.total) }, { label: "Referencia", value: formatOrderNumber(order.number) }],
        note:
          lines.length === 0
            ? "Te enviaremos los datos bancarios por email para completar el pago."
            : "Enviá el comprobante respondiendo el email de confirmación. Reservamos el stock por 48 horas.",
      },
    };
  },
};
