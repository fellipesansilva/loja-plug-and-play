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
  const inPainel = pathname.startsWith("/painel");

  return (
    <div className="fixed bottom-md right-md z-50 flex flex-col items-end gap-sm">
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
