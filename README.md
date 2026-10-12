# TechStore AR — E-commerce de tecnología para Argentina

Tienda online de hardware, periféricos y monitores pensada para operar en Argentina: precios en ARS con IVA incluido, DNI/CUIT, Factura A/B, códigos postales argentinos, transferencia bancaria con descuento, Mercado Pago (tarjetas y cuotas) y envíos configurables.

> **Estado de los datos:** el catálogo, los cupones y las promociones del seed son **DEMO** y deben reemplazarse por datos reales. Los textos legales son plantillas que tiene que revisar un profesional.

---

## Funcionalidades

| Área | Incluye |
| --- | --- |
| Catálogo | Categorías jerárquicas con URLs limpias (`/componentes/placas-de-video`), filtros por marca, precio, stock y especificaciones técnicas, orden, paginación y estados vacíos |
| Búsqueda | Por nombre, SKU, marca y categoría. Autocompletado con debounce, tolerancia a errores de tipeo (`pg_trgm` + Levenshtein) y "¿Quisiste decir…?" |
| Producto | Galería, tabla de especificaciones que cambia según el producto, cuotas, precio con transferencia, precio sin impuestos nacionales, stock real, garantía, reseñas, "Completá tu setup" (compatible), relacionados y vistos recientemente |
| Compatibilidad | Motor extensible de reglas (CPU↔Motherboard, RAM↔Motherboard, GPU↔Fuente/Gabinete, Motherboard↔Gabinete, Cooler↔CPU/Gabinete). Se usa en recomendaciones y avisos del carrito |
| Carrito | Persistente en la base (invitado por cookie, se fusiona al iniciar sesión), cantidades, cupones, promociones automáticas, "Te faltan $X para…", sugerencias y validación de stock |
| Checkout | 5 pasos (datos, dirección, envío, pago, confirmación), resumen siempre visible, compra como invitado, Factura A con CUIT, reserva de stock transaccional |
| Cuenta | Registro, login, logout, verificación de email, recuperación de contraseña, perfil, direcciones, pedidos con timeline, favoritos, reseñas y configuración |
| Comparador | Hasta 4 productos de la misma categoría, con las diferencias resaltadas |
| Admin (`/admin`) | Dashboard con gráficos, productos (CRUD, duplicar, activar/desactivar, imágenes), inventario y movimientos, pedidos con cambio de estado, clientes, cupones y promociones, configuración de tienda, envíos, pagos y cuotas, mensajes de contacto |
| Contenido | Contacto con anti-spam, FAQ con acordeones, páginas legales, nosotros |
| Transversal | Modo claro, oscuro y sistema, responsive mobile-first (navegación inferior y filtros en drawer), accesibilidad, SEO (metadata, Open Graph, canonical, sitemap, robots, Schema.org Product/Breadcrumb/FAQ/Store), analytics opcional, botón de WhatsApp |

## Tecnologías

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript estricto**
- **Tailwind CSS 4** con tokens de diseño propios (color de marca configurable)
- **SQLite** embebido (no hay que instalar ningún servidor de base de datos) + **Prisma 6**
- **Zod 4**: los mismos esquemas validan en frontend y backend
- Autenticación propia: sesiones en base de datos, cookies httpOnly, bcrypt
- **Vitest** (unit + integración) y **Playwright** (E2E)
- **ESLint** + **Prettier**

## Arquitectura

```
src/
  app/            Rutas. (store) = tienda, (checkout) = checkout sin distracciones, admin = panel, api = endpoints
  components/     UI reutilizable: ui/ (Button, Input, Modal, Drawer, Toast…), layout/, product/, cart/, order/
  features/       Componentes cliente + server actions por dominio (cart, checkout, auth, account, admin…)
  services/       Lógica de negocio y acceso a datos (sin UI)
    */rules.ts    Reglas puras y testeables (precios, descuentos, carrito, inventario, compatibilidad, búsqueda)
    payments/     Interfaz PaymentProvider + transferencia, efectivo en local, Mercado Pago
    shipping/     Interfaz ShippingProvider + tarifa fija, retiro; Andreani/OCA/Correo Argentino/Mercado Envíos preparados (deshabilitados)
    notifications Interfaz NotificationChannel + email (SMTP) y WhatsApp Business
    storage/      Interfaz StorageProvider (local; reemplazable por S3 o similar)
  lib/            Infraestructura: db, env, auth (sesiones, RBAC, guards), errores, rate limit, formato
  schemas/        Esquemas Zod compartidos
  hooks/, types/
database/         schema.prisma + seed/
tests/            unit/, integration/, e2e/
```

**Principios:**
- La UI no contiene lógica de negocio.
- Las reglas de negocio son funciones puras con tests.
- Las integraciones externas se activan solo si existen credenciales en variables de entorno. Sin credenciales no se muestran ni se simulan.

### Roles (RBAC)

`CUSTOMER`, `STAFF`, `ADMIN` y `SUPER_ADMIN`. Los permisos están en `src/lib/auth/permissions.ts`, el seed los sincroniza con las tablas `Role`/`Permission`/`RolePermission`, y se verifican en el backend (páginas, server actions) y en el frontend (menús).

### Seguridad

