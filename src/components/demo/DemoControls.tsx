"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { presets } from "@/presets";
import { useDemoStore } from "@/store/demo-store";

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const presetId = useDemoStore((s) => s.presetId);
  const applyPreset = useDemoStore((s) => s.applyPreset);
  const reset = useDemoStore((s) => s.reset);
  const setOrderStatus = useDemoStore((s) => s.setOrderStatus);
  const orderId = /^\/pedido\/([^/]+)$/.exec(pathname)?.[1];
  const awaitingPayment = useDemoStore((s) => s.orders.some((o) => o.id === orderId && o.status === "aguardando_pagamento"));
  const inPainel = pathname.startsWith("/painel");
  // Páginas de produto podem ter barra fixa de compra no rodapé: o botão sobe para não cobri-la.
  const aboveBuyBar = pathname.startsWith("/produto/");

  return (
    <div className={`fixed right-md z-50 flex flex-col items-end gap-sm ${aboveBuyBar ? "bottom-24" : "bottom-md"}`}>
      {open && (
        <div
          role="dialog"
          aria-label="Controles da demo"
          className="w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-md shadow-lg"
        >
          <p className="text-xs font-bold uppercase text-muted">Preset</p>
          <div className="mt-xs flex flex-col gap-xs">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === presetId}
                onClick={() => applyPreset(p.id)}
                className={`rounded-md border px-md py-sm text-left text-sm ${p.id === presetId ? "border-primary bg-primary text-surface" : "border-border text-text"}`}
              >
                {p.config.name}
              </button>
            ))}
          </div>
          {orderId && awaitingPayment && (
            <button
              type="button"
              onClick={() => {
                setOrderStatus(orderId, "pago");
                setOpen(false);
              }}
              className="mt-md w-full rounded-md bg-primary px-md py-sm text-sm font-bold text-background"
            >
              Simular pagamento aprovado
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-md w-full rounded-md border border-danger px-md py-sm text-sm text-danger"
          >
            Resetar dados
          </button>
          <Link
            href={inPainel ? "/" : "/painel/produtos"}
            onClick={() => setOpen(false)}
            className="mt-sm block rounded-md border border-border px-md py-sm text-center text-sm text-text"
          >
            {inPainel ? "Ir para a vitrine" : "Ir para o painel"}
          </Link>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-secondary px-md py-sm text-sm font-bold text-text shadow-lg"
      >
        {open ? "Fechar demo" : "Demo"}
      </button>
    </div>
  );
}
