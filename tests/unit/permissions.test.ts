import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

const subject = (role: string, permissions: readonly string[]) => ({ role, permissions });

describe("hasPermission", () => {
  it("sin sujeto no tiene permisos", () => {
    expect(hasPermission(null, "admin:access")).toBe(false);
    expect(hasPermission(undefined, "orders:read")).toBe(false);
  });

  it("CUSTOMER no accede al admin", () => {
    expect(hasPermission(subject("CUSTOMER", []), "admin:access")).toBe(false);
    expect(hasPermission(subject("CUSTOMER", []), "products:read")).toBe(false);
  });

  it("STAFF escribe productos pero no borra ni toca configuración", () => {
    const staff = subject("STAFF", ROLE_PERMISSIONS.STAFF);
    expect(hasPermission(staff, "admin:access")).toBe(true);
    expect(hasPermission(staff, "products:write")).toBe(true);
    expect(hasPermission(staff, "orders:write")).toBe(true);
    expect(hasPermission(staff, "products:delete")).toBe(false);
    expect(hasPermission(staff, "settings:write")).toBe(false);
    expect(hasPermission(staff, "users:manage")).toBe(false);
  });

  it("ADMIN hereda STAFF y suma borrado, descuentos y configuración", () => {
    const admin = subject("ADMIN", ROLE_PERMISSIONS.ADMIN);
    expect(hasPermission(admin, "products:delete")).toBe(true);
    expect(hasPermission(admin, "discounts:write")).toBe(true);
    expect(hasPermission(admin, "settings:write")).toBe(true);
    expect(hasPermission(admin, "users:manage")).toBe(false);
  });

  it("SUPER_ADMIN tiene todos los permisos aunque la lista venga vacía", () => {
    expect(hasPermission(subject("SUPER_ADMIN", []), "users:manage")).toBe(true);
    expect(hasPermission(subject("SUPER_ADMIN", []), "settings:write")).toBe(true);
    for (const key of Object.keys(PERMISSIONS)) {
      expect(hasPermission(subject("SUPER_ADMIN", []), key as Permission)).toBe(true);
    }
  });

  it("un sujeto con rol desconocido sólo tiene lo que la lista declara", () => {
    expect(hasPermission(subject("GHOST", ["orders:read"]), "orders:read")).toBe(true);
    expect(hasPermission(subject("GHOST", ["orders:read"]), "orders:write")).toBe(false);
  });
});

describe("ROLE_PERMISSIONS", () => {
  it("cubre exactamente los roles definidos", () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual([...ROLES].sort());
  });

  it("SUPER_ADMIN cubre todos los permisos y CUSTOMER ninguno", () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toHaveLength(Object.keys(PERMISSIONS).length);
    expect(ROLE_PERMISSIONS.CUSTOMER).toHaveLength(0);
  });

  it("ADMIN incluye todo lo de STAFF", () => {
    for (const p of ROLE_PERMISSIONS.STAFF) {
      expect(ROLE_PERMISSIONS.ADMIN).toContain(p);
    }
  });
});
