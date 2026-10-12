import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted/70 " +
  "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/30";

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, required, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-danger" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

interface CommonProps {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

function a11y(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function Input({ label, hint, error, containerClassName, className, id, required, ...props }: ComponentProps<"input"> & CommonProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <input id={fieldId} required={required} className={cn(CONTROL, "h-11", className)} {...a11y(fieldId, error, hint)} {...props} />
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, containerClassName, className, id, required, ...props }: ComponentProps<"textarea"> & CommonProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <textarea id={fieldId} required={required} className={cn(CONTROL, "min-h-28 py-2.5", className)} {...a11y(fieldId, error, hint)} {...props} />
    </FieldShell>
  );
}

interface SelectProps extends ComponentProps<"select">, CommonProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, hint, error, containerClassName, className, id, required, options, placeholder, ...props }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <select id={fieldId} required={required} className={cn(CONTROL, "h-11 pr-8", className)} {...a11y(fieldId, error, hint)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function Checkbox({ label, className, id, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={cn("flex cursor-pointer items-start gap-2.5 text-sm", className)}>
      <input id={fieldId} type="checkbox" className="mt-0.5 size-4 shrink-0 rounded border-border accent-[var(--primary)]" {...props} />
      <span>{label}</span>
    </label>
  );
}
