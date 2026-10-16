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
  const quoteMode = preset.config.modules.orcamento?.enabled === true;

  // H1 · identificação da loja (rodapé)
  need(filled(legal?.name), "config.legal.name", "informe o nome ou a razão social");
  need(filled(legal?.document) && /\d/.test(legal.document), "config.legal.document", "informe o CNPJ ou CPF");
  need(filled(legal?.address), "config.legal.address", "informe o endereço");
  need(filled(legal?.email) && /^\S+@\S+\.\S+$/.test(legal.email), "config.legal.email", "informe um e-mail válido");
  need(filled(legal?.phone) && /\d/.test(legal.phone), "config.legal.phone", "informe o telefone");

  if (quoteMode) {
    // Modo orçamento: não há venda ao consumidor pela loja, então o arrependimento (CDC, art. 49) não se aplica,
    // mas a loja não pode ter nenhum módulo de venda e precisa dos dados do orçamento e das condições comerciais.
    const m = preset.config.modules;
    const sales = [
      m.retiradaLocal && "retiradaLocal",
      m.freteGratis?.enabled && "freteGratis",
      m.parcelamento?.enabled && "parcelamento",
      m.boleto && "boleto",
      m.cartao?.enabled && "cartao",
      m.descontoPix?.enabled && "descontoPix",
      m.cupom && "cupom",
    ].filter(Boolean);
    need(
      sales.length === 0,
      "config.modules",
      `loja em orçamento (orcamento.enabled) não pode ter módulos de venda ligados; desligue: ${sales.join(", ")}`,
    );
    const quote = preset.config.quote;
    need(!!quote && filled(quote.listLabel) && filled(quote.addLabel) && filled(quote.intro), "config.quote", "informe listLabel, addLabel e intro do modo orçamento");
    need(!!quote && filledList(quote.applications), "config.quote.applications", "liste as aplicações do formulário");
    need(
      !!quote && filled(quote.whatsapp?.number) && /\d{10,}/.test(quote.whatsapp.number) && typeof quote.whatsapp.isReal === "boolean",
      "config.quote.whatsapp",
      "informe number (só dígitos, com DDI e DDD) e isReal",
    );
    need(filled(policies?.commercial?.production) && filled(policies?.commercial?.freight), "config.policies.commercial", "informe prazo de produção e frete das condições comerciais");
  } else {
    need(
      Number.isInteger(policies?.regretDays) && (policies.regretDays as number) >= MIN_REGRET_DAYS,
      "config.policies.regretDays",
      `o direito de arrependimento não pode ser menor que ${MIN_REGRET_DAYS} dias (CDC, art. 49); recebido: ${policies?.regretDays}`,
    );
    need(filled(policies?.regret), "config.policies.regret", "informe o aviso curto de arrependimento");
    need(filled(policies?.regretConditions), "config.policies.regretConditions", "informe as condições de devolução no arrependimento");
  }
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

  // Blocos de segmento (necessidades, setores, números, cases, processo): referências íntegras e dados de demonstração marcados.
  const cfg = preset.config;
  const productIds = new Set(preset.products.map((x) => x.id));
  const sectorSlugs = new Set((cfg.sectors ?? []).map((x) => x.slug));
  const caseIds = new Set((cfg.cases ?? []).map((x) => x.id));
  const unknown = (ids: string[] | undefined, set: Set<string>) => (ids ?? []).filter((id) => !set.has(id));
  for (const b of cfg.homeBlocks) {
    if (b.type === "needs") need((cfg.needs?.length ?? 0) > 0, `config.homeBlocks.${b.id}`, "o bloco precisa de config.needs");
    if (b.type === "sectors") need(sectorSlugs.size > 0, `config.homeBlocks.${b.id}`, "o bloco precisa de config.sectors");
    if (b.type === "cases") {
      need(b.caseIds.length > 0 && unknown(b.caseIds, caseIds).length === 0, `config.homeBlocks.${b.id}.caseIds`, "informe projetos existentes em config.cases");
      need(filled(b.note), `config.homeBlocks.${b.id}.note`, "marque os projetos como demonstração");
    }
    if (b.type === "stats") {
      need(b.items.length >= 3 && b.items.length <= 4 && b.items.every((i) => filled(i.value) && filled(i.label)), `config.homeBlocks.${b.id}.items`, "informe 3 ou 4 indicadores");
      need(filled(b.note), `config.homeBlocks.${b.id}.note`, "marque os números como fictícios");
    }
    if (b.type === "process") {
      const stepOk = !b.highlight || (b.highlight.step >= 1 && b.highlight.step <= b.steps.length);
      need(b.steps.length >= 2 && stepOk, `config.homeBlocks.${b.id}`, "informe 2 ou mais passos e um destaque que aponte para um deles");
    }
  }
  for (const n of cfg.needs ?? []) need(n.productIds.length > 0 && unknown(n.productIds, productIds).length === 0, `config.needs.${n.slug}.productIds`, "informe produtos existentes");
  for (const x of cfg.sectors ?? []) {
    need(x.productIds.length > 0 && unknown(x.productIds, productIds).length === 0, `config.sectors.${x.slug}.productIds`, "informe produtos existentes");
    need(!x.caseId || caseIds.has(x.caseId), `config.sectors.${x.slug}.caseId`, "projeto inexistente");
  }
  for (const c of cfg.cases ?? []) {
    need(productIds.has(c.productId), `config.cases.${c.id}.productId`, "produto inexistente");
    need(!c.sectorSlug || sectorSlugs.has(c.sectorSlug), `config.cases.${c.id}.sectorSlug`, "setor inexistente");
  }
  for (const x of preset.products) {
    need(unknown(x.sectorSlugs, sectorSlugs).length === 0, `products.${x.id}.sectorSlugs`, "setor inexistente");
    need((x.benefits?.length ?? 0) <= 3, `products.${x.id}.benefits`, "no máximo 3 benefícios");
  }

  // Ferramentas do orçamento (configurador de pórtico e dimensionador): só em loja em orçamento, com produtos e valores válidos.
  const ob = cfg.orcamentoBlocks;
  if (ob) {
    need(!ob.ativos || quoteMode, "config.orcamentoBlocks", "as ferramentas do orçamento só existem em loja em orçamento (modules.orcamento)");
    const pc = ob.porticoConfigurador;
    if (pc) {
      need(productIds.has(pc.alvoProduto), "config.orcamentoBlocks.porticoConfigurador.alvoProduto", "produto inexistente");
      need(Number.isInteger(pc.textoMax) && pc.textoMax >= 1 && pc.textoMax <= 100, "config.orcamentoBlocks.porticoConfigurador.textoMax", "informe um limite inteiro de 1 a 100");
      need(filled(pc.medidas) && filled(pc.textoExemplo), "config.orcamentoBlocks.porticoConfigurador", "informe medidas e textoExemplo");
      need(pc.textoExemplo.length <= pc.textoMax, "config.orcamentoBlocks.porticoConfigurador.textoExemplo", "o texto de exemplo não pode passar de textoMax");
      const ids = pc.paleta.map((c) => c.id);
      need(
        pc.paleta.length >= 2 && new Set(ids).size === ids.length && pc.paleta.every((c) => filled(c.id) && filled(c.nome) && /^#[0-9a-fA-F]{6}$/.test(c.valor)),
        "config.orcamentoBlocks.porticoConfigurador.paleta",
        "informe 2 ou mais cores com id único, nome e valor #rrggbb",
      );
    }
    const d = ob.dimensionador;
    if (d) {
      for (const tipo of ["fechado", "aberto"] as const) {
        const linha = d[tipo];
        need(productIds.has(linha.produto), `config.orcamentoBlocks.dimensionador.${tipo}.produto`, "produto inexistente");
        const caps = linha.capacidades;
        need(
          caps.length > 0 && caps.every((c, i) => Number.isInteger(c) && c > 0 && (i === 0 || c > caps[i - 1])),
          `config.orcamentoBlocks.dimensionador.${tipo}.capacidades`,
          "informe litros inteiros, positivos e em ordem crescente",
        );
      }
      need(
        Number.isInteger(d.diasMin) && Number.isInteger(d.diasMax) && d.diasMin >= 1 && d.diasMax > d.diasMin,
        "config.orcamentoBlocks.dimensionador.dias",
        "diasMin e diasMax inteiros, com diasMin >= 1 e diasMax maior",
      );
      need(filled(d.unidadeConsumo), "config.orcamentoBlocks.dimensionador.unidadeConsumo", "informe a unidade (ex.: L/dia)");
    }
  }

  return problems;
}

export function assertValidPreset(preset: Preset): void {
  const problems = validatePreset(preset);
  if (problems.length > 0) {
    throw new Error(`Preset "${preset.id}" inválido:\n- ${problems.join("\n- ")}`);
  }
}
