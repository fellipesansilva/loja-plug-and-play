"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { usePresetRouter } from "@/components/store/StoreLink";
import { useState, type FormEvent } from "react";
import type { Order } from "@/domain/types";
import { buildOrder } from "@/lib/checkout";
import {
  ADDRESS_FIELDS,
  CARD_FIELDS,
  IDENTIFICATION_FIELDS,
  composeAddress,
  firstInvalid,
  validateAddress,
  validateCard,
  validateIdentification,
  type AddressForm,
  type CardForm,
  type Errors,
  type Identification,
} from "@/lib/checkout-validation";
import { installmentPlan } from "@/lib/installments";
import { formatBRL } from "@/lib/money";
import {
  BOLETO_DUE_BUSINESS_DAYS,
  CARD_DEMO_WARNING,
  boletoDueDate,
  fakeBoletoLine,
  fakePixCode,
  nextOrderId,
  processCard,
} from "@/lib/payment";
import { pixPricing } from "@/lib/pix";
import { maskCep } from "@/lib/shipping";
import type { PaymentMethod } from "@/lib/totals";
import { maskCardNumber, maskCpf, maskCpfForStorage, maskExpiry, maskPhone, onlyDigits, simulateCepLookup } from "@/lib/validation";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { FormField } from "./FormField";
import { PageTitle } from "./PageTitle";
import { ShippingRow } from "./ShippingRow";
import { useCartPricing } from "./useCartPricing";
import { useCartWords } from "./useCartWords";

type Step = "id" | "delivery" | "payment";
const STEP_LABEL: Record<Step, string> = { id: "Identificação", delivery: "Entrega", payment: "Pagamento" };

