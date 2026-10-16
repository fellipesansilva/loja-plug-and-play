"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Product } from "@/domain/types";
import { LOGO_ACCEPT, logoProblem, observacaoPortico, textoSobre } from "@/lib/portico";
import { useDemoStore } from "@/store/demo-store";

const FEEDBACK_MS = 1600;

/**
 * Configurador do pórtico com a marca do cliente. Texto, cores, medidas e limites vêm de config.orcamentoBlocks.porticoConfigurador.
 * A prévia é um SVG que muda na hora. O logo fica só no navegador: guarda-se apenas o nome do arquivo (o conteúdo não é lido nem enviado).
 */
export function PorticoConfigurador({ product }: { product: Product }) {
  const cfg = useDemoStore((s) => s.config.orcamentoBlocks?.porticoConfigurador);
  const addConfiguredToQuote = useDemoStore((s) => s.addConfiguredToQuote);
  const ids = useId();
  const [texto, setTexto] = useState("");
  const [corId, setCorId] = useState<string>(cfg?.paleta[0]?.id ?? "");
  const [logoNome, setLogoNome] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAdd, setErroAdd] = useState<string | null>(null);
  const [adicionado, setAdicionado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!adicionado) return;
    const t = setTimeout(() => setAdicionado(false), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [adicionado]);

  if (!cfg || cfg.paleta.length === 0) return null;
  const cor = cfg.paleta.find((c) => c.id === corId) ?? cfg.paleta[0];
  const marca = texto.trim() || cfg.textoExemplo;
  const exibido = logoNome ?? marca;
  const tamanho = Math.max(18, Math.min(44, Math.floor(440 / (Math.max(exibido.length, 6) * 0.52))));
  const corTexto = textoSobre(cor.valor) === "claro" ? "var(--t-color-background)" : "var(--t-color-text)";

  function escolherLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const problema = logoProblem(file);
    if (problema) {
      setErro(problema);
      e.target.value = "";
      return;
    }
    setErro(null);
    setErroAdd(null);
    setLogoNome(file.name);
  }

  function removerLogo() {
    setLogoNome(null);
    setErro(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function adicionar() {
    if (!cfg) return;
    const nota = observacaoPortico({ medidas: cfg.medidas, cor: cor.nome, texto: marca, logoNome });
    const r = addConfiguredToQuote(product.id, nota);
    if (!r.ok) {
      setErroAdd(r.error);
      return;
    }
    setErroAdd(null);
    setAdicionado(true);
  }

  return (
    <section aria-labelledby={`${ids}-titulo`} className="mx-auto w-full max-w-page px-md py-xl" data-testid="portico-configurador">
      <h2 id={`${ids}-titulo`} className="text-4xl leading-none md:text-5xl">
        Monte antes de pedir
      </h2>
      <p className="mt-xs max-w-[40rem] text-muted">Veja o pórtico com o texto e a cor da sua marca. A prévia é ilustrativa; a arte final vem na proposta.</p>

      <div className="mt-lg grid gap-lg md:grid-cols-2">
        <div className="min-w-0 rounded-md bg-surface p-md" data-testid="portico-previa">
          <svg
            viewBox="0 0 600 340"
            role="img"
            aria-label={`Prévia do pórtico, cor ${cor.nome}, com ${logoNome ? `o logo ${logoNome}` : `o texto ${marca}`}`}
            className="h-auto w-full"
          >
            <rect x="0" y="300" width="600" height="40" className="fill-border" />
            <path
              d="M60 300 V120 Q60 40 300 40 Q540 40 540 120 V300 H470 V130 Q470 100 300 100 Q130 100 130 130 V300 Z"
              fill={cor.valor}
              data-testid="portico-arco"
              data-cor={cor.id}
            />
            {logoNome ? (
              <g data-testid="portico-previa-logo">
                <rect x="190" y="52" width="220" height="40" rx="4" fill="none" strokeDasharray="6 4" style={{ stroke: corTexto }} />
                <text x="300" y="78" textAnchor="middle" fontSize="16" style={{ fill: corTexto }}>
                  {logoNome.length > 24 ? `${logoNome.slice(0, 21)}…` : logoNome}
                </text>
              </g>
            ) : (
              <text
                x="300"
                y="82"
                textAnchor="middle"
                fontSize={tamanho}
                className="font-heading font-bold uppercase"
                style={{ fill: corTexto }}
                data-testid="portico-previa-texto"
              >
                {marca}
              </text>
            )}
          </svg>
          <p className="mt-sm text-xs text-muted">Medidas da prévia: {cfg.medidas}</p>
        </div>

        <div className="flex min-w-0 flex-col gap-md">
          <div>
            <label htmlFor={`${ids}-texto`} className="text-sm font-bold">
              Texto do pórtico
            </label>
            <input
              id={`${ids}-texto`}
              type="text"
              value={texto}
              maxLength={cfg.textoMax}
              placeholder={cfg.textoExemplo}
              onChange={(e) => {
                setTexto(e.target.value.slice(0, cfg.textoMax));
                setErroAdd(null);
              }}
              data-testid="portico-texto"
              className="mt-xs h-11 w-full rounded-md border border-border bg-background px-sm text-base"
              aria-describedby={`${ids}-contador`}
            />
            <p id={`${ids}-contador`} className="mt-xs text-right text-xs text-muted" data-testid="portico-contador" aria-live="polite">
              {texto.length}/{cfg.textoMax}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-bold">Cor do pórtico</legend>
            <div className="mt-xs flex flex-wrap gap-sm">
              {cfg.paleta.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === cor.id}
                  onClick={() => setCorId(c.id)}
                  data-testid="portico-cor"
                  data-cor={c.id}
                  className={`inline-flex min-h-11 items-center gap-sm rounded-button border px-md text-sm font-medium ${c.id === cor.id ? "border-text bg-surface" : "border-border bg-background"}`}
                >
                  <span aria-hidden="true" className="size-5 rounded-full border border-border" style={{ background: c.valor }} />
                  {c.nome}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${ids}-logo`} className="text-sm font-bold">
              Logo da empresa (opcional)
            </label>
            <p className="text-xs text-muted">PNG, JPG ou SVG, até 5 MB. Na demo o arquivo não sai do seu navegador; só o nome dele vai para a lista.</p>
            <input
              ref={fileRef}
              id={`${ids}-logo`}
              type="file"
              accept={LOGO_ACCEPT}
              onChange={escolherLogo}
              data-testid="portico-logo"
              className="mt-xs w-full text-sm"
              aria-describedby={erro ? `${ids}-erro-logo` : undefined}
            />
            {logoNome && (
              <p className="mt-xs flex flex-wrap items-center gap-sm text-sm" data-testid="portico-logo-nome">
                <span>
                  Logo: <strong>{logoNome}</strong>
                </span>
                <button type="button" onClick={removerLogo} className="inline-flex min-h-11 items-center underline">
                  Remover logo
                </button>
              </p>
            )}
            {erro && (
              <p id={`${ids}-erro-logo`} role="alert" className="mt-xs text-sm font-medium text-danger" data-testid="portico-logo-erro">
                {erro}
              </p>
            )}
          </div>

          <div>
            <button type="button" onClick={adicionar} data-testid="portico-adicionar" className="min-h-12 w-full rounded-button bg-primary px-lg font-bold text-background">
              {adicionado ? "Adicionado ✓" : "Adicionar ao orçamento com esta configuração"}
            </button>
            {erroAdd && (
              <p role="alert" className="mt-xs text-sm font-medium text-danger" data-testid="portico-erro-add">
                {erroAdd}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
