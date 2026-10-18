import { describe, expect, it } from "vitest";
import type { StoreConfig, Testimonial } from "@/domain/types";
import { getPreset } from "@/presets";
import { assertValidPreset, quoteSalesConflict, salesModulesOn, validatePreset } from "@/presets/validate";
import { EXTRA_DEPENDS_ON, EXTRA_MODULES, TESTIMONIALS_MAX, TESTIMONIALS_MIN, extraModuleProblems, testimonialProblems } from "./extras";
import { toggleModule, validateConfig } from "./modules";

const arca = getPreset("arca-inflaveis")!;
const trama = getPreset("trama-studio")!;
// A Trama traz os textos dos módulos e os deixa desligados; estes testes ligam os quatro para validar dependência, textos e depoimentos.
const ligado = { ...trama, config: { ...trama.config, modules: { ...trama.config.modules, bot: true, whatsapp: true, depoimentos: true, newsletter: true } } };
const withModules = (cfg: StoreConfig, m: Partial<StoreConfig["modules"]>): StoreConfig => ({ ...cfg, modules: { ...cfg.modules, ...m } });
const problems = (cfg: StoreConfig) => extraModuleProblems(cfg).join("\n");

describe("módulos do diferencial: dependência", () => {
  it("o bot depende do WhatsApp: ligar o bot sem o whatsapp derruba o build, dizendo o módulo", () => {
    expect(EXTRA_DEPENDS_ON.bot).toEqual(["whatsapp"]);
    const semWhats = withModules(ligado.config, { whatsapp: false });
    expect(problems(semWhats)).toContain("config.modules.bot: o módulo bot depende do módulo whatsapp: ligue os dois");
    expect(() => assertValidPreset({ ...ligado, config: semWhats })).toThrow(/depende do módulo whatsapp/);
    // desligar os dois (ou só o whatsapp, com o bot também desligado) é válido
    expect(problems(withModules(ligado.config, { bot: false, whatsapp: false }))).toBe("");
    expect(problems(withModules(ligado.config, { bot: false }))).toBe("");
  });

  it("cada módulo ligado exige os seus textos e dados no preset", () => {
    expect(problems({ ...ligado.config, bot: undefined })).toContain("config.bot");
    expect(problems({ ...ligado.config, whatsapp: undefined })).toContain("config.whatsapp");
    expect(problems({ ...ligado.config, newsletter: undefined })).toContain("config.newsletter");
    expect(problems({ ...ligado.config, homeBlocks: ligado.config.homeBlocks.filter((b) => b.type !== "testimonials") })).toContain("bloco testimonials");
    expect(problems(trama.config)).toBe(""); // com os módulos desligados (padrão) nada é exigido
    expect(problems({ ...trama.config, bot: undefined, whatsapp: undefined, newsletter: undefined })).toBe(""); // e sem os dados também não
  });

  it("número de WhatsApp fictício precisa da marca de demonstração, e a mensagem do produto precisa de {produto}", () => {
    const w = ligado.config.whatsapp!;
    expect(problems({ ...ligado.config, whatsapp: { ...w, number: "123" } })).toContain("config.whatsapp");
    expect(problems({ ...ligado.config, whatsapp: { ...w, badge: "Oficial" } })).toContain("número fictício precisa da marca de demonstração");
    expect(problems({ ...ligado.config, whatsapp: { ...w, productMessage: "Olá!" } })).toContain("{produto}");
  });
});

describe("módulos do diferencial: exclusão (não são módulos de venda)", () => {
  it("nenhum módulo novo conta como módulo de venda: podem ficar ligados junto com o modo orçamento", () => {
    expect(salesModulesOn({ bot: true, whatsapp: true, depoimentos: true, newsletter: true })).toEqual([]);
    const m = { ...arca.config.modules, bot: true, whatsapp: true, depoimentos: true, newsletter: true };
    expect(quoteSalesConflict(m)).toBeNull();
    expect(EXTRA_MODULES).toEqual(["bot", "whatsapp", "depoimentos", "newsletter"]);
  });

  it("a regra venda × orçamento continua valendo do mesmo jeito, com ou sem os módulos novos", () => {
    const venda = { ...ligado.config.modules, orcamento: { enabled: true } };
    expect(quoteSalesConflict(venda)).toContain("não pode ter módulos de venda ligados; desligue:");
    expect(quoteSalesConflict(venda)).not.toMatch(/bot|whatsapp|depoimentos|newsletter/);
    expect(toggleModule(arca, arca.config, "cupom", true).ok).toBe(false);
  });

  it("a validação do painel (F5) segue sem problemas no preset com os módulos novos ligados", () => {
    expect(validateConfig(ligado, ligado.config)).toEqual([]);
    expect(validatePreset(ligado)).toEqual([]);
  });
});

describe("depoimentos: autorização e quantidade", () => {
  const t = (id: string, extra: Partial<Testimonial> = {}): Testimonial => ({ id, name: "Nome", city: "Cidade/UF", text: "Texto do depoimento.", ...extra });
  const lista = (n: number) => Array.from({ length: n }, (_, i) => t(`d${i}`));

  it("depoimento de cliente real sem autorizado: true não publica; com autorização, publica", () => {
    expect(testimonialProblems([...lista(2), t("r", { real: true })])).toEqual(["r: depoimento de cliente real só publica com autorizado: true"]);
    expect(testimonialProblems([...lista(2), t("r", { real: true, autorizado: false })])).toHaveLength(1);
    expect(testimonialProblems([...lista(2), t("r", { real: true, autorizado: true })])).toEqual([]);
  });

  it("fictício (sem real) não precisa de autorização", () => {
    expect(testimonialProblems(lista(3))).toEqual([]);
  });

  it("de 3 a 6 depoimentos, com nome, cidade e texto", () => {
    expect([TESTIMONIALS_MIN, TESTIMONIALS_MAX]).toEqual([3, 6]);
    expect(testimonialProblems(lista(2))[0]).toContain("de 3 a 6 depoimentos; recebido: 2");
    expect(testimonialProblems(lista(7))[0]).toContain("recebido: 7");
    expect(testimonialProblems(lista(6))).toEqual([]);
    expect(testimonialProblems([...lista(2), t("x", { city: "" })])).toEqual(["x: informe nome, cidade e texto"]);
    expect(testimonialProblems([t("a"), t("a"), t("b")])).toEqual(["a: id repetido"]);
  });

  it("o build derruba preset com depoimento real não autorizado, apontando o bloco", () => {
    const block = ligado.config.homeBlocks.find((b) => b.type === "testimonials")!;
    if (block.type !== "testimonials") throw new Error("sem bloco");
    const cfg = { ...ligado.config, homeBlocks: ligado.config.homeBlocks.map((b) => (b === block ? { ...block, items: [...block.items.slice(0, 3), t("cliente", { real: true })] } : b)) };
    expect(() => assertValidPreset({ ...ligado, config: cfg })).toThrow(/config\.homeBlocks\.depoimentos\.items: cliente: depoimento de cliente real só publica com autorizado: true/);
  });
});
