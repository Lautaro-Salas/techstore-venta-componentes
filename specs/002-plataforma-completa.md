# SPEC-002: Plataforma e-commerce completa (Argentina)

Extiende SPEC-001. Define arquitectura, modelo de datos y fases de implementación.

## 1. Decisiones técnicas

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript estricto | Stack definido en AGENT.md |
| Backend | Integrado en Next (Server Components, Server Actions, Route Handlers) | La escala inicial lo justifica; la lógica vive en `src/services` y es portable |
| Base de datos | PostgreSQL + Prisma 6 | Relacional, transacciones para stock, `pg_trgm` para búsqueda tolerante |
| Carrito | Persistido en PostgreSQL (cookie `cart_id` para invitados) | Transaccional con stock. Redis queda como capa de caché opcional (`src/lib/cache`) |
| Auth | Sesiones propias en DB (token aleatorio, hash SHA-256, cookie httpOnly) + bcrypt | Control total de verificación de email, reset y RBAC sin dependencias beta |
| Validación | Zod (compartido frontend/backend) | Un único esquema por formulario |
| Estilos | Tailwind 4 + tokens CSS (claro/oscuro) | Colores configurables desde admin |
| Tests | Vitest (unit + integración) + Playwright (E2E) | Definido en AGENT.md |

## 2. Capas

```
src/app          → rutas (UI + composición). Sin lógica de negocio.
src/components   → UI reutilizable (ui/, layout/, product/, ...)
src/features     → componentes + acciones por dominio (cart, checkout, admin, ...)
src/services     → lógica de negocio (cart, orders, inventory, pricing, payments, shipping, notifications, ...)
src/lib          → infraestructura (db, env, auth, rbac, errores, rate-limit, formato)
src/schemas      → esquemas Zod
src/types        → tipos compartidos
database/        → schema.prisma + seed
tests/           → unit, integration, e2e
```

Integraciones externas mediante interfaces + registro de proveedores habilitados por variables de entorno:
`PaymentProvider`, `ShippingProvider`, `NotificationChannel`, `StorageProvider`.
Ningún proveedor externo se activa sin credenciales.

## 3. Fases

1. Arquitectura + configuración
2. Base de datos + modelos + seed
3. Autenticación + RBAC
4. Storefront (layout, home, header, footer)
5. Catálogo (categorías, filtros, búsqueda)
6. Producto (ficha, specs, compatibilidad, relacionados)
7. Carrito
8. Checkout
9. Cuenta de usuario
10. Admin
11. Reviews + favoritos + comparación
12. SEO + performance
13. Testing
14. Refactor
15. Documentación

Cada fase cierra con: lint, typecheck, tests y build.
