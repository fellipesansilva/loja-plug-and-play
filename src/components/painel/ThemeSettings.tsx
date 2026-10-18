"use client";

import { useState } from "react";
import type { ColorChoice } from "@/domain/types";
import { PageTitle } from "@/components/store/PageTitle";
import { MIN_TEXT_CONTRAST } from "@/theme/contrast";
import { tokensToCssVars } from "@/theme/tokens";
import { defaultThemeIds, describeContrastIssue, themeContrastIssues, themeWithChoice, type ThemeIds } from "@/lib/store-config";
import { getPreset } from "@/presets";
import { useDemoStore } from "@/store/demo-store";

const select = "mt-xs h-11 w-full rounded-md border border-border bg-surface px-md text-base";

/** Opções de cor da paleta aprovada, como botões de rádio com a amostra da cor, o nome e o valor. */
function ColorGroup({ legend, name, options, value, onChange }: { legend: string; name: string; options: ColorChoice[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-bold">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="mt-xs grid grid-cols-2 gap-sm sm:grid-cols-4" data-testid={`tema-${name}`}>
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex min-h-11 cursor-pointer items-center gap-sm rounded-md border px-sm py-xs text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-text ${value === o.id ? "border-text bg-surface font-bold" : "border-border bg-surface"}`}
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            <span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-border" style={{ background: o.value }} />
            <span className="min-w-0">
              <span className="block truncate">{o.label}</span>
              <span className="block text-xs text-muted">{o.value}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Configurações › Tema: cor principal, cor de destaque e fontes, só dentro do que o preset aprovou; a prévia muda na hora. */
export function ThemeSettings() {
  const presetId = useDemoStore((s) => s.presetId);
  const overrides = useDemoStore((s) => s.overrides);
  const saveOverrides = useDemoStore((s) => s.saveOverrides);
  const preset = getPreset(presetId)!;
  const base = preset.config;
  const choices = base.themeChoices;
  const saved = overrides.theme ?? (choices ? defaultThemeIds(base) : null);
  const [draft, setDraft] = useState<ThemeIds | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!choices || !saved) {
    return (
      <section className="mx-auto w-full max-w-page px-md py-lg">
        <PageTitle title="Tema" />
        <h1 className="text-3xl">Tema</h1>
        <p className="mt-sm text-muted">Este preset não define opções de tema.</p>
      </section>
    );
  }

  const value = draft ?? saved;
  const set = (patch: Partial<ThemeIds>) => {
    setDraft({ ...value, ...patch });
    setMessage(null);
  };
  const issues = themeContrastIssues(base, value);
  const theme = themeWithChoice(base, value);
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const blocked = issues.length > 0;

  function save() {
    if (blocked) return;
    saveOverrides({ ...overrides, theme: value });
    setDraft(null);
    setMessage("Tema salvo. A loja já usa as novas cores e fontes.");
  }

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg" data-testid="tema-config">
      <PageTitle title="Tema" />
      <h1 className="text-3xl">Tema</h1>
      <p className="mt-xs max-w-[44rem] text-muted">
        Escolha a cor principal, a cor de destaque e as fontes entre as opções aprovadas para esta loja. Os textos precisam de contraste mínimo de{" "}
        {String(MIN_TEXT_CONTRAST).replace(".", ",")}:1 com o fundo.
      </p>

      <div className="mt-lg grid gap-lg md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form
          className="flex min-w-0 flex-col gap-lg"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <ColorGroup legend="Cor principal" name="principal" options={choices.primary} value={value.primary} onChange={(id) => set({ primary: id })} />
          <ColorGroup legend="Cor de destaque" name="destaque" options={choices.accent} value={value.accent} onChange={(id) => set({ accent: id })} />
          <div className="grid gap-md sm:grid-cols-2">
            <div>
              <label htmlFor="tema-fonte-titulo" className="text-sm font-bold">
                Fonte dos títulos
              </label>
              <select id="tema-fonte-titulo" value={value.headingFont} onChange={(e) => set({ headingFont: e.target.value })} className={select}>
                {choices.fonts.heading.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tema-fonte-texto" className="text-sm font-bold">
                Fonte do texto
              </label>
              <select
                id="tema-fonte-texto"
                value={value.bodyFont}
                onChange={(e) => set({ bodyFont: e.target.value })}
                disabled={choices.fonts.body.length < 2}
                aria-describedby={choices.fonts.body.length < 2 ? "tema-fonte-texto-nota" : undefined}
                className={`${select} disabled:opacity-70`}
              >
                {choices.fonts.body.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              {choices.fonts.body.length < 2 && (
                <p id="tema-fonte-texto-nota" className="mt-xs text-xs text-muted">
                  Só uma fonte de texto foi aprovada para esta loja.
                </p>
              )}
            </div>
          </div>

          {blocked ? (
            <div role="alert" data-testid="tema-contraste-erro" className="rounded-md border border-danger bg-surface p-md text-sm">
              <p className="font-bold text-danger">Esta combinação não pode ser salva.</p>
              <ul className="mt-xs list-disc pl-lg">
                {issues.map((i) => (
                  <li key={`${i.fg}-${i.bg}`}>{describeContrastIssue(i)}</li>
                ))}
              </ul>
              <p className="mt-xs text-muted">Troque a cor de destaque ou a principal.</p>
            </div>
          ) : (
            <p className="text-sm text-muted" data-testid="tema-contraste-ok">
              Contraste dos textos: dentro do mínimo de {String(MIN_TEXT_CONTRAST).replace(".", ",")}:1.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-md">
            <button
              type="submit"
              disabled={blocked || !dirty}
              data-testid="tema-salvar"
              className="min-h-12 rounded-button bg-primary px-lg font-bold text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar tema
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(defaultThemeIds(base));
                setMessage(null);
              }}
              className="min-h-12 rounded-button border border-border bg-surface px-lg font-bold"
            >
              Voltar ao padrão do preset
            </button>
          </div>
          <p role="status" data-testid="tema-status" className="min-h-6 text-sm font-bold text-success">
            {message}
          </p>
        </form>

        <div
          data-testid="tema-previa"
          aria-label="Prévia do tema"
          role="group"
          style={{ ...tokensToCssVars(theme), background: "var(--t-color-background)", color: "var(--t-color-text)" } as React.CSSProperties}
          className="h-fit min-w-0 overflow-hidden rounded-md border border-border font-body"
        >
          <p className="px-md py-xs text-center text-xs font-bold" style={{ background: "var(--t-color-announcementBg)", color: "var(--t-color-announcementText)" }}>
            Faixa de aviso da loja
          </p>
          <div className="p-md">
            <p className="text-xs uppercase tracking-widest text-muted">Prévia</p>
            <h2 className="mt-xs text-2xl">
              Título da página
            </h2>
            <p className="mt-xs text-base">Texto corrido da loja, na fonte escolhida para o conteúdo.</p>
            <div className="mt-md flex flex-wrap items-center gap-sm">
              <span className="inline-flex min-h-11 items-center rounded-button px-lg font-bold" style={{ background: "var(--t-color-primary)", color: "var(--t-color-background)" }}>
                Comprar
              </span>
              <span className="inline-flex min-h-11 items-center rounded-button px-lg font-bold" style={{ background: "var(--t-color-secondary)", color: "var(--t-color-text)" }}>
                Destaque
              </span>
              <span className="rounded-button px-3 py-1 text-xs font-bold" style={{ background: "var(--t-color-highlightBg)", color: "var(--t-color-highlightText)" }}>
                Selo
              </span>
            </div>
            <p className="mt-md text-sm font-bold underline" style={{ color: "var(--t-color-primary)" }}>
              Link na cor principal
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
