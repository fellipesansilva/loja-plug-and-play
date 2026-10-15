import { MIN_DEFECT_DAYS, MIN_REGRET_DAYS, type Preset } from "@/domain/types";

const filled = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;
const filledList = (v: unknown): boolean => Array.isArray(v) && v.length > 0 && v.every(filled);

/**
 * Valida o que a lei e a conformidade exigem de TODO preset. Devolve a lista de problemas (vazia se estiver tudo certo);
 * `assertValidPreset` transforma a lista em erro, e o registro de presets chama isso ao carregar: um preset incompleto
 * derruba o build (e o servidor) com uma mensagem que diz o preset e o campo.
 */
export function validatePreset(preset: Preset): string[] {
  const problems: string[] = [];
  const need = (ok: boolean, field: string, why: string) => {
    if (!ok) problems.push(`${field}: ${why}`);
  };
  const { legal, policies } = preset.config;

  // H1 · identificação da loja (rodapé)
  need(filled(legal?.name), "config.legal.name", "informe o nome ou a razão social");
  need(filled(legal?.document) && /\d/.test(legal.document), "config.legal.document", "informe o CNPJ ou CPF");
  need(filled(legal?.address), "config.legal.address", "informe o endereço");
  need(filled(legal?.email) && /^\S+@\S+\.\S+$/.test(legal.email), "config.legal.email", "informe um e-mail válido");
  need(filled(legal?.phone) && /\d/.test(legal.phone), "config.legal.phone", "informe o telefone");

  // H2 · arrependimento e troca
  need(
    Number.isInteger(policies?.regretDays) && policies.regretDays >= MIN_REGRET_DAYS,
    "config.policies.regretDays",
    `o direito de arrependimento não pode ser menor que ${MIN_REGRET_DAYS} dias (CDC, art. 49); recebido: ${policies?.regretDays}`,
  );
  need(filled(policies?.regret), "config.policies.regret", "informe o aviso curto de arrependimento");
  need(filled(policies?.regretConditions), "config.policies.regretConditions", "informe as condições de devolução no arrependimento");
  const durability = policies?.defect?.durability;
  need(
    durability === "durable" || durability === "nonDurable",
    "config.policies.defect.durability",
    'declare se os produtos são duráveis ("durable") ou não duráveis ("nonDurable")',
  );
  need(filled(policies?.defect?.conditions), "config.policies.defect.conditions", "informe as condições da troca por defeito");
  if (durability === "durable" || durability === "nonDurable") {
    const min = MIN_DEFECT_DAYS[durability];
    need(
      Number.isInteger(policies.defect.days) && policies.defect.days >= min,
      "config.policies.defect.days",
      `o prazo de troca por defeito não pode ser menor que ${min} dias para produto ${durability === "durable" ? "durável" : "não durável"} (CDC, art. 26); recebido: ${policies.defect.days}`,
    );
  }
  const hasDigital = preset.products.some((p) => p.type === "digital");
  need(!hasDigital || filled(policies?.digital), "config.policies.digital", "o preset tem produto digital: informe o texto sobre produto digital");

  // H4 · privacidade (as 6 seções)
  const privacy = policies?.privacy;
  need(filledList(privacy?.dataCollected), "config.policies.privacy.dataCollected", "liste os dados coletados");
  need(filled(privacy?.purpose), "config.policies.privacy.purpose", "informe a finalidade");
  need(filled(privacy?.retention), "config.policies.privacy.retention", "informe o prazo de guarda");
  need(filledList(privacy?.sharing), "config.policies.privacy.sharing", "liste com quem os dados são compartilhados");
  need(filledList(privacy?.rights), "config.policies.privacy.rights", "liste os direitos do titular");
  need(
    filled(privacy?.controller?.name) && filled(privacy?.controller?.email),
    "config.policies.privacy.controller",
    "informe nome e e-mail do responsável pelos dados",
  );

  // H5 · cookies
  need(filled(policies?.cookies?.notice) && filled(policies?.cookies?.version), "config.policies.cookies", "informe o texto e a versão do aviso de cookies");

  return problems;
}

export function assertValidPreset(preset: Preset): void {
  const problems = validatePreset(preset);
  if (problems.length > 0) {
    throw new Error(`Preset "${preset.id}" inválido:\n- ${problems.join("\n- ")}`);
  }
}
