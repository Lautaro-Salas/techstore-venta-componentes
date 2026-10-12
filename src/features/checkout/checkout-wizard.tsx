"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SummaryRow } from "@/components/cart/order-summary";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { placeOrderAction } from "./actions";
import { CheckoutSummary } from "./checkout-summary";
import { StepAddress } from "./steps/step-address";
import { StepContact } from "./steps/step-contact";
import { StepPayment } from "./steps/step-payment";
import { StepReview } from "./steps/step-review";
import { StepShipping } from "./steps/step-shipping";
import { CHECKOUT_STEPS, type CheckoutBootstrap } from "./types";
import { useCheckout } from "./use-checkout";

function Stepper({ step, onGo }: { step: number; onGo: (s: number) => void }) {
  return (
    <ol className="mb-6 flex items-center gap-1 sm:gap-2" aria-label="Pasos del checkout">
      {CHECKOUT_STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => onGo(i)} disabled={i >= step} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2 disabled:cursor-default">
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", i < step ? "bg-success text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted")}>
              {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("hidden text-sm md:inline", i === step ? "font-semibold" : "text-muted")}>{label}</span>
          </button>
          {i < CHECKOUT_STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-success" : "bg-border")} aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export function CheckoutWizard({ data }: { data: CheckoutBootstrap }) {
  const c = useCheckout(data);
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    track("begin_checkout", { value: data.cart.subtotal, items: data.cart.lines.map((l) => ({ item_id: l.productId, item_name: l.name, price: l.lineTotal / l.quantity, quantity: l.quantity })) });
  }, [data.cart]);

  const rows: SummaryRow[] = [{ label: "Subtotal", value: data.cart.subtotal }];
  const baseDiscount = data.cart.promotionDiscount + data.cart.couponDiscount;
  if (baseDiscount > 0) rows.push({ label: data.cart.discountLabel ?? "Descuentos", value: baseDiscount, tone: "discount" });
  if (c.totals.paymentDiscount > 0 && c.payment) rows.push({ label: `Descuento ${c.payment.name}`, value: c.totals.paymentDiscount, tone: "discount" });
  const shippingLabel = c.shipping ? (c.shipping.price === 0 ? "Gratis" : formatPrice(c.shipping.price)) : "A elegir";

  const submit = () => {
    if (!acceptTerms) return c.setErrors({ terms: "Tenés que aceptar los términos y condiciones" });
    startSubmit(async () => {
      const result = await placeOrderAction(c.payload());
      if (!result.ok) return c.setErrors({ submit: result.error, ...(result.fieldErrors ?? {}) });
      track("purchase", { transaction_id: String(result.data.orderNumber), value: c.totals.total });
      if (result.data.paymentFailed) {
        return c.setErrors({
          submit:
            "Tu pedido quedó registrado, pero no pudimos iniciar el pago. Contactanos para completarlo.",
        });
      }
      if (result.data.redirectUrl) window.location.assign(result.data.redirectUrl);
      else router.push(`/checkout/confirmacion/${result.data.orderId}`);
    });
  };

  const a = c.resolvedAddress;
  const blocks = [
    { title: "Datos personales", step: 0, lines: [`${c.state.contact.firstName ?? ""} ${c.state.contact.lastName ?? ""}`, c.state.contact.email ?? "", `${c.state.contact.documentType} ${c.state.contact.documentNumber ?? ""}`] },
    { title: "Entrega", step: 1, lines: a ? [`${a.street ?? ""} ${a.number ?? ""}`, `${a.city ?? ""}, ${a.province ?? ""} (${a.postalCode ?? ""})`] : ["Retiro en local"] },
    { title: "Envío", step: 2, lines: [c.shipping?.name ?? "", shippingLabel] },
    { title: "Pago", step: 3, lines: [c.payment?.name ?? "", c.payment?.supportsInstallments && c.state.installments > 1 ? `${c.state.installments} cuotas` : ""] },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="order-2 lg:order-1">
        <Stepper step={c.step} onGo={c.goTo} />
        <section className="card p-5 sm:p-6" aria-labelledby="step-title">
          <h1 id="step-title" className="mb-5 text-xl font-bold tracking-tight">
            {c.step + 1}. {["Tus datos", "Dirección de entrega", "Método de envío", "Método de pago", "Revisá y confirmá"][c.step]}
          </h1>
          {c.step === 0 && <StepContact value={c.state.contact} onChange={(contact) => c.update({ contact })} errors={c.errors} isAuthenticated={data.isAuthenticated} invoiceAEnabled={data.invoiceAEnabled} />}
          {c.step === 1 && (
            <StepAddress
              mode={c.state.deliveryMode}
              onModeChange={(deliveryMode) => c.update({ deliveryMode, shippingMethodCode: "" })}
              pickupAvailable={data.shippingQuotes.some((q) => q.type === "PICKUP")}
              homeAvailable={data.shippingQuotes.some((q) => q.type === "HOME_DELIVERY")}
              saved={data.savedAddresses}
              selectedId={c.state.selectedAddressId}
              onSelect={(selectedAddressId) => c.update({ selectedAddressId })}
              address={c.state.address}
              onAddressChange={(address) => c.update({ address })}
              saveAddress={c.state.saveAddress}
              onSaveAddressChange={(saveAddress) => c.update({ saveAddress })}
              isAuthenticated={data.isAuthenticated}
              errors={c.errors}
            />
          )}
          {c.step === 2 && <StepShipping quotes={c.quotesForMode} value={c.state.shippingMethodCode} onChange={(shippingMethodCode) => c.update({ shippingMethodCode })} error={c.errors.shipping} />}
          {c.step === 3 && (
            <StepPayment methods={c.paymentMethods} value={c.state.paymentMethodCode} onChange={(paymentMethodCode) => c.update({ paymentMethodCode })} installments={c.state.installments} onInstallmentsChange={(installments) => c.update({ installments })} plans={data.installmentPlans} amount={c.totals.total} error={c.errors.payment} />
          )}
          {c.step === 4 && (
            <StepReview blocks={blocks} onEdit={c.goTo} notes={c.state.notes} onNotesChange={(notes) => c.update({ notes })} acceptTerms={acceptTerms} onAcceptTermsChange={setAcceptTerms} error={c.errors.terms ?? c.errors.submit} />
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
            {c.step > 0 ? (
              <Button variant="ghost" onClick={c.back} icon={<ArrowLeft className="size-4" aria-hidden />}>Volver</Button>
            ) : <span />}
            {c.isLast ? (
              <Button size="lg" onClick={submit} loading={submitting} className="sm:min-w-56">Confirmar compra · {formatPrice(c.totals.total)}</Button>
            ) : (
              <Button size="lg" onClick={c.next} className="sm:min-w-48">Continuar</Button>
            )}
          </div>
        </section>
      </div>
      <div className="order-1 lg:order-2">
        <CheckoutSummary cart={data.cart} rows={rows} total={c.totals.total} shippingLabel={shippingLabel} />
      </div>
    </div>
  );
}
