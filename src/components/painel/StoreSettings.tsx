"use client";

import { useState } from "react";
import type { Modules, StoreConfig } from "@/domain/types";
import { MIN_DEFECT_DAYS } from "@/domain/types";
import { PageTitle } from "@/components/store/PageTitle";
import { formatDateTime } from "@/lib/datetime";
import { validateConfig } from "@/lib/modules";
import { formatBRL } from "@/lib/money";
import { formatPriceInput, parsePriceBR } from "@/lib/price-input";
import { RULE_LIMITS, applyOverrides, type StoreOverrides } from "@/lib/store-config";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

type Form = { name: string; legalName: string; document: string; address: string; email: string; phone: string; defectDays: string; pix: string; freeMin: string };
type FieldKey = keyof Form;

const control = "mt-xs h-11 w-full rounded-md border border-border bg-surface px-md text-base aria-[invalid=true]:border-danger";

const FIELD_OF_PROBLEM: [RegExp, FieldKey][] = [
  [/config\.legal\.name/, "legalName"],
  [/config\.legal\.document/, "document"],
  [/config\.legal\.address/, "address"],
  [/config\.legal\.email/, "email"],
  [/config\.legal\.phone/, "phone"],
  [/config\.policies\.defect\.days/, "defectDays"],
];

/** Texto do problema sem o caminho do campo ("config.legal.document: informe o CNPJ" → "informe o CNPJ"). */
const plain = (problem: string) => problem.replace(/^[\w.]+:\s*/, "");

function formFrom(config: StoreConfig, ov: StoreOverrides): Form {
  const l = ov.loja;
  return {
    name: l?.name ?? config.name,
    legalName: l?.legalName ?? config.legal.name,
    document: l?.document ?? config.legal.document,
    address: l?.address ?? config.legal.address,
    email: l?.email ?? config.legal.email,
    phone: l?.phone ?? config.legal.phone,
    defectDays: String(config.policies.defect.days),
    pix: config.modules.descontoPix?.enabled ? String(config.modules.descontoPix.percent).replace(".", ",") : "",
    freeMin: config.modules.freteGratis?.enabled ? formatPriceInput(config.modules.freteGratis.minValue) : "",
  };
}

