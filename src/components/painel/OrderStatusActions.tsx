"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/domain/types";
import { canCancel, nextStatuses, statusLabel } from "@/lib/order-status";
import { useDemoStore } from "@/store/demo-store";

const primary = "inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-lg font-bold text-background";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-lg font-bold";
const danger = "inline-flex min-h-11 items-center justify-center rounded-button border border-danger bg-surface px-lg font-bold text-danger";

/** Só as próximas etapas válidas do pedido, e o cancelamento (com confirmação) até antes de entregue. */
export function OrderStatusActions({ order }: { order: Order }) {
  const config = useDemoStore((s) => s.config);
  const changeOrderStatus = useDemoStore((s) => s.changeOrderStatus);
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const next = nextStatuses(order);
  const cancellable = canCancel(order);

  if (next.length === 0 && !cancellable) {
    return (
      <p className="mt-md text-sm text-muted" data-testid="status-final">
        Este pedido está {statusLabel(order, order.status, config).toLowerCase()}: não há próximas etapas.
      </p>
    );
  }

  return (
    <section aria-labelledby="acoes-titulo" className="mt-md rounded-lg border border-border bg-surface p-md" data-testid="status-actions">
      <h2 id="acoes-titulo" className="text-lg">
        Mudar status
      </h2>
      <div className="mt-sm flex flex-wrap gap-sm">
        {next.map((status) => (
          <button key={status} type="button" className={primary} data-testid={`status-to-${status}`} onClick={() => changeOrderStatus(order.id, status)}>
            Marcar como {statusLabel(order, status, config)}
          </button>
        ))}
        {cancellable && !confirming && (
          <button type="button" className={danger} data-testid="status-cancel" onClick={() => setConfirming(true)}>
            Cancelar pedido
          </button>
        )}
      </div>

      {confirming && (
        <div
          role="alertdialog"
          aria-labelledby="cancel-titulo"
          aria-describedby="cancel-texto"
          data-testid="cancel-confirm"
          className="mt-md rounded-md border border-danger p-md"
          onKeyDown={(e) => {
            if (e.key === "Escape") setConfirming(false);
          }}
        >
          <p id="cancel-titulo" className="font-bold">
            Cancelar o pedido {order.id}?
          </p>
          <p id="cancel-texto" className="mt-xs text-sm">
            O status passa para Cancelado e não dá para desfazer.
          </p>
          <div className="mt-sm flex flex-wrap gap-sm">
            <button
              ref={confirmRef}
              type="button"
              className={danger}
              data-testid="cancel-confirm-yes"
              onClick={() => {
                changeOrderStatus(order.id, "cancelado");
                setConfirming(false);
              }}
            >
              Sim, cancelar
            </button>
            <button type="button" className={ghost} onClick={() => setConfirming(false)}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
