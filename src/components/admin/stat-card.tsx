import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
} as const;

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
  href?: string;
}

export function StatCard({ label, value, hint, icon, tone = "primary", href }: Props) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className={cn("rounded-xl p-2 [&_svg]:size-5", TONES[tone])} aria-hidden>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const className = "card block p-4 sm:p-5";
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:border-primary/50")}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
