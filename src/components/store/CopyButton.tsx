"use client";

import { useEffect, useState } from "react";

/** Botão "Copiar": usa a área de transferência quando disponível e confirma com "Copiado!". */
export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Sem permissão/HTTPS: a confirmação visual continua (o código está visível na tela).
    }
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center rounded-button border border-border bg-surface px-md text-sm font-bold"
    >
      <span aria-live="polite">{copied ? "Copiado!" : label}</span>
    </button>
  );
}
