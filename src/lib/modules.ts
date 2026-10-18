import type { Modules, Preset, StoreConfig } from "@/domain/types";
import { quoteSalesConflict, salesModulesOn, validatePreset } from "@/presets/validate";

/** Módulos que o painel liga e desliga (Configurações › Módulos), na ordem da tela. */
export const MODULE_KEYS = ["orcamento", "retiradaLocal", "freteGratis", "cartao", "parcelamento", "boleto", "descontoPix", "cupom"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_INFO: Record<ModuleKey, { label: string; help: string }> = {
  orcamento: { label: "Modo orçamento", help: "Sem preço, carrinho nem pagamento: o cliente monta uma lista e pede orçamento." },
  retiradaLocal: { label: "Retirada no local", help: "O cliente retira o pedido na loja, sem frete." },
  freteGratis: { label: "Frete grátis", help: "Frete grátis acima de um valor, com a barra de progresso no carrinho." },
  cartao: { label: "Cartão de crédito", help: "Pagamento com cartão no checkout." },
  parcelamento: { label: "Parcelamento", help: "Parcelas no cartão, sem juros, até o limite do preset." },
  boleto: { label: "Boleto", help: "Pagamento por boleto no checkout." },
  descontoPix: { label: "Desconto no Pix", help: "Percentual de desconto no pagamento por Pix." },
  cupom: { label: "Cupom de desconto", help: "Campo de cupom no carrinho." },
};

/** Dependências: o módulo da chave só funciona com os da lista ligados (ex.: parcelamento é parcelamento no cartão). */
export const MODULE_DEPENDS_ON: Partial<Record<ModuleKey, ModuleKey[]>> = { parcelamento: ["cartao"] };

export const moduleLabel = (key: string): string => MODULE_INFO[key as ModuleKey]?.label ?? key;

/** Quem depende de `key`. */
export function dependentsOf(key: ModuleKey): ModuleKey[] {
  return MODULE_KEYS.filter((k) => MODULE_DEPENDS_ON[k]?.includes(key));
}

export function isModuleOn(m: Modules, key: ModuleKey): boolean {
  switch (key) {
    case "orcamento": return m.orcamento?.enabled === true;
    case "retiradaLocal": return m.retiradaLocal === true;
    case "boleto": return m.boleto === true;
    case "cupom": return m.cupom === true;
    case "freteGratis": return m.freteGratis?.enabled === true;
    case "parcelamento": return m.parcelamento?.enabled === true;
    case "cartao": return m.cartao?.enabled === true;
    case "descontoPix": return m.descontoPix?.enabled === true;
  }
}

/** Liga ou desliga um módulo mantendo o resto da configuração dele (valor mínimo, percentual, parcelas). */
export function withModule(m: Modules, key: ModuleKey, on: boolean): Modules {
  switch (key) {
    case "orcamento": return { ...m, orcamento: { enabled: on } };
    case "retiradaLocal": return { ...m, retiradaLocal: on };
    case "boleto": return { ...m, boleto: on };
    case "cupom": return { ...m, cupom: on };
    case "freteGratis": return { ...m, freteGratis: { minValue: 0, ...m.freteGratis, enabled: on } };
    case "parcelamento": return { ...m, parcelamento: { maxInstallments: 1, ...m.parcelamento, enabled: on } };
    case "cartao": return { ...m, cartao: { enabled: on } };
    case "descontoPix": return { ...m, descontoPix: { percent: 0, ...m.descontoPix, enabled: on } };
  }
}

/** Valida a configuração com a MESMA regra do build (validatePreset): é o que impede, por exemplo, venda e orçamento juntos. */
export function validateConfig(preset: Preset, config: StoreConfig): string[] {
  return validatePreset({ ...preset, config });
}

export type ToggleResult =
  | { ok: true; modules: Modules; notes: string[] }
  | { ok: false; modules: Modules; error: string; problems: string[] };

/**
 * Liga ou desliga um módulo.
 * - Ao ligar, liga também o que ele precisa (dependência) e avisa; ao desligar, desliga o que depende dele e avisa.
 * - Venda e orçamento juntos: bloqueia com a mensagem da regra do build (quoteSalesConflict).
 * - Qualquer outro problema que a validação do build apontaria no resultado (ex.: tirar o modo orçamento de uma loja sem as políticas
 *   de venda) também bloqueia, com as mensagens do build.
 */
export function toggleModule(preset: Preset, config: StoreConfig, key: ModuleKey, on: boolean): ToggleResult {
  const before = config.modules;
  if (isModuleOn(before, key) === on) return { ok: true, modules: before, notes: [] };
  let modules = withModule(before, key, on);
  const notes: string[] = [];
  if (on) {
    for (const dep of MODULE_DEPENDS_ON[key] ?? []) {
      if (!isModuleOn(modules, dep)) {
        modules = withModule(modules, dep, true);
        notes.push(`${moduleLabel(dep)} foi ligado junto: ${moduleLabel(key)} depende dele.`);
      }
    }
  } else {
    for (const dep of dependentsOf(key)) {
      if (isModuleOn(modules, dep)) {
        modules = withModule(modules, dep, false);
        notes.push(`${moduleLabel(dep)} foi desligado junto: depende de ${moduleLabel(key)}.`);
      }
    }
  }
  const conflict = quoteSalesConflict(modules);
  if (conflict) {
    const sales = salesModulesOn(modules).map(moduleLabel);
    const error =
      key === "orcamento"
        ? `O modo orçamento não pode ficar ligado junto com módulos de venda. Desligue antes: ${sales.join(", ")}.`
        : `Não dá para ligar ${moduleLabel(key)}: a loja está em modo orçamento, que não pode ter módulos de venda ligados. Desligue o modo orçamento primeiro.`;
    return { ok: false, modules: before, error, problems: [conflict] };
  }
  const problems = validateConfig(preset, { ...config, modules });
  if (problems.length > 0) {
    return {
      ok: false,
      modules: before,
      error: `A loja não passaria na validação do build com ${moduleLabel(key)} ${on ? "ligado" : "desligado"}: ${problems[0]}`,
      problems,
    };
  }
  return { ok: true, modules, notes };
}
