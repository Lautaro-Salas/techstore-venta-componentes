import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterTab {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

/** Filtros como links (funcionan sin JavaScript y conservan la URL compartible). */
export function FilterTabs({ tabs, label }: { tabs: FilterTab[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex gap-1.5 whitespace-nowrap">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors",
                tab.active ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums">{tab.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
