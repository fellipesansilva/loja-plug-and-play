"use client";

import { useState } from "react";
import type { Modules } from "@/domain/types";
import { PageTitle } from "@/components/store/PageTitle";
import { MODULE_DEPENDS_ON, MODULE_INFO, MODULE_KEYS, dependentsOf, isModuleOn, moduleLabel, toggleModule, type ModuleKey } from "@/lib/modules";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

/** Configurações › Módulos: liga e desliga cada módulo do preset. As regras de dependência e de exclusão vêm de src/lib/modules.ts. */
export function ModulesSettings() {
  const config = useDemoStore((s) => s.config);
  const overrides = useDemoStore((s) => s.overrides);
  const saveOverrides = useDemoStore((s) => s.saveOverrides);
  const { preset } = usePreset();
  const [draft, setDraft] = useState<Modules | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<{ key: ModuleKey; text: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const modules = draft ?? config.modules;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(config.modules);

  function toggle(key: ModuleKey, on: boolean) {
    const r = toggleModule(preset, { ...config, modules }, key, on);
    setMessage(null);
    if (!r.ok) {
      setError({ key, text: r.error });
      setNotes([]);
      return;
    }
    setError(null);
    setNotes(r.notes);
    setDraft(r.modules);
  }

  function save() {
    saveOverrides({ ...overrides, modules });
    setDraft(null);
    setNotes([]);
    setError(null);
    setMessage("Módulos salvos. A loja já usa a nova configuração.");
  }

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg" data-testid="modulos-config">
      <PageTitle title="Módulos" />
      <h1 className="text-3xl">Módulos</h1>
      <p className="mt-xs max-w-[44rem] text-muted">
        Ligue só o que a loja usa. Desligar um módulo tira as telas e os campos dele da loja. O modo orçamento e os módulos de venda não podem ficar ligados juntos.
      </p>

      <ul className="mt-lg flex max-w-[48rem] flex-col gap-sm" data-testid="modulos-lista">
        {MODULE_KEYS.map((key) => {
          const on = isModuleOn(modules, key);
          const needs = MODULE_DEPENDS_ON[key]?.map(moduleLabel);
          const needed = dependentsOf(key).map(moduleLabel);
          const id = `modulo-${key}`;
          return (
            <li key={key} className="rounded-md border border-border bg-surface p-md" data-testid={`modulo-${key}`}>
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p id={`${id}-nome`} className="font-bold">
                    {MODULE_INFO[key].label}
                  </p>
                  <p id={`${id}-ajuda`} className="text-sm text-muted">
                    {MODULE_INFO[key].help}
                  </p>
                  {needs && <p className="mt-xs text-xs text-muted">Depende de: {needs.join(", ")}.</p>}
                  {needed.length > 0 && <p className="mt-xs text-xs text-muted">Usado por: {needed.join(", ")}.</p>}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={`${id}-nome`}
                  aria-describedby={`${id}-ajuda`}
                  onClick={() => toggle(key, !on)}
                  className={`relative inline-flex h-11 w-16 shrink-0 items-center rounded-full border border-border px-1 ${on ? "bg-primary" : "bg-background"}`}
                >
                  <span aria-hidden="true" className={`size-8 rounded-full bg-surface shadow transition-transform ${on ? "translate-x-6" : "translate-x-0"}`} />
                  <span className="sr-only">{on ? "Ligado" : "Desligado"}</span>
                </button>
              </div>
              {error?.key === key && (
                <p role="alert" data-testid="modulos-erro" className="mt-sm rounded-md border border-danger p-sm text-sm text-danger">
                  {error.text}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {notes.length > 0 && (
        <div role="status" data-testid="modulos-avisos" className="mt-md max-w-[48rem] text-sm">
          <ul className="list-disc pl-lg">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-lg flex flex-wrap items-center gap-md">
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          data-testid="modulos-salvar"
          className="min-h-12 rounded-button bg-primary px-lg font-bold text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Salvar módulos
        </button>
        {dirty && <span className="text-sm text-muted">Alterações ainda não salvas.</span>}
      </div>
      <p role="status" data-testid="modulos-status" className="mt-sm min-h-6 text-sm font-bold text-success">
        {message}
      </p>
    </section>
  );
}
