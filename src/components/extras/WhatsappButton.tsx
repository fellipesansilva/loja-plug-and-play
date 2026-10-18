"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { stripPresetPrefix } from "@/lib/preset-href";
import { productSlugOf, whatsappText, whatsappUrl } from "@/lib/whatsapp";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";
import { WHATSAPP_OPEN_EVENT } from "./whatsapp-bus";

/**
 * Botão do WhatsApp (módulo `whatsapp`). A mensagem já vem preenchida, com o nome do produto quando a página é de um produto.
 * Na demonstração (`isReal` falso) nada abre o WhatsApp: o painel mostra a mensagem para copiar.
 */
export default function WhatsappButton() {
  const cfg = useDemoStore((s) => s.config.whatsapp);
  const { slug } = usePreset();
  const path = stripPresetPrefix(slug, usePathname());
  const productSlug = productSlugOf(path);
  const productName = useDemoStore((s) => (productSlug ? (s.products.find((p) => p.slug === productSlug)?.name ?? null) : null));
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setCopied(false);
      setOpen(true);
    };
    window.addEventListener(WHATSAPP_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(WHATSAPP_OPEN_EVENT, onOpen);
  }, []);

  if (!cfg) return null;
  const text = whatsappText(cfg, productName);
  const url = whatsappUrl(cfg, text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // sem permissão de área de transferência: o texto continua selecionável na caixa
      document.getElementById("whatsapp-mensagem")?.focus();
    }
    setCopied(true);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={cfg.title}
          data-testid="whatsapp-painel"
          className="absolute bottom-full left-0 z-50 mb-sm max-h-[60vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-surface p-md shadow-lg"
        >
          <div className="flex items-start justify-between gap-sm">
            <p className="font-bold">{cfg.title}</p>
            <button type="button" onClick={() => {
                setOpen(false);
                setCopied(false);
              }}
              aria-label={cfg.closeLabel} className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border">
              ×
            </button>
          </div>
          <p data-testid="whatsapp-marca" className="mt-xs inline-block rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
            {cfg.badge}
          </p>
          <label htmlFor="whatsapp-mensagem" className="mt-sm block text-sm font-bold">
            Mensagem
          </label>
          <textarea id="whatsapp-mensagem" data-testid="whatsapp-mensagem" readOnly rows={4} value={text} className="mt-xs w-full rounded-md border border-border bg-background p-sm text-base" />
          {!cfg.isReal && <p className="mt-xs text-xs text-muted">{cfg.demoNote}</p>}
          <div className="mt-sm flex flex-wrap items-center gap-sm">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background">
                {cfg.openLabel}
              </a>
            ) : (
              <button type="button" onClick={copy} data-testid="whatsapp-copiar" className="min-h-11 rounded-button bg-primary px-lg font-bold text-background">
                {cfg.copyLabel}
              </button>
            )}
            <p role="status" data-testid="whatsapp-status" className="min-h-6 text-sm font-bold text-success">
              {copied && !url ? cfg.copiedLabel : ""}
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setCopied(false);
          setOpen((v) => !v);
        }}
        data-testid="whatsapp-botao"
        className="min-h-11 rounded-lg bg-success px-lg text-sm font-bold text-background shadow-lg"
      >
        {cfg.openLabel}
      </button>
    </>
  );
}
