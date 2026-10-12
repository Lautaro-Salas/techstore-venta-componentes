"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type PermissionSubject } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isActivePath } from "./nav-items";

interface Props {
  subject: PermissionSubject;
  onNavigate?: () => void;
}

/** Navegación del panel. Solo muestra lo que el usuario puede usar (el backend vuelve a validar). */
export function AdminNav({ subject, onNavigate }: Props) {
  const pathname = usePathname();
  const sections = ADMIN_NAV.map((s) => ({ ...s, items: s.items.filter((i) => hasPermission(subject, i.permission)) })).filter(
    (s) => s.items.length > 0,
  );

  return (
    <nav aria-label="Panel administrativo" className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted uppercase">{section.title}</p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
