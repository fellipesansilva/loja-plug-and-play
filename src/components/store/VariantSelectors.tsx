"use client";

import type { AttributeDef, Product } from "@/domain/types";
import { formatBRL } from "@/lib/money";
import { isOptionAvailable, variantPrice, type Selection, type VariantAxis } from "@/lib/variants";

type Props = {
  product: Product;
  axes: VariantAxis[];
  defs: AttributeDef[];
  selection: Selection;
  onSelect: (key: string, value: string) => void;
};

const unavailable = "border-dashed text-muted line-through opacity-60 cursor-not-allowed";

function AxisOptions({
  axis,
  def,
  product,
  selection,
  onSelect,
}: { axis: VariantAxis; def?: AttributeDef } & Omit<Props, "axes" | "defs">) {
  const selector = def?.selector ?? "pill";
  const options = axis.values.map((value) => ({
    value,
    selected: selection[axis.key] === value,
    available: isOptionAvailable(product, selection, axis.key, value),
  }));

  if (selector === "swatch") {
    return (
      <div className="flex flex-wrap gap-sm">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-label={o.available ? o.value : `${o.value} (indisponível)`}
            aria-pressed={o.selected}
            disabled={!o.available}
            onClick={() => onSelect(axis.key, o.value)}
            style={{ backgroundColor: def?.swatches?.[o.value] }}
            className={`relative size-11 rounded-full border-2 ${o.selected ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"} ${o.available ? "" : "border-dashed opacity-40"}`}
          >
            {!o.available && <span aria-hidden="true" className="absolute inset-x-1 top-1/2 h-px rotate-45 bg-text" />}
          </button>
        ))}
      </div>
    );
  }

  if (selector === "list") {
    return (
      <div className="flex flex-col gap-sm">
        {options.map((o) => {
          const variant = product.variants.find((v) => v.attributes[axis.key] === o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={o.selected}
              disabled={!o.available}
              onClick={() => onSelect(axis.key, o.value)}
              className={`flex min-h-11 items-center justify-between gap-md rounded-md border px-md py-sm text-left ${o.selected ? "border-primary bg-surface ring-1 ring-primary" : "border-border"} ${o.available ? "" : unavailable}`}
            >
              <span>{o.value}</span>
              <span className="font-bold">{formatBRL(variantPrice(product, variant))}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.selected}
          disabled={!o.available}
          onClick={() => onSelect(axis.key, o.value)}
          className={`min-h-11 rounded-md border px-sm text-base font-medium ${o.selected ? "border-primary bg-primary text-background" : "border-border bg-surface"} ${o.available ? "" : unavailable}`}
        >
          {o.value}
        </button>
      ))}
    </div>
  );
}

/** Seletores de variação; o formato de cada atributo (pill, swatch, list) vem da definição no preset. */
export function VariantSelectors({ product, axes, defs, selection, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-lg">
      {axes.map((axis) => (
        <fieldset key={axis.key}>
          <legend className="mb-sm text-sm font-bold">
            {axis.label}
            {selection[axis.key] ? `: ${selection[axis.key]}` : ""}
          </legend>
          <AxisOptions
            axis={axis}
            def={defs.find((d) => d.key === axis.key)}
            product={product}
            selection={selection}
            onSelect={onSelect}
          />
        </fieldset>
      ))}
    </div>
  );
}
