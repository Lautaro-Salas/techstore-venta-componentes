import Link from "next/link";
import {
  Box,
  Cable,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Headphones,
  Keyboard,
  MemoryStick,
  Monitor,
  MonitorUp,
  Mouse,
  Plug,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategoryNode } from "@/types/catalog";

const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  "circuit-board": CircuitBoard,
  "memory-stick": MemoryStick,
  gpu: Zap,
  "hard-drive": HardDrive,
  plug: Plug,
  box: Box,
  fan: Fan,
  keyboard: Keyboard,
  mouse: Mouse,
  headphones: Headphones,
  monitor: Monitor,
  cable: Cable,
  "monitor-up": MonitorUp,
};

export function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Box;
  return <Icon className={className} aria-hidden />;
}

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={c.href}
            className="card hover:border-primary/40 flex h-full flex-col items-center gap-3 px-3 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="bg-cta-soft text-primary ring-primary/25 grid size-12 place-items-center rounded-2xl ring-1">
              <CategoryIcon name={c.icon} className="size-6" />
            </span>
            <span className="text-xs font-semibold sm:text-sm">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
