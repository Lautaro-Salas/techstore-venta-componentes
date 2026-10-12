import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
          {subtitle && <p className="text-muted mt-2 text-sm leading-relaxed">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="text-muted mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const cls = {
    error: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-primary-soft text-primary",
  }[tone];
  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm font-medium ${cls}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
