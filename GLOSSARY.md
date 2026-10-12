# Glosario de dominio y módulos

Vocabulario compartido para las revisiones de arquitectura (`Skills/improve-codebase-architecture`).
Se actualiza cuando un término del dominio o un módulo "deep" nuevo queda fijo en el código.

## Módulos

- **Transiciones de pedido** (`src/services/orders/transitions.ts` + `transition-effects.ts`):
  el único lugar que decide qué pasa con stock, pago y envío cuando un pedido cambia de
  estado. `planOrderTransition` es la función pura (decisiones testeables sin base de datos);
  `applyTransitionEffects` aplica el plan dentro de la transacción. Lo consumen el cambio de
  estado admin, el webhook de Mercado Pago y la confirmación del checkout.
- **Dominios de revalidación** (`src/lib/cache/revalidate.ts`): cada mutación declara su
  dominio (`revalidateProductDomain`, `revalidateCatalogDomain`, `revalidateCommerceConfig`,
  `revalidateDiscounts`, `revalidateInventory`, `revalidateOrders`, `revalidateCart`) y las
  rutas dependientes salen de un único lugar. Agregar una ruta = un edit.
- **Query admin** (`src/lib/admin/query.ts`): paginación, búsqueda y parámetros de las
  secciones admin (`ADMIN_PAGE_SIZE`, `readParam`, `readPage`, `totalPages`, `hrefWith`,
  `withSearchAnd`). Los services admin no dependen de componentes de UI.
- **Cobro itemizado** (`src/services/payments/charge.ts`): produce los ítems que un proveedor
  de pago va a cobrar, con la invariante `sum(items) == subtotal - descuentos + envío`
  (= `order.total`). Puro y testeable; lo consume el proveedor de Mercado Pago y el webhook
  valida el importe cobrado contra el mismo total.

## Dominio

- **Pedido** (Order): reserva stock al crearse (PENDING); al confirmarse la reserva se
  convierte en venta (CONFIRMED) y se acredita el pago; al cancelarse se libera la reserva
  o se devuelve lo vendido (CANCELLED). `canTransition` en `status.ts` valida los saltos.