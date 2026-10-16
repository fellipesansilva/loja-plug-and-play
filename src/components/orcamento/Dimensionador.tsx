"use client";

import { useEffect, useId, useState } from "react";
import { StoreLink as Link } from "@/components/store/StoreLink";
import type { Product } from "@/domain/types";
import { formatarLitros, observacaoDimensionador, sugerir, textoDias } from "@/lib/dimensionador";
import { useDemoStore } from "@/store/demo-store";

const FEEDBACK_MS = 1600;
const CONSUMO_MAX_DIGITOS = 9;

/**
 * Dimensionador de reservatório: consumo diário × dias de reserva → volume necessário → modelo sugerido da linha do produto
 * (fechado ou aberto). Capacidades, limites de dias e unidade vêm de config.orcamentoBlocks.dimensionador; o nome do modelo é montado
 * a partir do produto do preset.
 */
export function Dimensionador({ product }: { product: Product }) {
  const cfg = useDemoStore((s) => s.config.orcamentoBlocks?.dimensionador);
  const addConfiguredToQuote = useDemoStore((s) => s.addConfiguredToQuote);
  const ids = useId();
  const [consumoTexto, setConsumoTexto] = useState("");
  const [dias, setDias] = useState(cfg?.diasMin ?? 1);
  const [adicionado, setAdicionado] = useState(false);
  const [erroAdd, setErroAdd] = useState<string | null>(null);

  useEffect(() => {
    if (!adicionado) return;
    const t = setTimeout(() => setAdicionado(false), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [adicionado]);

  if (!cfg) return null;
  const linha = cfg.fechado.produto === product.id ? cfg.fechado : cfg.aberto.produto === product.id ? cfg.aberto : null;
  if (!linha) return null;

  const consumo = consumoTexto === "" ? 0 : Number(consumoTexto);
  const sugestao = sugerir(linha, consumo, dias);
  const valida = sugestao.tipo !== "sem-consumo";
  const maior = Math.max(...linha.capacidades);

  function adicionar() {
    if (sugestao.tipo === "sem-consumo") return;
    const nota = observacaoDimensionador(sugestao, consumo, dias, cfg!.unidadeConsumo);
    const r = addConfiguredToQuote(product.id, nota, sugestao.tipo === "varios" ? sugestao.quantidade : 1);
    if (!r.ok) {
      setErroAdd(r.error);
      return;
    }
    setErroAdd(null);
    setAdicionado(true);
  }

  return (
    <section aria-labelledby={`${ids}-titulo`} className="mx-auto w-full max-w-page px-md py-xl" data-testid="dimensionador">
      <h2 id={`${ids}-titulo`} className="text-4xl leading-none md:text-5xl">
        Calcule o volume que você precisa
      </h2>
      <p className="mt-xs max-w-[40rem] text-muted">Informe o consumo diário e os dias de reserva. Sugerimos o modelo desta linha; a medida final vem na proposta.</p>

      <div className="mt-lg grid gap-lg md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-md">
          <div>
            <label htmlFor={`${ids}-consumo`} className="text-sm font-bold">
              Consumo diário ({cfg.unidadeConsumo})
            </label>
            <input
              id={`${ids}-consumo`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={consumoTexto === "" ? "" : formatarLitros(Number(consumoTexto))}
              placeholder="Ex.: 1.500"
              onChange={(e) => {
                setConsumoTexto(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, CONSUMO_MAX_DIGITOS));
                setErroAdd(null);
              }}
              data-testid="dim-consumo"
              className="mt-xs h-11 w-full rounded-md border border-border bg-background px-sm text-base"
            />
          </div>

          <div>
            <label htmlFor={`${ids}-dias`} className="text-sm font-bold">
              Dias de reserva: <span data-testid="dim-dias-texto">{textoDias(dias)}</span>
            </label>
            <input
              id={`${ids}-dias`}
              type="range"
              min={cfg.diasMin}
              max={cfg.diasMax}
              step={1}
              value={dias}
              onChange={(e) => {
                setDias(Math.min(cfg.diasMax, Math.max(cfg.diasMin, Math.floor(Number(e.target.value)))));
                setErroAdd(null);
              }}
              aria-valuetext={textoDias(dias)}
              data-testid="dim-dias"
              className="mt-xs w-full"
            />
            <p className="flex justify-between text-xs text-muted" aria-hidden="true">
              <span>{textoDias(cfg.diasMin)}</span>
              <span>{textoDias(cfg.diasMax)}</span>
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-md rounded-md bg-surface p-md" aria-live="polite" data-testid="dim-resultado">
          {sugestao.tipo === "sem-consumo" && <p className="text-muted">Informe o consumo diário</p>}
          {sugestao.tipo !== "sem-consumo" && (
            <>
              <p className="text-sm text-muted">
                Volume necessário:{" "}
                <strong className="text-text" data-testid="dim-necessario">
                  {formatarLitros(sugestao.necessario)} L
                </strong>{" "}
                ({formatarLitros(consumo)} {cfg.unidadeConsumo} × {textoDias(dias)})
              </p>
              {sugestao.tipo === "modelo" ? (
                <p className="font-heading text-3xl font-bold leading-tight" data-testid="dim-sugestao">
                  {product.name} de {formatarLitros(sugestao.capacidade)} L
                </p>
              ) : (
                <div data-testid="dim-sugestao">
                  <p className="font-heading text-3xl font-bold leading-tight">
                    {sugestao.quantidade} reservatórios de {formatarLitros(sugestao.capacidade)} L
                  </p>
                  <p className="mt-xs text-sm">
                    Acima de {formatarLitros(maior)} L, ou projeto sob medida.{" "}
                    <Link href="/orcamento" className="font-bold underline">
                      Pedir projeto sob medida
                    </Link>
                  </p>
                </div>
              )}
            </>
          )}
          <div>
            <button
              type="button"
              onClick={adicionar}
              aria-disabled={!valida}
              data-testid="dim-adicionar"
              className={`min-h-12 w-full rounded-button bg-primary px-lg font-bold text-background ${valida ? "" : "opacity-50"}`}
            >
              {adicionado ? "Adicionado ✓" : "Adicionar sugestão ao orçamento"}
            </button>
            {erroAdd && (
              <p role="alert" className="mt-xs text-sm font-medium text-danger" data-testid="dim-erro">
                {erroAdd}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
