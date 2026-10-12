import { formatOrderNumber, formatPrice } from "@/lib/format";

export type NotificationEvent =
  | "user.registered"
  | "order.created"
  | "payment.approved"
  | "order.preparing"
  | "order.shipped"
  | "order.delivered"
  | "auth.password_reset"
  | "auth.email_verification"
  | "inventory.low_stock";

export interface NotificationData {
  storeName: string;
  siteUrl: string;
  firstName?: string;
  orderId?: string;
  orderNumber?: number;
  total?: number;
  trackingCode?: string;
  actionUrl?: string;
  productName?: string;
  sku?: string;
  available?: number;
}

export interface RenderedMessage {
  subject: string;
  text: string;
}

const greeting = (d: NotificationData) => (d.firstName ? `Hola ${d.firstName},` : "Hola,");
const order = (d: NotificationData) => (d.orderNumber ? formatOrderNumber(d.orderNumber) : "");
const orderLink = (d: NotificationData) =>
  d.orderId ? `\n\nVer pedido: ${d.siteUrl}/cuenta/pedidos/${d.orderId}` : "";

export const TEMPLATES: Record<NotificationEvent, (d: NotificationData) => RenderedMessage> = {
  "user.registered": (d) => ({
    subject: `Bienvenido a ${d.storeName}`,
    text: `${greeting(d)}\n\nTu cuenta fue creada correctamente.${d.actionUrl ? `\n\nConfirmá tu email: ${d.actionUrl}` : ""}`,
  }),
  "auth.email_verification": (d) => ({
    subject: "Confirmá tu email",
    text: `${greeting(d)}\n\nPara confirmar tu email ingresá a:\n${d.actionUrl}\n\nEl link vence en 24 horas.`,
  }),
  "auth.password_reset": (d) => ({
    subject: "Restablecé tu contraseña",
    text: `${greeting(d)}\n\nRecibimos un pedido para restablecer tu contraseña:\n${d.actionUrl}\n\nEl link vence en 1 hora. Si no lo pediste, ignorá este mensaje.`,
  }),
  "order.created": (d) => ({
    subject: `Recibimos tu pedido ${order(d)}`,
    text: `${greeting(d)}\n\nRecibimos tu pedido ${order(d)} por ${formatPrice(d.total ?? 0)}.${orderLink(d)}`,
  }),
  "payment.approved": (d) => ({
    subject: `Pago aprobado - pedido ${order(d)}`,
    text: `${greeting(d)}\n\nConfirmamos el pago de tu pedido ${order(d)}. Ya lo estamos preparando.${orderLink(d)}`,
  }),
  "order.preparing": (d) => ({
    subject: `Estamos preparando tu pedido ${order(d)}`,
    text: `${greeting(d)}\n\nTu pedido ${order(d)} está en preparación.${orderLink(d)}`,
  }),
  "order.shipped": (d) => ({
    subject: `Tu pedido ${order(d)} está en camino`,
    text: `${greeting(d)}\n\nDespachamos tu pedido ${order(d)}.${d.trackingCode ? `\nCódigo de seguimiento: ${d.trackingCode}` : ""}${orderLink(d)}`,
  }),
  "order.delivered": (d) => ({
    subject: `Pedido ${order(d)} entregado`,
    text: `${greeting(d)}\n\nTu pedido ${order(d)} fue entregado. ¡Gracias por tu compra! Podés dejar una reseña de los productos desde tu cuenta.${orderLink(d)}`,
  }),
  "inventory.low_stock": (d) => ({
    subject: `Stock bajo: ${d.productName}`,
    text: `El producto ${d.productName} (SKU ${d.sku}) tiene ${d.available} unidades disponibles.\n\n${d.siteUrl}/admin/inventario`,
  }),
};
