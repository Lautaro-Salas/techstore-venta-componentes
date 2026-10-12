"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { applyCouponAction, removeCouponAction } from "@/features/cart/actions";

export function CouponForm({ appliedCode, error }: { appliedCode: string | null; error: string | null }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await applyCouponAction(code);
      if (!result.ok) return setMessage(result.error);
      setCode("");
      toast.success("Cupón aplicado");
    });
  };

  if (appliedCode) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2 text-sm">
          <span className="flex items-center gap-2 font-medium text-primary"><Tag className="size-4" aria-hidden /> {appliedCode}</span>
          <button type="button" onClick={() => startTransition(async () => { await removeCouponAction(); })} disabled={pending} className="rounded p-1 text-primary hover:bg-surface" aria-label="Quitar cupón">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {error && <p className="text-xs font-medium text-warning" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <label htmlFor="coupon" className="text-sm font-medium">¿Tenés un cupón?</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" maxLength={40} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40" aria-invalid={message ? true : undefined} aria-describedby={message ? "coupon-error" : undefined} />
        <Button type="submit" variant="outline" size="sm" className="h-10" loading={pending} disabled={!code.trim()}>Aplicar</Button>
      </div>
      {message && <p id="coupon-error" className="text-xs font-medium text-danger" role="alert">{message}</p>}
    </form>
  );
}
