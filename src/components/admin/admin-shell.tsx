"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Drawer } from "@/components/ui/modal";
import { logoutAction } from "@/features/auth/actions";
import type { PermissionSubject } from "@/lib/auth/permissions";
import { AdminNav } from "./admin-sidebar";

interface Props {
  storeName: string;
  userName: string;
  subject: PermissionSubject;
  children: ReactNode;
}

export function AdminShell({ storeName, userName, subject, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <a href="#admin-contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r border-border bg-surface px-3 py-5 lg:block">
        <Link href="/admin" className="mb-6 block px-3 text-lg font-bold tracking-tight">
          {storeName} <span className="text-sm font-medium text-muted">Admin</span>
        </Link>
        <AdminNav subject={subject} />
      </aside>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={`${storeName} · Admin`} side="left">
        <AdminNav subject={subject} onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-xl p-2.5 hover:bg-surface-2 lg:hidden"
            aria-label="Abrir menú del panel"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <p className="truncate font-semibold lg:hidden">{storeName}</p>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden px-2 text-sm text-muted sm:inline">Hola, <strong className="text-foreground">{userName}</strong></span>
            <Link href="/" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-2">
              <ExternalLink className="size-4" aria-hidden />
              <span className="hidden sm:inline">Ver tienda</span>
              <span className="sr-only sm:hidden">Ver tienda</span>
            </Link>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground">
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Salir</span>
                <span className="sr-only sm:hidden">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </header>
        <main id="admin-contenido" className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
