"use client";

import { useMemo, useState } from "react";
import { validate } from "@/lib/validation";
import { contactStepSchema } from "@/schemas/checkout";
import { addressSchema } from "@/schemas/customer";
import { checkoutTotals } from "./totals";
import type { CheckoutBootstrap, CheckoutState, DeliveryMode } from "./types";

const FIRST_STEP = 0;
const LAST_STEP = 4;

function initialMode(data: CheckoutBootstrap): DeliveryMode {
  return data.shippingQuotes.some((q) => q.type === "HOME_DELIVERY") ? "HOME_DELIVERY" : "PICKUP";
}

/** Estado y validación por paso del checkout. */
export function useCheckout(data: CheckoutBootstrap) {
  const defaultAddress = data.savedAddresses.find((a) => a.isDefault) ?? data.savedAddresses[0];
  const [step, setStep] = useState(FIRST_STEP);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<CheckoutState>(() => ({
    contact: { documentType: "DNI", invoiceType: "CONSUMIDOR_FINAL", ...data.contactDefaults },
    deliveryMode: initialMode(data),
    selectedAddressId: defaultAddress?.id ?? null,
    address: {},
    saveAddress: true,
    shippingMethodCode: "",
    paymentMethodCode: data.paymentMethods[0]?.code ?? "",
    installments: 1,
    notes: "",
  }));

  const update = (patch: Partial<CheckoutState>) => setState((s) => ({ ...s, ...patch }));

  const quotesForMode = useMemo(() => data.shippingQuotes.filter((q) => q.type === state.deliveryMode), [data.shippingQuotes, state.deliveryMode]);
  const shipping = quotesForMode.find((q) => q.code === state.shippingMethodCode) ?? null;
  const paymentMethods = data.paymentMethods.filter((m) => !m.requiresPickup || state.deliveryMode === "PICKUP");
  const payment = paymentMethods.find((m) => m.code === state.paymentMethodCode) ?? null;

  const totals = checkoutTotals({
    subtotal: data.cart.subtotal,
    promotionDiscount: data.cart.promotionDiscount,
    couponDiscount: data.cart.couponDiscount,
    shippingPrice: shipping?.price ?? null,
    paymentDiscountPercent: payment?.discountPercent ?? 0,
  });

  const resolvedAddress = state.deliveryMode === "PICKUP" ? null : state.selectedAddressId ? data.savedAddresses.find((a) => a.id === state.selectedAddressId) ?? null : state.address;

  function validateStep(target: number): boolean {
    let result: Record<string, string> = {};
    if (target === 0) {
      const r = validate(contactStepSchema, state.contact);
      if (!r.ok) result = r.errors;
    }
    if (target === 1 && state.deliveryMode === "HOME_DELIVERY" && !state.selectedAddressId) {
      const r = validate(addressSchema, state.address);
      if (!r.ok) result = Object.fromEntries(Object.entries(r.errors).map(([k, v]) => [`address.${k}`, v]));
    }
    if (target === 2 && !shipping) result = { shipping: "Elegí un método de envío" };
    if (target === 3 && !payment) result = { payment: "Elegí un medio de pago" };
    setErrors(result);
    return Object.keys(result).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step === 1 && !quotesForMode.some((q) => q.code === state.shippingMethodCode)) {
      update({ shippingMethodCode: quotesForMode[0]?.code ?? "" });
    }
    if (step === 2 && !paymentMethods.some((m) => m.code === state.paymentMethodCode)) {
      update({ paymentMethodCode: paymentMethods[0]?.code ?? "" });
    }
    setStep((s) => Math.min(s + 1, LAST_STEP));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, FIRST_STEP));
  }

  function goTo(target: number) {
    if (target < step) {
      setErrors({});
      setStep(target);
    }
  }

  function payload() {
    return {
      contact: state.contact,
      shippingMethodCode: state.shippingMethodCode,
      address: resolvedAddress ? stripId(resolvedAddress) : null,
      saveAddress: state.deliveryMode === "HOME_DELIVERY" && !state.selectedAddressId && state.saveAddress,
      paymentMethodCode: state.paymentMethodCode,
      installments: payment?.supportsInstallments ? state.installments : 1,
      notes: state.notes,
    };
  }

  return { step, errors, setErrors, state, update, quotesForMode, shipping, paymentMethods, payment, totals, resolvedAddress, next, back, goTo, payload, isLast: step === LAST_STEP };
}

function stripId<T extends object>(address: T): Omit<T, "id" | "isDefault"> {
  return Object.fromEntries(Object.entries(address).filter(([key]) => key !== "id" && key !== "isDefault")) as Omit<T, "id" | "isDefault">;
}