function StepIndicator({ steps, current }: { steps: Step[]; current: Step }) {
  const index = steps.indexOf(current);
  return (
    <ol aria-label="Etapas do checkout" className="mt-md flex gap-sm" data-testid="steps">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={s === current ? "step" : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-button border px-3 py-2 text-sm font-bold ${
            s === current ? "border-text bg-text text-background" : i < index ? "border-primary text-primary" : "border-border text-muted"
          }`}
        >
          <span aria-hidden="true">{i + 1}</span>
          <span className="truncate">{STEP_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

function OrderSummary({ pricing, method }: { pricing: ReturnType<typeof useCartPricing>; method: PaymentMethod }) {
  const totals = pricing.totalsFor(method);
  // Aberto por padrão em tela larga; recolhido no celular.
  const [open, setOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  const { selected } = pricing;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="order-first rounded-lg border border-border bg-surface p-md md:order-last md:sticky md:top-md"
      data-testid="order-summary"
    >
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-md font-bold">
        <span>Resumo do pedido</span>
        <span data-testid="summary-total">{formatBRL(totals.total)}</span>
      </summary>
      <ul className="mt-sm flex flex-col gap-xs text-sm">
        {pricing.lines.map(({ line, product, variantLabel, addons, total, availability }) => (
          <li key={line.lineId} className="flex justify-between gap-md">
            <span>
              {line.qty}× {product.name}
              {variantLabel ? ` · ${variantLabel}` : ""}
              {addons.length > 0 && <span className="block text-muted">+ {addons.map((a) => a.label).join(", ")}</span>}
            </span>
            <span className={availability.status === "ok" ? "" : "text-right text-muted"}>
              {availability.status === "ok" ? (
                formatBRL(total)
              ) : (
                <>
                  <s>{formatBRL(total)}</s>
                  <span className="block text-xs">não incluído no total</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-sm flex flex-col gap-xs border-t border-border pt-sm text-sm">
        <div className="flex justify-between gap-md">
          <dt>Subtotal</dt>
          <dd>{formatBRL(totals.subtotal)}</dd>
        </div>
        {totals.couponDiscount > 0 && (
          <div className="flex justify-between gap-md text-success">
            <dt>Cupom</dt>
            <dd>−{formatBRL(totals.couponDiscount)}</dd>
          </div>
        )}
        {totals.pixDiscount > 0 && (
          <div className="flex justify-between gap-md text-success">
            <dt>Desconto no Pix</dt>
            <dd data-testid="summary-pix-discount">−{formatBRL(totals.pixDiscount)}</dd>
          </div>
        )}
        <ShippingRow
          testId="summary-shipping"
          kind={pricing.allDigital ? "digital" : selected ? (selected.kind === "pickup" ? "pickup" : "ship") : "pending"}
          price={selected?.price}
          pending="—"
        />
        <div className="flex justify-between gap-md border-t border-border pt-sm text-base font-extrabold">
          <dt>Total</dt>
          <dd>{formatBRL(totals.total)}</dd>
        </div>
      </dl>
    </details>
  );
}

export function CheckoutView() {
  const hydrated = useHydrated();
  const pricing = useCartPricing();
  const words = useCartWords();
  const [placing, setPlacing] = useState(false);

  if (placing) {
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <h1 className="text-3xl">Finalizando…</h1>
      </section>
    );
  }

  if (pricing.lines.length === 0 || (!pricing.allDigital && !pricing.selected)) {
    const empty = pricing.lines.length === 0;
    return (
      <section className="mx-auto w-full max-w-5xl px-md py-lg">
        <PageTitle title="Checkout" />
        <h1 className="text-3xl">Checkout</h1>
        {hydrated ? (
          <div className="mt-md rounded-lg border border-border bg-surface p-lg text-center">
            <p className="font-medium" data-testid="checkout-blocked">
              {empty ? words.empty : "Escolha a forma de entrega antes de continuar"}
            </p>
            <Link
              href={empty ? "/" : "/carrinho"}
              className="mt-md inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background"
            >
              {empty ? "Ir para a home" : words.back}
            </Link>
          </div>
        ) : (
          <p className="mt-md text-muted">Carregando…</p>
        )}
      </section>
    );
  }
  return <CheckoutFlow pricing={pricing} onPlacing={() => setPlacing(true)} />;
}

function CheckoutFlow({ pricing, onPlacing }: { pricing: ReturnType<typeof useCartPricing>; onPlacing: () => void }) {
  const router = usePresetRouter();
  const orders = useDemoStore((s) => s.orders);
  const placeOrder = useDemoStore((s) => s.placeOrder);
  const { config, allDigital, selected, checkout } = pricing;
  const words = useCartWords();
  const blockedItems = pricing.blockers.map((l) => `${l.product.name} (${l.availability.status === "short" ? words.only(l.availability.left) : words.unavailable})`);
  const blocked = blockedItems.length > 0;

  const steps: Step[] = allDigital ? ["id", "payment"] : ["id", "delivery", "payment"];
  const [step, setStep] = useState<Step>("id");
  const [errors, setErrors] = useState<Errors>({});

  const [ident, setIdent] = useState<Identification>({ name: "", email: "", phone: "", cpf: "", marketing: false });
  const [address, setAddress] = useState<AddressForm>(() => {
    const lookup = simulateCepLookup(checkout.cep);
    return {
      cep: maskCep(checkout.cep),
      street: "",
      number: "",
      complement: "",
      district: "",
      city: lookup?.city ?? "",
      state: lookup?.state ?? "",
    };
  });
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState<CardForm>({ number: "", name: "", expiry: "", cvv: "", installments: 1 });

  const modules = config.modules;
  const methods: { id: PaymentMethod; label: string }[] = [
    { id: "pix", label: "Pix" },
    ...(modules.cartao?.enabled ? [{ id: "cartao" as const, label: "Cartão de crédito" }] : []),
    ...(modules.boleto ? [{ id: "boleto" as const, label: "Boleto" }] : []),
  ];

  const totals = pricing.totalsFor(method);
  const cardTotals = pricing.totalsFor("cartao");
  // Parcelas só com o módulo de parcelamento ligado; sem ele o cartão é à vista.
  const plan = installmentPlan(cardTotals.total, modules.parcelamento);
  const installmentOptions = Array.from({ length: plan?.count ?? 1 }, (_, i) => i + 1);
  const showInstallments = !!modules.parcelamento?.enabled && installmentOptions.length > 1;
  const pix = pixPricing(pricing.totalsFor("boleto").afterCoupon, modules.descontoPix);

  function fail(next: Errors, order: readonly string[]) {
    setErrors(next);
    const first = firstInvalid(next, order);
    if (first) requestAnimationFrame(() => document.getElementById(`chk-${first}`)?.focus());
  }

  function nextStep() {
    const i = steps.indexOf(step);
    setErrors({});
    setStep(steps[Math.min(i + 1, steps.length - 1)]);
  }

  function submitIdentification(e: FormEvent) {
    e.preventDefault();
    const errs = validateIdentification(ident, { requirePhone: !allDigital });
    if (Object.keys(errs).length) return fail(errs, IDENTIFICATION_FIELDS);
    nextStep();
  }

  function submitDelivery(e: FormEvent) {
    e.preventDefault();
    if (selected?.kind === "pickup") return nextStep();
    const errs = validateAddress(address);
    if (Object.keys(errs).length) return fail(errs, ADDRESS_FIELDS);
    nextStep();
  }

  function onCep(value: string) {
    const masked = maskCep(value);
    const lookup = simulateCepLookup(masked);
    setAddress((a) => ({ ...a, cep: masked, ...(lookup ? { city: lookup.city, state: lookup.state } : {}) }));
  }

  function finish(e: FormEvent) {
    e.preventDefault();
    if (blocked) return; // item indisponível: não finaliza
    const id = nextOrderId(config.orderPrefix ?? "PD", orders);
    let payment: Order["payment"];

    if (method === "cartao") {
      const errs = validateCard(card);
      if (Object.keys(errs).length) return fail(errs, CARD_FIELDS);
      const installments = showInstallments ? card.installments : 1;
      const result = processCard({ number: card.number, cvv: card.cvv, installments });
      if (!result.ok) return fail({ cardNumber: result.error }, CARD_FIELDS);
      payment = result.payment;
      setCard({ number: "", name: "", expiry: "", cvv: "", installments: 1 }); // descarta os dados do cartão
    } else if (method === "boleto") {
      payment = { method: "boleto", dueDate: boletoDueDate(), code: fakeBoletoLine(id) };
    } else {
      payment = { method: "pix", code: fakePixCode(id) };
    }

    const delivery: Order["delivery"] = allDigital
      ? { type: "digital" }
      : selected?.kind === "pickup"
        ? { type: "retirada" }
        : { type: "entrega", address: composeAddress(address), shipping: selected?.price ?? 0 };

    const order = buildOrder({
      id,
      lines: pricing.lines,
      customer: {
        name: ident.name.trim(),
        email: ident.email.trim(),
        phone: ident.phone, // vazio só em pedido 100% digital (sem entrega, o celular não é necessário)
        cpf: maskCpfForStorage(ident.cpf), // o CPF completo nunca é gravado
        marketingOptIn: ident.marketing,
        marketingConsentAt: ident.marketing ? new Date().toISOString() : undefined,
      },
      delivery,
      payment,
      totals: pricing.totalsFor(method),
      couponCode: pricing.coupon?.status === "applied" ? pricing.coupon.coupon.code : undefined,
    });
    onPlacing();
    placeOrder(order);
    router.push(`/pedido/${id}`);
  }

  const radioRow = "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-sm";
  const buttonPrimary = "flex min-h-12 w-full items-center justify-center rounded-button bg-primary px-lg font-bold text-background";
  const buttonGhost = "flex min-h-12 w-full items-center justify-center rounded-button border border-border bg-surface px-lg font-bold";
  const errorSummary =
    Object.keys(errors).length > 0 ? (
      <p role="alert" className="rounded-md border border-danger p-sm text-sm font-medium text-danger">
        Corrija os campos destacados para continuar.
      </p>
    ) : null;

  return (
    <section className="mx-auto w-full max-w-5xl px-md py-lg">
      <PageTitle title="Checkout" />
      <h1 className="text-3xl">Checkout</h1>
      <StepIndicator steps={steps} current={step} />

      <div className="mt-md flex flex-col gap-md md:grid md:grid-cols-[1fr_22rem] md:items-start">
        <OrderSummary pricing={pricing} method={method} />

        {step === "id" && (
          <form noValidate onSubmit={submitIdentification} className="flex flex-col gap-md" data-testid="step-id">
            <h2 className="text-xl">Identificação</h2>
            {errorSummary}
            <FormField name="name" label="Nome completo" autoComplete="name" value={ident.name} error={errors.name} onChange={(e) => setIdent({ ...ident, name: e.target.value })} />
            <FormField name="email" label="E-mail" type="email" autoComplete="email" value={ident.email} error={errors.email} onChange={(e) => setIdent({ ...ident, email: e.target.value })} />
            <FormField name="phone" label={allDigital ? "Celular (opcional)" : "Celular"} inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" value={ident.phone} error={errors.phone} onChange={(e) => setIdent({ ...ident, phone: maskPhone(e.target.value) })} />
            <FormField name="cpf" label="CPF" inputMode="numeric" placeholder="000.000.000-00" hint="Usado para a nota fiscal" value={ident.cpf} error={errors.cpf} onChange={(e) => setIdent({ ...ident, cpf: maskCpf(e.target.value) })} />
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={ident.marketing}
                onChange={(e) => setIdent({ ...ident, marketing: e.target.checked })}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>Quero receber ofertas</span>
            </label>
            <p className="text-sm text-muted">
              Usamos estes dados só para entrega, pagamento e nota fiscal. Saiba mais na{" "}
              <Link href="/privacidade" className="underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <button type="submit" className={buttonPrimary}>
              Continuar
            </button>
          </form>
        )}

        {step === "delivery" && (
          <form noValidate onSubmit={submitDelivery} className="flex flex-col gap-md" data-testid="step-delivery">
            <h2 className="text-xl">Entrega</h2>
            {selected?.kind === "pickup" ? (
              <div className="rounded-lg border border-border bg-surface p-md">
                <p className="font-bold">Retirar na loja</p>
                <p className="mt-xs text-sm">{config.legal.address}</p>
                {config.pickup && <p className="text-sm text-muted">Pronto em {config.pickup.leadTime}</p>}
                <Link href="/carrinho" className="mt-sm inline-flex min-h-11 items-center text-sm underline">
                  Alterar a entrega
                </Link>
              </div>
            ) : (
              <>
                {errorSummary}
                <FormField name="cep" label="CEP" inputMode="numeric" autoComplete="postal-code" value={address.cep} error={errors.cep} onChange={(e) => onCep(e.target.value)} />
                <FormField name="street" label="Rua" autoComplete="address-line1" value={address.street} error={errors.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                <div className="grid grid-cols-2 gap-sm">
                  <FormField name="number" label="Número" inputMode="numeric" value={address.number} error={errors.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                  <FormField name="complement" label="Complemento" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                </div>
                <FormField name="district" label="Bairro" value={address.district} error={errors.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                <div className="grid grid-cols-[1fr_5rem] gap-sm">
                  <FormField name="city" label="Cidade" value={address.city} error={errors.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <FormField name="state" label="UF" maxLength={2} value={address.state} error={errors.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} />
                </div>
                <p className="text-sm text-muted">
                  Frete escolhido: {selected?.label} · {selected?.deadline}
                </p>
              </>
            )}
            <button type="submit" className={buttonPrimary}>
              Continuar
            </button>
            <button type="button" className={buttonGhost} onClick={() => setStep("id")}>
              Voltar
            </button>
          </form>
        )}

        {step === "payment" && (
          <form noValidate onSubmit={finish} className="flex flex-col gap-md" data-testid="step-payment">
            <h2 className="text-xl">Pagamento</h2>
            {errorSummary}
            <div role="radiogroup" aria-label="Forma de pagamento" className="flex flex-col gap-sm">
              {methods.map((m) => (
                <label key={m.id} className={radioRow}>
                  <input
                    type="radio"
                    name="pagamento"
                    className="size-5 accent-primary"
                    checked={method === m.id}
                    onChange={() => {
                      setMethod(m.id);
                      setErrors({});
                    }}
                  />
                  <span className="flex-1 font-medium">{m.label}</span>
                  {m.id === "pix" && pix && <span className="text-sm font-bold text-success">{formatBRL(pricing.totalsFor("pix").total)}</span>}
                </label>
              ))}
            </div>

            {method === "pix" && (
              <div className="rounded-lg border border-border bg-surface p-md text-sm">
                <p>O QR Code e o código copia-e-cola aparecem na confirmação do pedido.</p>
                {pix && (
                  <p data-testid="pix-price" className="mt-xs">
                    No Pix: <strong className="font-bold text-success">{formatBRL(pricing.totalsFor("pix").total)}</strong>
                  </p>
                )}
              </div>
            )}

            {method === "boleto" && (
              <div className="rounded-lg border border-border bg-surface p-md text-sm">
                <p>
                  Vencimento em {BOLETO_DUE_BUSINESS_DAYS} dias úteis. A linha digitável aparece na confirmação do pedido.
                </p>
              </div>
            )}

            {method === "cartao" && (
              <div className="flex flex-col gap-md rounded-lg border border-border bg-surface p-md" data-testid="card-form">
                <p className="rounded-md border border-warning p-sm text-sm font-medium" data-testid="card-warning">
                  {CARD_DEMO_WARNING}
                </p>
                <FormField name="cardNumber" label="Número do cartão" inputMode="numeric" autoComplete="off" placeholder="4111 1111 1111 1111" value={card.number} error={errors.cardNumber} onChange={(e) => setCard({ ...card, number: maskCardNumber(e.target.value) })} />
                <FormField name="cardName" label="Nome impresso no cartão" autoComplete="off" value={card.name} error={errors.cardName} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-sm">
                  <FormField name="cardExpiry" label="Validade" inputMode="numeric" autoComplete="off" placeholder="MM/AA" value={card.expiry} error={errors.cardExpiry} onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })} />
                  <FormField name="cardCvv" label="CVV" inputMode="numeric" autoComplete="off" maxLength={4} value={card.cvv} error={errors.cardCvv} onChange={(e) => setCard({ ...card, cvv: onlyDigits(e.target.value).slice(0, 4) })} />
                </div>
                {showInstallments ? (
                  <div>
                    <label htmlFor="chk-installments" className="text-sm font-bold">
                      Parcelas
                    </label>
                    <select
                      id="chk-installments"
                      value={card.installments}
                      onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })}
                      className="mt-xs h-11 w-full rounded-md border border-border bg-surface px-sm text-base"
                    >
                      {installmentOptions.map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? `1x de ${formatBRL(cardTotals.total)} (à vista)` : `${n}x de ${formatBRL(Math.round(cardTotals.total / n))} sem juros`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-sm" data-testid="card-cash">
                    Pagamento à vista no cartão: 1x de {formatBRL(cardTotals.total)}
                  </p>
                )}
              </div>
            )}

            {blocked && (
              <p role="alert" id="finish-blocked" data-testid="checkout-unavailable" className="rounded-md border border-danger p-sm text-sm font-medium text-danger">
                {words.blocked(blockedItems)}{" "}
                <Link href="/carrinho" className="font-bold underline">
                  {words.back}
                </Link>
              </p>
            )}
            <button type="submit" className={`${buttonPrimary} disabled:opacity-50`} data-testid="finish" disabled={blocked} aria-describedby={blocked ? "finish-blocked" : undefined}>
              Finalizar pedido · {formatBRL(totals.total)}
            </button>
            <button type="button" className={buttonGhost} onClick={() => setStep(steps[steps.length - 2])}>
              Voltar
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
