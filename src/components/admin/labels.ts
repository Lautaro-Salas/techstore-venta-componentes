import type {
  ContactStatus,
  DiscountType,
  InventoryMovementType,
  PaymentStatus,
  ProductStatus,
  ShipmentStatus,
  ShippingType,
} from "@prisma/client";
import type { BadgeTone } from "@/components/ui/badge";
import type { StockLevel } from "@/services/inventory/rules";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ARCHIVED: "Archivado",
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  INACTIVE: "warning",
  ARCHIVED: "danger",
};

export const STOCK_LEVEL_TONE: Record<StockLevel, BadgeTone> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "danger",
};

export const MOVEMENT_TYPE_LABEL: Record<InventoryMovementType, string> = {
  PURCHASE: "Ingreso",
  SALE: "Venta",
  RESERVATION: "Reserva",
  RELEASE: "Liberación",
  ADJUSTMENT: "Ajuste",
  RETURN: "Devolución",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reintegrado",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  REFUNDED: "neutral",
};

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: "Pendiente",
  READY: "Listo para despachar",
  SHIPPED: "Despachado",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
};

export const SHIPPING_TYPE_LABEL: Record<ShippingType, string> = {
  HOME_DELIVERY: "Envío a domicilio",
  PICKUP: "Retiro en local",
};

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  PERCENTAGE: "Porcentaje",
  FIXED: "Monto fijo",
};

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  NEW: "Nuevo",
  READ: "Leído",
  ANSWERED: "Respondido",
};

export const CONTACT_STATUS_TONE: Record<ContactStatus, BadgeTone> = {
  NEW: "primary",
  READ: "neutral",
  ANSWERED: "success",
};

export const INVOICE_TYPE_LABEL = {
  CONSUMIDOR_FINAL: "Consumidor final",
  FACTURA_A: "Factura A",
} as const;

export const CONTACT_REASON_LABEL: Record<string, string> = {
  GENERAL: "General",
  ORDER: "Pedido",
  WARRANTY: "Garantía",
  PRODUCT: "Producto",
  RETURN: "Devolución",
  TECHNICAL: "Técnico",
  OTHER: "Otro",
};

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Cliente",
  STAFF: "Staff",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export const PRODUCT_SORT_LABEL: Record<string, string> = {
  updated: "Última modificación",
  created: "Más recientes",
  name: "Nombre A-Z",
  price: "Precio mayor a menor",
  stock: "Stock mayor a menor",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  PRODUCT_CREATE: "Producto creado",
  PRODUCT_UPDATE: "Producto editado",
  PRODUCT_PRICE_CHANGE: "Precio modificado",
  PRODUCT_DELETE: "Producto eliminado",
  PRODUCT_DUPLICATE: "Producto duplicado",
  STOCK_ADJUST: "Stock ajustado",
  ORDER_STATUS: "Pedido actualizado",
  COUPON_CREATE: "Cupón creado",
  COUPON_UPDATE: "Cupón editado",
  COUPON_DELETE: "Cupón eliminado",
  PROMOTION_CREATE: "Promoción creada",
  PROMOTION_UPDATE: "Promoción editada",
  PROMOTION_DELETE: "Promoción eliminada",
  CATEGORY_CREATE: "Categoría creada",
  CATEGORY_UPDATE: "Categoría editada",
  CATEGORY_DELETE: "Categoría eliminada",
  BRAND_CREATE: "Marca creada",
  BRAND_UPDATE: "Marca editada",
  BRAND_DELETE: "Marca eliminada",
  SETTINGS_UPDATE: "Configuración modificada",
  MESSAGE_STATUS: "Mensaje actualizado",
  USER_UPDATE: "Usuario modificado",
};

export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  product: "Producto",
  order: "Pedido",
  inventory: "Inventario",
  coupon: "Cupón",
  promotion: "Promoción",
  category: "Categoría",
  brand: "Marca",
  settings: "Configuración",
  message: "Mensaje",
  user: "Usuario",
};
