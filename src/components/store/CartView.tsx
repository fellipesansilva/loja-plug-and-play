"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { useState, type FormEvent } from "react";
import { formatBRL } from "@/lib/money";
import { pixPricing } from "@/lib/pix";
import { maskCep, normalizeCep } from "@/lib/shipping";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { MinusIcon, PlusIcon } from "./Icons";
import { PageTitle } from "./PageTitle";
import { ShippingRow } from "./ShippingRow";
import { StoreImage } from "./StoreImage";
import { useCartWords } from "./useCartWords";
import { useCartPricing } from "./useCartPricing";

const stepper =
  "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background disabled:opacity-40";

function CouponForm({ pricing }: { pricing: ReturnType<typeof useCartPricing> }) {
  const setCoupon = useDemoStore((s) => s.setCoupon);
  const [typed, setTyped] = useState(pricing.checkout.couponCode ?? "");
  const { coupon } = pricing;

  function submit(e: FormEvent) {
    e.preventDefault();
    setCoupon(typed.trim() ? typed.trim() : null);
  }

  let message: { text: string; ok: boolean } | null = null;
  if (coupon?.status === "applied") message = { text: `Cupom ${coupon.coupon.code} aplicado: −${formatBRL(coupon.discount)}`, ok: true };
  else if (coupon?.status === "expired") message = { text: "Cupom vencido", ok: false };
  else if (coupon?.status === "invalid") message = { text: "Cupom inválido", ok: false };
  else if (coupon?.status === "below-min") {
    message = { text: `Pedido abaixo do mínimo de ${formatBRL(coupon.minValue)} para este cupom`, ok: false };
  }

  return (
    <section aria-labelledby="cupom-titulo" className="rounded-lg border border-border bg-surface p-md">
      <h2 id="cupom-titulo" className="text-lg">
        Cupom de desconto
      </h2>
      <form onSubmit={submit} className="mt-sm flex gap-sm">
        <div className="min-w-0 flex-1">
          <label htmlFor="cupom" className="sr-only">
            Código do cupom
          </label>
          <input
            id="cupom"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Código do cupom"
            className="h-11 w-full rounded-md border border-border bg-background px-md text-base uppercase"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-button bg-primary px-md font-bold text-background">
          Aplicar
        </button>
      </form>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          data-testid="coupon-message"
          className={`mt-sm text-sm font-medium ${message.ok ? "text-success" : "text-danger"}`}
        >
          {message.text}
        </p>
      )}
      {coupon?.status === "applied" && (
        <button
          type="button"
          onClick={() => {
            setCoupon(null);
            setTyped("");
          }}
          className="mt-xs inline-flex min-h-11 items-center text-sm underline"
        >
          Remover cupom
        </button>
      )}
    </section>
  );
}

