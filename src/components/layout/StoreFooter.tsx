"use client";

import { useDemoStore } from "@/store/demo-store";

export function StoreFooter() {
  const { name, legal } = useDemoStore((s) => s.config);
  return (
    <footer className="mt-xl border-t border-border bg-footer-bg">
      <div className="mx-auto w-full max-w-5xl px-md py-lg text-sm text-footer-text">
        <p className="font-bold">{name}</p>
        <p>{legal.document}</p>
        <p>{legal.address}</p>
        <p>{legal.contact}</p>
        <p className="mt-sm">Loja de demonstração — nenhum pedido real é processado.</p>
      </div>
    </footer>
  );
}