- Validación con Zod en cliente y servidor.
- Contraseñas con bcrypt y sesiones con token aleatorio: en la base solo se guarda su hash SHA-256.
- Cookies httpOnly + SameSite.
- Server Actions con verificación de origen integrada (CSRF).
- Rate limiting en login, registro, recuperación, contacto, búsqueda y checkout.
- Honeypot y tiempo mínimo en el formulario de contacto.
- Validación de imágenes por MIME, tamaño y magic bytes.
- Cabeceras de seguridad.
- Errores sin stack traces para el usuario.
- Webhooks con firma verificada.

## Instalación

Requisitos: **Node.js 20.9+** (probado con 24 LTS). No hace falta instalar ninguna base de datos: se usa **SQLite embebido** (un archivo local creado por Prisma).

```bash
npm install
cp .env.example .env      # completar variables (ver abajo)
npm run db:push           # crea las tablas (o db:migrate para migraciones versionadas)
npm run db:seed           # datos demo + roles + admin inicial
npm run dev               # http://localhost:3000
```

**Base de datos sin servidor:** `DATABASE_URL=file:./dev.db` apunta a un archivo local (`database/dev.db`). `npm run db:push` lo crea automáticamente; `npm run db:seed` lo carga con datos demo. Para migrar a PostgreSQL en el futuro, basta cambiar `provider = "postgresql"` en `database/schema.prisma` y la URL.

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Las principales:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Archivo SQLite local (`file:./dev.db`) |
| `AUTH_SECRET` | Secreto de 32+ caracteres (obligatorio) |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, sitemap, links de emails) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Administrador inicial creado por el seed |
| `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_*` | Valores por defecto (después se editan en `/admin/configuracion`) |
| `SMTP_*` | Envío de emails. Sin SMTP, en desarrollo los emails se registran en el log del servidor |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | Habilitan Mercado Pago (tarjetas y cuotas) |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Notificaciones por WhatsApp Business |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Analytics (opcional) |
| `TEST_DATABASE_URL` | Base exclusiva para tests de integración y E2E (**se borra**) |

`.env` está en `.gitignore`: **nunca lo subas al repositorio**.

## Configuración de la tienda

Desde `/admin/configuracion` se editan, sin tocar código:
- nombre, logo, color de marca, email, WhatsApp, teléfono, dirección, horarios y redes sociales;
- datos bancarios, IVA y visualización del precio sin impuestos, y habilitación de Factura A;
- métodos de envío (costos, umbral de envío gratis, plazos), medios de pago (descuentos) y planes de cuotas.

## Base de datos

El modelo está en `database/schema.prisma`:
- usuarios, roles, permisos y sesiones;
- productos, categorías, marcas, imágenes, variantes y especificaciones;
- inventario por depósito y movimientos;
- carritos, pedidos, items e historial de estados;
- pagos y envíos, con sus métodos configurables;
- direcciones, favoritos, reseñas, cupones y promociones;
- notificaciones, mensajes de contacto y configuración.

Índices en búsquedas frecuentes y búsqueda por coincidencia parcial (`LIKE`, sin distinción de mayúsculas) con sugerencia "¿quizás buscabas…?" vía Levenshtein. El stock disponible se desnormaliza en `Product.availableStock`, siempre actualizado por `inventory.service` dentro de la misma transacción, y las reservas usan `UPDATE` condicional para evitar sobreventa.

## Testing

```bash
npm test                  # unit tests (sin base de datos)
npm run test:integration  # integración contra TEST_DATABASE_URL
npm run test:e2e          # Playwright: build + start en :3100 contra TEST_DATABASE_URL
npm run lint
npm run typecheck
```

## Build y deployment

```bash
npm run build
npm run db:deploy   # en producción, con migraciones
npm run start
```

- **Migración futura a PostgreSQL/SQLite remoto:** cambiar `provider` en `database/schema.prisma`, ajustar `DATABASE_URL` y ejecutar `npm run db:push`. El código de servicios no usa SQL específico de un motor más allá de los ajustes ya portables.
  - Las imágenes subidas desde el admin usan almacenamiento local (`public/uploads`). En serverless hay que implementar `StorageProvider` con S3, R2 o Cloudinary.
  - El rate limit es en memoria. Con varias instancias, reemplazar el store por Redis (`src/lib/rate-limit.ts`).
- **VPS o Docker:** `npm run build && npm run start` detrás de un proxy con HTTPS.

### Nota sobre discos FAT32

Este repositorio se desarrolló en un disco **FAT32**, que no soporta enlaces simbólicos. Por eso:
- los scripts usan `--webpack` en lugar de Turbopack;
- la carpeta de build es configurable con `NEXT_DIST_DIR` (por defecto `.next-app`).

En NTFS, ext4 o APFS se puede volver a Turbopack quitando `--webpack`.

## Integraciones preparadas

| Integración | Dónde | Cómo activarla |
| --- | --- | --- |
| Mercado Pago | `src/services/payments/providers/mercadopago.ts` + `/api/webhooks/mercadopago` | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` |
| Transportistas | `src/services/shipping/providers.ts` | Implementar `quote()` del transportista y crear un `ShippingMethod` con `provider` igual a su código |
| Email | `src/services/notifications/channels.ts` | `SMTP_*` |
| WhatsApp Business | ídem | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Analytics | `src/lib/analytics.ts` (eventos `product_view`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `search`, `wishlist_add`) | IDs `NEXT_PUBLIC_*` |
| Facturación electrónica / ERP | Pedidos con tipo de factura, CUIT y razón social | Agregar un servicio que consuma los pedidos confirmados |