function ShippingChooser({ pricing }: { pricing: ReturnType<typeof useCartPricing> }) {
  const setShipping = useDemoStore((s) => s.setShipping);
  const { checkout, quote, pickupAvailable, config } = pricing;
  const [typed, setTyped] = useState(maskCep(checkout.cep));
  const [error, setError] = useState<string | null>(null);

  function calculate(e: FormEvent) {
    e.preventDefault();
    const cep = normalizeCep(typed);
    if (!cep) {
      setError("CEP inválido");
      return;
    }
    setError(null);
    // CEP novo: a escolha anterior deixa de valer (só a retirada continua válida).
    setShipping(cep, checkout.shippingId === "pickup" ? "pickup" : null);
  }

  const radio = "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-sm";
  const shipOptions = quote?.status === "ok" ? quote.options : [];

  return (
    <section aria-labelledby="entrega-titulo" className="rounded-lg border border-border bg-surface p-md">
      <h2 id="entrega-titulo" className="text-lg">
        Entrega
      </h2>
      {pricing.allDigital ? (
        <p className="mt-sm text-sm text-muted">Produtos digitais não têm entrega: o acesso é enviado por e-mail depois do pagamento.</p>
      ) : (
        <>
          <form onSubmit={calculate} className="mt-sm flex gap-sm">
            <div className="min-w-0 flex-1">
              <label htmlFor="cep-carrinho" className="sr-only">
                CEP
              </label>
              <input
                id="cep-carrinho"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="CEP (00000-000)"
                value={typed}
                onChange={(e) => setTyped(maskCep(e.target.value))}
                className="h-11 w-full rounded-md border border-border bg-background px-md text-base"
              />
            </div>
            <button type="submit" className="min-h-11 rounded-button bg-primary px-md font-bold text-background">
              Calcular
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-sm text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {quote?.status === "ok" && !quote.covered && (
            <p className="mt-sm text-sm font-medium">Não entregamos neste CEP</p>
          )}

          <div role="radiogroup" aria-label="Opções de entrega" className="mt-sm flex flex-col gap-sm" data-testid="shipping-options">
            {shipOptions.map((o) => (
              <label key={o.id} className={radio}>
                <input
                  type="radio"
                  name="entrega"
                  className="mt-1 size-5 accent-primary"
                  checked={checkout.shippingId === o.id}
                  onChange={() => setShipping(checkout.cep, o.id)}
                />
                <span className="flex flex-1 items-baseline justify-between gap-md">
                  <span>
                    <span className="font-medium">{o.label}</span>
                    <span className="block text-sm text-muted">{o.deadline}</span>
                  </span>
                  <span className={`font-bold ${o.free ? "text-success" : ""}`}>{o.free ? "Grátis" : formatBRL(o.price)}</span>
                </span>
              </label>
            ))}
            {quote?.status === "ok" && quote.missingForFree !== null && (
              <p className="text-sm text-muted">Faltam {formatBRL(quote.missingForFree)} para frete grátis</p>
            )}
            {pickupAvailable && (
              <label className={radio}>
                <input
                  type="radio"
                  name="entrega"
                  className="mt-1 size-5 accent-primary"
                  checked={checkout.shippingId === "pickup"}
                  onChange={() => setShipping(checkout.cep, "pickup")}
                />
                <span className="flex-1">
                  <span className="font-medium">Retirar na loja · grátis</span>
                  <span className="block text-sm text-muted">{config.legal.address}</span>
                  {config.pickup && <span className="block text-sm text-muted">Pronto em {config.pickup.leadTime}</span>}
                </span>
              </label>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function CartView() {
  const hydrated = useHydrated();
  const pricing = useCartPricing();
  const setLineQty = useDemoStore((s) => s.setLineQty);
  const removeLine = useDemoStore((s) => s.removeLine);
  const words = useCartWords();
  const label = words.name;
  const { lines } = pricing;
  const blockedItems = pricing.blockers.map((l) => `${l.product.name} (${l.availability.status === "short" ? words.only(l.availability.left) : words.unavailable})`);

  if (lines.length === 0) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
        <PageTitle title={label} />
        <h1 className="text-3xl">{label}</h1>
        {hydrated ? (
          <div className="mt-md rounded-lg border border-border bg-surface p-lg text-center">
            <p className="font-medium" data-testid="cart-empty">
              {words.empty}
            </p>
            <p className="mt-xs text-sm text-muted">Adicione produtos para continuar a compra.</p>
            <Link
              href="/"
              className="mt-md inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background"
            >
              Ir para a home
            </Link>
          </div>
        ) : (
          <p className="mt-md text-muted">Carregando…</p>
        )}
      </section>
    );
  }

  const withCoupon = pricing.totalsFor("cartao"); // sem desconto Pix
  const pixTotals = pricing.totalsFor("pix");
  const showPix = pixPricing(withCoupon.afterCoupon, pricing.config.modules.descontoPix) !== null;
  const { selected } = pricing;

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={label} />
      <h1 className="text-3xl">{label}</h1>
      <div className="mt-md flex flex-col gap-lg md:grid md:grid-cols-[1fr_22rem] md:items-start">
        <div className="flex flex-col gap-md">
          <ul className="flex flex-col gap-sm" aria-label="Itens">
            {lines.map(({ line, product, variantLabel, addons, unit, total, maxQty, availability }) => (
              <li
                key={line.lineId}
                data-testid="cart-line"
                className="flex gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <Link href={`/produto/${product.slug}`} className="relative block size-20 shrink-0 overflow-hidden rounded-md bg-border">
                  <StoreImage image={product.images[0]} sizes="80px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/produto/${product.slug}`} className="inline-block py-1 font-bold leading-snug">
                    {product.name}
                  </Link>
                  {variantLabel && <p className="text-sm text-muted">{variantLabel}</p>}
                  {addons.length > 0 && <p className="text-sm text-muted">+ {addons.map((a) => a.label).join(", ")}</p>}
                  <p className="mt-xs text-sm text-muted">{formatBRL(unit)} cada</p>
                  {availability.status !== "ok" && (
                    <p role="alert" data-testid="line-unavailable" className="mt-xs text-sm font-bold text-danger">
                      {availability.status === "unavailable" ? words.unavailable : words.only(availability.left)}
                    </p>
                  )}
                  {availability.status === "short" && (
                    <button
                      type="button"
                      data-testid="line-adjust"
                      onClick={() => setLineQty(line.lineId, availability.left)}
                      className="mt-xs inline-flex min-h-11 items-center text-sm font-bold underline"
                    >
                      Ajustar para {availability.left}
                    </button>
                  )}
                  <div className="mt-sm flex flex-wrap items-center justify-between gap-sm">
                    <div className="flex items-center gap-xs" role="group" aria-label={`Quantidade de ${product.name}`}>
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${product.name}`}
                        disabled={line.qty <= 1}
                        onClick={() => setLineQty(line.lineId, line.qty - 1)}
                        className={stepper}
                      >
                        <MinusIcon />
                      </button>
                      <span data-testid="line-qty" className="min-w-8 text-center font-extrabold">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${product.name}`}
                        disabled={line.qty >= maxQty}
                        onClick={() => setLineQty(line.lineId, line.qty + 1)}
                        className={stepper}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <p className="text-right font-extrabold">
                      <span data-testid="line-total" className={availability.status === "ok" ? "" : "text-muted line-through"}>
                        {formatBRL(total)}
                      </span>
                      {availability.status !== "ok" && (
                        <span data-testid="line-excluded" className="block text-xs font-medium text-muted">
                          não incluído no total
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.lineId)}
                    aria-label={`Remover ${product.name}`}
                    className="mt-xs inline-flex min-h-11 items-center text-sm text-muted underline"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {pricing.config.modules.cupom && <CouponForm pricing={pricing} />}
          <ShippingChooser pricing={pricing} />
        </div>

        <aside aria-labelledby="resumo-titulo" className="rounded-lg border border-border bg-surface p-md md:sticky md:top-md">
          <h2 id="resumo-titulo" className="text-lg">
            Resumo
          </h2>
          <dl className="mt-sm flex flex-col gap-sm text-sm">
            <div className="flex justify-between gap-md">
              <dt>Subtotal</dt>
              <dd data-testid="sum-subtotal">{formatBRL(withCoupon.subtotal)}</dd>
            </div>
            {withCoupon.couponDiscount > 0 && (
              <div className="flex justify-between gap-md text-success">
                <dt>Cupom</dt>
                <dd data-testid="sum-coupon">−{formatBRL(withCoupon.couponDiscount)}</dd>
              </div>
            )}
            <ShippingRow
              testId="sum-shipping"
              kind={pricing.allDigital ? "digital" : selected ? (selected.kind === "pickup" ? "pickup" : "ship") : "pending"}
              price={selected?.price}
            />
            <div className="flex justify-between gap-md border-t border-border pt-sm text-base font-extrabold">
              <dt>Total</dt>
              <dd data-testid="sum-total">{formatBRL(withCoupon.total)}</dd>
            </div>
          </dl>
          {showPix && (
            <p data-testid="pix-price" className="mt-sm text-sm">
              No Pix: <strong className="text-base font-extrabold text-success">{formatBRL(pixTotals.total)}</strong>
            </p>
          )}
          {pricing.canContinue ? (
            <Link
              href="/checkout"
              className="mt-md flex min-h-12 items-center justify-center rounded-button bg-primary px-lg font-bold text-background"
            >
              Continuar
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="mt-md flex min-h-12 w-full items-center justify-center rounded-button bg-primary px-lg font-bold text-background disabled:opacity-50"
              >
                Continuar
              </button>
              <p className="mt-sm text-sm text-muted" data-testid="cart-blocked-note">
                {pricing.blockers.length > 0 ? words.blocked(blockedItems) : "Escolha a forma de entrega para continuar."}
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
