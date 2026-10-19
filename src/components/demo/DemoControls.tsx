"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { StoreLink } from "@/components/store/StoreLink";
import { stripPresetPrefix } from "@/lib/preset-href";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

/** Lojas da demonstração para a troca de loja: só id, apelido da URL e nome (o resto dos dados fica no servidor). */
export type PresetLink = { id: string; shortId: string; name: string };

export function DemoControls({ presets }: { presets: PresetLink[] }) {
  const [open, setOpen] = useState(false);
  const { id: currentId, slug } = usePreset();
  const path = stripPresetPrefix(slug, usePathname());
  const reset = useDemoStore((s) => s.reset);
  const setOrderStatus = useDemoStore((s) => s.setOrderStatus);
  const orderId = /^\/pedido\/([^/]+)$/.exec(path)?.[1];
  const awaitingPayment = useDemoStore((s) => s.orders.some((o) => o.id === orderId && o.status === "aguardando_pagamento"));
  const inPainel = path.startsWith("/painel");
  // Páginas de produto podem ter barra fixa de compra no rodapé: o botão sobe para não cobri-la.
  const aboveBuyBar = path.startsWith("/produto/");

  const presetRow = "rounded-md border px-md py-sm text-left text-sm";

  return (
    <div
      className={`fixed right-md z-50 flex flex-col items-end gap-sm ${aboveBuyBar ? "bottom-24" : "bottom-md"}`}
      style={{ transform: "translateY(calc(var(--cookie-banner-h, 0px) * -1))" }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Controles da demo"
          className="w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-md shadow-lg"
        >
          <p className="text-xs font-bold uppercase text-muted">Loja</p>
          <ul className="mt-xs flex flex-col gap-xs" aria-label="Lojas da demonstração">
            {presets.map((p) =>
              p.id === currentId ? (
                <li key={p.id}>
                  <span aria-current="true" className={`${presetRow} block border-primary bg-primary text-background`}>
                    {p.name}
                  </span>
                </li>
              ) : (
                // Cada preset é uma loja em /<preset>: a troca é um link interno para a home da outra loja.
                <li key={p.id}>
                  <Link href={`/${p.shortId}`} className={`${presetRow} block border-border text-text`}>
                    {p.name}
                  </Link>
                </li>
              ),
            )}
          </ul>
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
          <StoreLink
            href={inPainel ? "/" : "/painel/produtos"}
            onClick={() => setOpen(false)}
            className="mt-sm block rounded-md border border-border px-md py-sm text-center text-sm text-text"
          >
            {inPainel ? "Ir para a vitrine" : "Ir para o painel"}
          </StoreLink>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 rounded-lg bg-secondary px-lg text-sm font-bold text-text shadow-lg"
      >
        {open ? "Fechar demo" : "Demo"}
      </button>
    </div>
  );
}
