"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { useDemoStore } from "@/store/demo-store";
import {
  SORT_OPTIONS,
  type FilterGroup,
  type FilterSelection,
  type SortOrder,
} from "@/lib/filters";
import { CloseIcon } from "./Icons";

type Props = {
  groups: FilterGroup[];
  selection: FilterSelection;
  order: SortOrder;
  total: number;
  onToggle: (key: string, value: string) => void;
  onOrder: (order: SortOrder) => void;
  onClear: () => void;
};

/** Campos de filtro e ordenação (usado na barra lateral do desktop e no drawer do celular). */
function FilterFields({
  groups,
  selection,
  order,
  onToggle,
  onOrder,
  onClear,
  idPrefix,
}: Props & { idPrefix: string }) {
  const defs = useDemoStore((s) => s.config.attributeDefs);
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <label htmlFor={`${idPrefix}-ordem`} className="text-sm font-bold">
          Ordenar por
        </label>
        <select
          id={`${idPrefix}-ordem`}
          value={order}
          onChange={(e) => onOrder(e.target.value as SortOrder)}
          className="mt-xs h-11 w-full rounded-md border border-border bg-surface px-sm text-base"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {groups.map((g) => (
        <fieldset key={g.key}>
          <legend className="text-sm font-bold">{g.label}</legend>
          <div className="mt-xs flex flex-col">
            {g.values.map((v) => {
              const id = `${idPrefix}-${g.key}-${v}`;
              const color = defs.find((d) => d.key === g.key)?.swatches?.[v];
              return (
                <label key={v} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-sm">
                  <input
                    id={id}
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={selection[g.key]?.includes(v) ?? false}
                    onChange={() => onToggle(g.key, v)}
                  />
                  {color && (
                    <span
                      aria-hidden="true"
                      className="size-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span className="text-base">{v}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="min-h-11 rounded-button border border-border px-md text-sm font-medium"
      >
        Limpar filtros
      </button>
    </div>
  );
}

/** Painel lateral fixo no desktop (md+). */
export function FilterSidebar(props: Props) {
  const id = useId();
  return (
    <aside aria-label="Filtros" className="hidden w-60 shrink-0 md:block">
      <FilterFields {...props} idPrefix={`lateral${id}`} />
    </aside>
  );
}

const FOCUSABLE = "button, select, input";

/** Drawer de filtros do celular: fecha com Esc e devolve o foco ao botão que o abriu. */
export function FilterDrawer({
  open,
  onClose,
  triggerRef,
  ...props
}: Props & { open: boolean; onClose: () => void; triggerRef: RefObject<HTMLButtonElement | null> }) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-text/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        className="absolute inset-y-0 right-0 flex w-[min(22rem,100vw)] flex-col bg-background"
      >
        <div className="flex items-center justify-between border-b border-border px-md py-sm">
          <h2 className="text-xl">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar filtros"
            className="inline-flex size-11 items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-md py-md">
          <FilterFields {...props} idPrefix={`drawer${id}`} />
        </div>
        <div className="border-t border-border p-md">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-button bg-primary px-md font-bold text-background"
          >
            Ver {props.total} {props.total === 1 ? "resultado" : "resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}
