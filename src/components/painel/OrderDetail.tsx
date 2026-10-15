"use client";

import type { ReactNode } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { ShippingRow } from "@/components/store/ShippingRow";
import { StoreLink } from "@/components/store/StoreLink";
import { formatDateTime } from "@/lib/datetime";
import { formatBRL } from "@/lib/money";
import { statusLabel, withHistory } from "@/lib/order-status";
import { PAYMENT_METHOD_LABEL } from "@/lib/payment";
import { maskCpfForStorage } from "@/lib/validation";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { OrderStatusActions } from "./OrderStatusActions";

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-titulo`} data-testid={id} className="rounded-lg border border-border bg-surface p-md">
      <h2 id={`${id}-titulo`} className="text-lg">
        {title}
      </h2>
      <div className="mt-sm text-sm">{children}</div>
    </section>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const order = useDemoStore((s) => s.orders.find((o) => o.id === id));
  const config = useDemoStore((s) => s.config);

  const back = (
    <StoreLink href="/painel/pedidos" className="inline-flex min-h-11 items-center text-primary underline">
      ← Pedidos
    </StoreLink>
  );

  if (!order) {
    return (
      <section className="px-md py-lg">
        <PageTitle title="Pedido" />
        {back}
        <h1 className="text-3xl">{hydrated ? "Pedido não encontrado" : "Carregando…"}</h1>
      </section>
    );
  }

  const { customer, payment, delivery } = order;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const subtotal = order.subtotal ?? itemsTotal;
  const shipping = delivery.type === "entrega" ? delivery.shipping : 0;
  const history = withHistory(order).history ?? [];

  return (
    <article className="px-md py-lg">
      <PageTitle title={`Pedido ${order.id}`} />
      {back}
      <div className="mt-xs flex flex-wrap items-baseline gap-md">
        <h1 className="text-3xl" data-testid="detail-id">
          Pedido {order.id}
        </h1>
        <span className="rounded-button border border-border px-sm py-xs text-sm font-bold" data-testid="detail-status">
          {statusLabel(order, order.status, config)}
        </span>
      </div>
      <p className="mt-xs text-sm text-muted">Feito em {formatDateTime(order.createdAt)}</p>

      <OrderStatusActions order={order} />

      <div className="mt-md grid gap-md md:grid-cols-2">
        <Card id="detail-items" title="Itens">
          <ul className="flex flex-col gap-sm">
            {order.items.map((item, i) => (
              <li key={item.lineId ?? `${item.productId}-${i}`} className="flex justify-between gap-md" data-testid="detail-item">
                <span>
                  {item.quantity}× {item.name}
                  {item.addons && item.addons.length > 0 && (
                    <span className="block text-muted" data-testid="detail-addons">
                      + {item.addons.map((a) => `${a.label} (${formatBRL(a.price)})`).join(", ")}
                    </span>
                  )}
                </span>
                <span>{formatBRL(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-sm flex flex-col gap-xs border-t border-border pt-sm">
            <div className="flex justify-between gap-md">
              <dt>Subtotal</dt>
              <dd data-testid="detail-subtotal">{formatBRL(subtotal)}</dd>
            </div>
            {order.couponDiscount ? (
              <div className="flex justify-between gap-md">
                <dt>Cupom {order.couponCode}</dt>
                <dd>−{formatBRL(order.couponDiscount)}</dd>
              </div>
            ) : null}
            {order.pixDiscount ? (
              <div className="flex justify-between gap-md">
                <dt>Desconto no Pix</dt>
                <dd>−{formatBRL(order.pixDiscount)}</dd>
              </div>
            ) : null}
            <ShippingRow
              testId="detail-shipping"
              kind={delivery.type === "entrega" ? "ship" : delivery.type === "retirada" ? "pickup" : "digital"}
              price={shipping}
            />
            <div className="flex justify-between gap-md border-t border-border pt-sm text-base font-extrabold">
              <dt>Total</dt>
              <dd data-testid="detail-total">{formatBRL(order.total)}</dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col gap-md">
          <Card id="detail-delivery" title="Entrega">
            {delivery.type === "entrega" && <p data-testid="detail-address">{delivery.address}</p>}
            {delivery.type === "retirada" && <p data-testid="detail-address">Retirada na loja: {config.legal.address}</p>}
            {delivery.type === "digital" && <p data-testid="detail-address">Produto digital: sem entrega física (acesso enviado por e-mail).</p>}
          </Card>

          <Card id="detail-payment" title="Pagamento">
            <p data-testid="detail-payment-text">
              {PAYMENT_METHOD_LABEL[payment.method]}
              {payment.method === "cartao" && payment.last4
                ? ` · ${payment.brand} final ${payment.last4} · ${(payment.installments ?? 1) > 1 ? `${payment.installments}x` : "à vista"}`
                : ""}
              {payment.method === "boleto" && payment.dueDate ? ` · vence em ${payment.dueDate.split("-").reverse().join("/")}` : ""}
            </p>
          </Card>

          <Card id="detail-customer" title="Cliente">
            <p data-testid="detail-customer-name">{customer.name}</p>
            <p>{customer.email}</p>
            {customer.phone && <p>{customer.phone}</p>}
            {customer.cpf && <p data-testid="detail-cpf">CPF {maskCpfForStorage(customer.cpf)}</p>}
            <p className="mt-xs" data-testid="detail-marketing">
              {customer.marketingOptIn
                ? `Aceitou receber ofertas${customer.marketingConsentAt ? ` em ${formatDateTime(customer.marketingConsentAt)}` : ""}.`
                : "Não aceitou receber ofertas."}
            </p>
          </Card>
        </div>

        <Card id="detail-history" title="Histórico de status">
          <ol className="flex flex-col gap-xs">
            {history.map((h, i) => (
              <li key={`${h.status}-${h.at}-${i}`} className="flex justify-between gap-md" data-testid="history-entry">
                <span className="font-bold">{statusLabel(order, h.status, config)}</span>
                <span className="text-muted">{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </Card>

        {order.regret && (
          <Card id="detail-regret" title="Arrependimento">
            <p>
              Protocolo <strong data-testid="detail-regret-protocol">{order.regret.protocol}</strong> · solicitado em{" "}
              {formatDateTime(order.regret.requestedAt)}
            </p>
          </Card>
        )}
      </div>
    </article>
  );
}
