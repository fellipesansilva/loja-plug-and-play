"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/domain/types";
import { ORDER_STATUSES } from "@/domain/types";
import { StoreLink } from "@/components/store/StoreLink";
import { PageTitle } from "@/components/store/PageTitle";
import { formatDateTime } from "@/lib/datetime";
import { formatBRL } from "@/lib/money";
import { filterOrders } from "@/lib/orders-list";
import { statusLabel } from "@/lib/order-status";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/payment";
import { useDemoStore } from "@/store/demo-store";

export const DELIVERY_LABEL: Record<Order["delivery"]["type"], string> = {
  entrega: "Entrega",
  retirada: "Retirada",
  digital: "Digital",
};

const control = "mt-xs h-11 w-full rounded-md border border-border bg-surface px-md text-base";

/** Pedidos do preset (exemplos e feitos na demo), do mais recente ao mais antigo, com filtro por status e busca. */
export function OrdersList() {
  const orders = useDemoStore((s) => s.orders);
  const config = useDemoStore((s) => s.config);
  const [status, setStatus] = useState<OrderStatus | "todos">("todos");
  const [term, setTerm] = useState("");
  const shown = filterOrders(orders, status, term);

  return (
    <section className="px-md py-md md:py-lg">
      <PageTitle title="Pedidos" />
      <h1 className="text-2xl md:text-3xl">Pedidos</h1>

      <form role="search" aria-label="Filtrar pedidos" onSubmit={(e) => e.preventDefault()} className="mt-sm grid grid-cols-2 gap-sm md:mt-md md:max-w-[40rem] md:gap-md">
        <div>
          <label htmlFor="ped-busca" className="text-sm font-bold">
            Buscar por número ou cliente
          </label>
          <input id="ped-busca" type="search" value={term} onChange={(e) => setTerm(e.target.value)} className={control} />
        </div>
        <div>
          <label htmlFor="ped-status" className="text-sm font-bold">
            Status
          </label>
          <select id="ped-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "todos")} className={control}>
            <option value="todos">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="mt-md text-sm text-muted" role="status" data-testid="orders-count">
        {shown.length} {shown.length === 1 ? "pedido" : "pedidos"}
      </p>

      {shown.length === 0 ? (
        <p className="mt-md" data-testid="orders-empty">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <ul className="mt-sm flex flex-col gap-sm" data-testid="orders-list">
          {shown.map((o) => (
            <li
              key={o.id}
              className="relative rounded-lg border border-border bg-surface p-md focus-within:ring-2 focus-within:ring-primary"
              data-testid="order-row"
              data-order-id={o.id}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-sm">
                <StoreLink href={`/painel/pedidos/${encodeURIComponent(o.id)}`} className="font-bold text-primary underline after:absolute after:inset-0 after:content-['']" data-testid="order-link">
                  {o.id}
                </StoreLink>
                <span className="rounded-button border border-border px-sm py-xs text-sm font-bold" data-testid="order-row-status">
                  {statusLabel(o, o.status, config)}
                </span>
              </div>
              <dl className="mt-sm grid grid-cols-2 gap-x-md gap-y-xs text-sm md:grid-cols-5">
                <div>
                  <dt className="text-muted">Data</dt>
                  <dd>{formatDateTime(o.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Cliente</dt>
                  <dd>{o.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Total</dt>
                  <dd>{formatBRL(o.total)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pagamento</dt>
                  <dd>{PAYMENT_METHOD_LABEL[o.payment.method]}</dd>
                </div>
                <div>
                  <dt className="text-muted">Entrega</dt>
                  <dd>{DELIVERY_LABEL[o.delivery.type]}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
