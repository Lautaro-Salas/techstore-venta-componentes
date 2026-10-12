import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-cta text-primary-foreground shadow-sm shadow-primary/20 hover:brightness-105 hover:shadow-md hover:shadow-primary/30",
  secondary: "bg-surface-2 text-foreground hover:bg-border",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-foreground hover:bg-surface-2",
  danger: "bg-danger text-primary-foreground hover:opacity-90",
  link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
} as const;

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function buttonClasses(
  { variant = "primary", size = "md", fullWidth }: StyleProps = {},
  className?: string,
) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-safe:transition-transform",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

interface ButtonProps extends ComponentProps<"button">, StyleProps {
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link>, StyleProps {
  icon?: ReactNode;
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth }, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
