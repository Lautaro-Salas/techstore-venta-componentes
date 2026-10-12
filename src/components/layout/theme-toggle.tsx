"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { Dropdown, dropdownItemClass } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Laptop },
] as const;

const noop = () => () => {};

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const CurrentIcon = mounted && resolvedTheme === "dark" ? Moon : Sun;

  return (
    <Dropdown
      trigger={({ toggle, open, id }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label="Cambiar tema" className="rounded-xl p-2.5 text-muted hover:bg-surface-2 hover:text-foreground">
          <CurrentIcon className="size-5" aria-hidden />
        </button>
      )}
      className="min-w-40"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button key={value} type="button" onClick={() => setTheme(value)} className={cn(dropdownItemClass, mounted && theme === value && "font-semibold text-primary")} aria-pressed={mounted && theme === value}>
          <Icon className="size-4" aria-hidden /> {label}
        </button>
      ))}
    </Dropdown>
  );
}
