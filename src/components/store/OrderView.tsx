"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Order } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { PAYMENT_METHOD_LABEL, PIX_EXPIRES_MINUTES } from "@/lib/payment";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { CopyButton } from "./CopyButton";
import { FakeQr } from "./FakeQr";
import { PageTitle } from "./PageTitle";
import { ShippingRow } from "./ShippingRow";

const METHOD_LABEL = PAYMENT_METHOD_LABEL;

// "Acessar curso" (módulo cursos): fora do JavaScript das lojas que não têm a área do aluno; o trecho só é baixado onde o módulo está ligado.
const CourseAccess = dynamic(() => import("./CourseAccess").then((m) => m.CourseAccess));

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** Contador regressivo do Pix (30 min a partir da criação do pedido). */
function PixCountdown({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const left = now === null ? null : new Date(createdAt).getTime() + PIX_EXPIRES_MINUTES * 60_000 - now;
  if (left === null) return <p className="text-sm text-muted">Calculando o prazo…</p>;
  if (left <= 0) return <p className="text-sm font-medium text-danger">Código expirado (demonstração)</p>;
  const total = Math.floor(left / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return (
    <p className="text-sm">
      O código expira em <strong data-testid="pix-countdown">{mm}:{ss}</strong>
    </p>
  );
}

function PaymentPanel({ order }: { order: Order }) {
  const { payment, status } = order;
  if (status === "pago") {
    return (
      <div className="rounded-lg border border-success bg-surface p-md" data-testid="payment-confirmed">
        <p className="font-bold text-success">Pagamento confirmado</p>
        {payment.method === "cartao" && payment.last4 && (
          <p className="text-sm text-muted">
            {payment.brand} final {payment.last4} · {(payment.installments ?? 1) > 1 ? `${payment.installments}x` : "à vista"}
          </p>
        )}
      </div>
    );
  }
  if (status !== "aguardando_pagamento") return null;

  if (payment.method === "pix") {
    return (
      <section aria-labelledby="pix-titulo" className="rounded-lg border border-border bg-surface p-md" data-testid="pix-panel">
        <h2 id="pix-titulo" className="text-lg">
          Pague com Pix
        </h2>
        <div className="mt-sm flex flex-col items-center gap-sm">
          <FakeQr seed={order.id} />
          <PixCountdown createdAt={order.createdAt} />
        </div>
        <p className="mt-sm text-sm font-bold">Pix copia e cola</p>
        <p className="mt-xs break-all rounded-md border border-border bg-background p-sm text-xs" data-testid="pix-code">
          {payment.code}
        </p>
        <div className="mt-sm">{payment.code && <CopyButton text={payment.code} />}</div>
        <p className="mt-sm text-xs text-muted">Código fictício: nenhum pagamento real é processado.</p>
      </section>
    );
  }
  if (payment.method === "boleto") {
    return (
      <section aria-labelledby="boleto-titulo" className="rounded-lg border border-border bg-surface p-md" data-testid="boleto-panel">
        <h2 id="boleto-titulo" className="text-lg">
          Boleto
        </h2>
        {payment.dueDate && (
          <p className="mt-sm text-sm">
            Vencimento: <strong data-testid="boleto-due">{formatDate(payment.dueDate)}</strong>
          </p>
        )}
        <p className="mt-sm text-sm font-bold">Linha digitável</p>
        <p className="mt-xs break-all rounded-md border border-border bg-background p-sm text-xs" data-testid="boleto-line">
          {payment.code}
        </p>
        <div className="mt-sm">{payment.code && <CopyButton text={payment.code} />}</div>
        <p className="mt-sm text-xs text-muted">Linha fictícia: nenhum pagamento real é processado.</p>
      </section>
    );
  }
  return null;
}

export function OrderView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const order = useDemoStore((s) => s.orders.find((o) => o.id === id));
  const config = useDemoStore((s) => s.config);
  // Loja com área do aluno: o acesso vem pelo botão "Acessar curso" (não há envio de e-mail na demonstração).
  const cursosOn = config.modules.cursos === true;

  if (!order) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
        <PageTitle title="Pedido" />
        <h1 className="text-3xl">{hydrated ? "Pedido não encontrado" : "Carregando…"}</h1>
        {hydrated && (
          <Link href="/" className="mt-md inline-flex min-h-11 items-center text-primary underline">
            Voltar para o início
          </Link>
        )}
      </section>
    );
  }

  const itemsTotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const subtotal = order.subtotal ?? itemsTotal;
  const shipping = order.delivery.type === "entrega" ? order.delivery.shipping : 0;

  return (
    <article className="mx-auto w-full max-w-3xl px-md py-lg">
      <PageTitle title={`Pedido ${order.id}`} />
      <h1 className="text-3xl">Pedido {order.id}</h1>
      <p className="mt-sm">
        Status:{" "}
        <strong data-testid="order-status" className={order.status === "pago" ? "text-success" : ""}>
          {statusLabel(order, order.status, config)}
        </strong>
      </p>
      <p className="mt-xs text-sm text-muted">
        Obrigado, {order.customer.name.split(" ")[0]}! Guarde o número do pedido.
      </p>

      <div className="mt-md flex flex-col gap-md">
        <PaymentPanel order={order} />
        {cursosOn && <CourseAccess order={order} />}

        {order.delivery.type === "digital" && !cursosOn && (
          <p className="rounded-lg border border-border bg-surface p-md" data-testid="digital-access">
            O acesso será enviado para <strong>{order.customer.email}</strong>.
          </p>
        )}

        <section aria-labelledby="itens-titulo" className="rounded-lg border border-border bg-surface p-md">
          <h2 id="itens-titulo" className="text-lg">
            Itens
          </h2>
          <ul className="mt-sm flex flex-col gap-sm" data-testid="order-items">
            {order.items.map((item, i) => (
              <li key={item.lineId ?? `${item.productId}-${i}`} className="flex justify-between gap-md text-sm">
                <span>
                  {item.quantity}× {item.name}
                  {item.addons && item.addons.length > 0 && (
                    <span className="block text-muted">+ {item.addons.map((a) => a.label).join(", ")}</span>
                  )}
                </span>
                <span>{formatBRL(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="entrega-titulo" className="rounded-lg border border-border bg-surface p-md">
          <h2 id="entrega-titulo" className="text-lg">
            Entrega
          </h2>
          <p className="mt-sm text-sm" data-testid="order-delivery">
            {order.delivery.type === "entrega" && order.delivery.address}
            {order.delivery.type === "retirada" && "Retirada na loja"}
            {order.delivery.type === "digital" && "Produto digital: sem entrega física"}
          </p>
        </section>

        <section aria-labelledby="pagamento-titulo" className="rounded-lg border border-border bg-surface p-md">
          <h2 id="pagamento-titulo" className="text-lg">
            Pagamento
          </h2>
          <p className="mt-sm text-sm" data-testid="order-payment">
            {METHOD_LABEL[order.payment.method]}
            {order.payment.method === "cartao" && order.payment.last4 ? ` · ${order.payment.brand} final ${order.payment.last4}` : ""}
          </p>
          <dl className="mt-sm flex flex-col gap-xs border-t border-border pt-sm text-sm">
            <div className="flex justify-between gap-md">
              <dt>Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            {order.couponDiscount ? (
              <div className="flex justify-between gap-md text-success">
                <dt>Cupom {order.couponCode}</dt>
                <dd>−{formatBRL(order.couponDiscount)}</dd>
              </div>
            ) : null}
            {order.pixDiscount ? (
              <div className="flex justify-between gap-md text-success">
                <dt>Desconto no Pix</dt>
                <dd>−{formatBRL(order.pixDiscount)}</dd>
              </div>
            ) : null}
            <ShippingRow
              testId="order-shipping"
              kind={order.delivery.type === "entrega" ? "ship" : order.delivery.type === "retirada" ? "pickup" : "digital"}
              price={shipping}
            />
            <div className="flex justify-between gap-md border-t border-border pt-sm text-base font-extrabold">
              <dt>Total</dt>
              <dd data-testid="order-total">{formatBRL(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap gap-x-lg">
          <Link href="/" className="inline-flex min-h-11 items-center self-start text-primary underline">
            Continuar comprando
          </Link>
          {order.status !== "cancelado" && (
            <Link
              href={`/arrependimento?pedido=${encodeURIComponent(order.id)}`}
              className="inline-flex min-h-11 items-center self-start underline"
              data-testid="regret-order-link"
            >
              Desistir da compra
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