/** Configurações › Loja: identificação, prazo de troca (CDC, art. 26) e as regras de venda editáveis (Pix e frete grátis). */
export function StoreSettings() {
  const config = useDemoStore((s) => s.config);
  const overrides = useDemoStore((s) => s.overrides);
  const saveOverrides = useDemoStore((s) => s.saveOverrides);
  const { preset } = usePreset();
  const base = preset.config;
  const saved = formFrom(config, overrides);
  const [draft, setDraft] = useState<Form | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publishProblems, setPublishProblems] = useState<string[] | null>(null);
  const form = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const sale = base.modules.orcamento?.enabled !== true;
  const pixOn = config.modules.descontoPix?.enabled === true;
  const freeOn = config.modules.freteGratis?.enabled === true;
  const durability = base.policies.defect.durability;
  const minDefect = MIN_DEFECT_DAYS[durability];

  const set = (key: FieldKey, value: string) => {
    setDraft({ ...form, [key]: value });
    setMessage(null);
    setPublishProblems(null);
  };

  /** O que o formulário vira na configuração salva; null em `errors` quando o campo é válido. */
  function build(f: Form) {
    const errors: Partial<Record<FieldKey, string>> = {};
    const days = /^\d+$/.test(f.defectDays.trim()) ? Number(f.defectDays.trim()) : null;
    if (days === null) errors.defectDays = "Informe o prazo em dias, com número inteiro.";
    let modules: Modules = config.modules;
    if (pixOn) {
      const n = Number(f.pix.trim().replace(",", "."));
      const { min, max } = RULE_LIMITS.pixPercent;
      if (f.pix.trim() === "" || Number.isNaN(n) || n < min || n > max) errors.pix = `Informe um percentual de ${min} a ${max}.`;
      else modules = { ...modules, descontoPix: { ...modules.descontoPix!, enabled: true, percent: n } };
    }
    if (freeOn) {
      const cents = parsePriceBR(f.freeMin);
      const { min, max } = RULE_LIMITS.freeShippingMin;
      if (cents === null || cents < min || cents > max) errors.freeMin = `Informe um valor de ${formatBRL(min)} a ${formatBRL(max)}, como 199,00.`;
      else modules = { ...modules, freteGratis: { ...modules.freteGratis!, enabled: true, minValue: cents } };
    }
    const ov: StoreOverrides = {
      ...overrides,
      loja: { name: f.name, legalName: f.legalName, document: f.document, address: f.address, email: f.email, phone: f.phone },
      policies: days === null ? overrides.policies : { defectDays: days },
      modules: pixOn || freeOn ? modules : overrides.modules,
    };
    // A mesma validação do build, sobre o resultado: é ela que recusa prazo de troca abaixo do CDC, art. 26.
    if (days !== null) {
      for (const p of validateConfig(preset, applyOverrides(preset, config, ov))) {
        const hit = FIELD_OF_PROBLEM.find(([re]) => re.test(p));
        if (hit && !errors[hit[1]]) errors[hit[1]] = plain(p);
      }
    }
    return { ov, errors };
  }

  const { ov, errors } = build(form);
  const hasErrors = Object.keys(errors).length > 0;

  function save() {
    if (hasErrors) return;
    saveOverrides(ov);
    setDraft(null);
    setPublishProblems(null);
    setMessage("Alterações salvas. A loja já usa os novos dados e regras.");
  }

  function publish() {
    if (hasErrors) return;
    // Na publicação os campos de identificação não podem estar vazios: a validação do build roda sem preencher os vazios com o padrão.
    const problems = validateConfig(preset, applyOverrides(preset, config, ov, { strict: true }));
    if (problems.length > 0) {
      setPublishProblems(problems);
      setMessage(null);
      return;
    }
    saveOverrides({ ...ov, publicada: { at: new Date().toISOString() } });
    setDraft(null);
    setPublishProblems(null);
    setMessage("Loja publicada (simulado: nada sai do navegador).");
  }

  /** Erro do campo: o da validação do que está digitado ou, depois de tentar publicar, o que a validação do build apontou como faltando. */
  const fieldError = (k: FieldKey): string | undefined => {
    const missing = (publishProblems ?? []).find((p) => FIELD_OF_PROBLEM.some(([re, kk]) => kk === k && re.test(p)));
    return errors[k] ?? (missing ? plain(missing) : undefined);
  };
  const baseValue: Partial<Record<FieldKey, string>> = { name: base.name, legalName: base.legal.name, document: base.legal.document, address: base.legal.address, email: base.legal.email, phone: base.legal.phone };

  const text = (k: FieldKey, label: string, opts: { required?: boolean; type?: string; hint?: string; inputMode?: "numeric" | "decimal" | "tel" | "email" | "text"; widthClass?: string } = {}) => {
    const err = fieldError(k);
    const demo = baseValue[k] !== undefined && form[k] === baseValue[k];
    return (
      <div className={opts.widthClass}>
        <div className="flex flex-wrap items-baseline justify-between gap-xs">
          <label htmlFor={`loja-${k}`} className="text-sm font-bold">
            {label}
            {opts.required && <span className="font-normal text-muted"> (obrigatório para publicar)</span>}
          </label>
          {demo && (
            <span data-testid={`demo-${k}`} className="rounded-button border border-border bg-highlight-bg px-2 py-[2px] text-xs font-bold text-highlight-text">
              Dado de demonstração
            </span>
          )}
        </div>
        <input
          id={`loja-${k}`}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `loja-${k}-erro` : opts.hint ? `loja-${k}-dica` : undefined}
          className={control}
        />
        {opts.hint && !err && (
          <p id={`loja-${k}-dica`} className="mt-xs text-xs text-muted">
            {opts.hint}
          </p>
        )}
        {err && (
          <p id={`loja-${k}-erro`} data-testid={`erro-${k}`} className="mt-xs text-sm text-danger">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg" data-testid="loja-config">
      <PageTitle title="Loja" />
      <h1 className="text-3xl">Loja</h1>
      <p className="mt-xs max-w-[44rem] text-muted">
        Dados da loja, prazo de troca e regras de venda. Para publicar, CNPJ/CPF, endereço e contato são obrigatórios, mesmo com dados fictícios.
      </p>
      {overrides.publicada && (
        <p data-testid="loja-publicada" className="mt-sm text-sm font-bold text-success">
          Publicada em {formatDateTime(overrides.publicada.at)} (simulado).
        </p>
      )}

      <form
        className="mt-lg flex max-w-[48rem] flex-col gap-lg"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <fieldset className="grid gap-md sm:grid-cols-2">
          <legend className="mb-sm text-lg font-bold">Identificação</legend>
          {text("name", "Nome da loja")}
          {text("legalName", "Razão social ou nome", { required: true })}
          {text("document", "CNPJ ou CPF", { required: true, inputMode: "numeric" })}
          {text("address", "Endereço", { required: true })}
          {text("email", "E-mail de contato", { required: true, type: "email", inputMode: "email" })}
          {text("phone", "Telefone de contato", { required: true, type: "tel", inputMode: "tel" })}
        </fieldset>

        <fieldset className="grid gap-md sm:grid-cols-2">
          <legend className="mb-sm text-lg font-bold">Troca por defeito</legend>
          {text("defectDays", "Prazo de troca (dias)", {
            inputMode: "numeric",
            hint: `Produtos ${durability === "durable" ? "duráveis" : "não duráveis"}: no mínimo ${minDefect} dias (CDC, art. 26).`,
          })}
        </fieldset>

        {sale && (
          <fieldset className="grid gap-md sm:grid-cols-2">
            <legend className="mb-sm text-lg font-bold">Regras de venda</legend>
            {pixOn ? (
              text("pix", "Desconto no Pix (%)", { inputMode: "decimal", hint: `De ${RULE_LIMITS.pixPercent.min} a ${RULE_LIMITS.pixPercent.max}%, sobre o valor após o cupom, nunca sobre o frete.` })
            ) : (
              <p className="text-sm text-muted">Desconto no Pix: ligue o módulo em Módulos para editar.</p>
            )}
            {freeOn ? (
              text("freeMin", "Frete grátis acima de (R$)", { inputMode: "decimal", hint: "Valor do pedido, em reais." })
            ) : (
              <p className="text-sm text-muted">Frete grátis: ligue o módulo em Módulos para editar.</p>
            )}
          </fieldset>
        )}

        {publishProblems && (
          <div role="alert" data-testid="loja-publicar-erro" className="rounded-md border border-danger bg-surface p-md text-sm">
            <p className="font-bold text-danger">A loja não foi publicada. Falta:</p>
            <ul className="mt-xs list-disc pl-lg">
              {publishProblems.map((p) => (
                <li key={p}>{plain(p)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-md">
          <button
            type="submit"
            disabled={hasErrors || !dirty}
            data-testid="loja-salvar"
            className="min-h-12 rounded-button bg-primary px-lg font-bold text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={hasErrors}
            data-testid="loja-publicar"
            className="min-h-12 rounded-button border border-text bg-surface px-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publicar loja
          </button>
        </div>
        <p role="status" data-testid="loja-status" className="min-h-6 text-sm font-bold text-success">
          {message}
        </p>
      </form>
    </section>
  );
}
