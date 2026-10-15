import { describe, expect, it } from "vitest";
import type { HomeBlock, Product } from "@/domain/types";
import { announcementMessage } from "./announcement";
import {
  applyFilters,
  buildFilterGroups,
  parseFilters,
  serializeFilters,
  sortProducts,
} from "./filters";
import { activeHomeBlocks } from "./home-blocks";
import { installmentPlan } from "./installments";
import { formatBRLCompact } from "./money";
import { searchProducts, normalizeText } from "./search";
import { maskCep, normalizeCep, quoteShipping, type ShippingInput } from "./shipping";
import { isOptionAvailable, selectedVariant, variantAxes } from "./variants";
import { getPreset } from "@/presets";

const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;
/** Intl usa espaço sem quebra entre "R$" e o valor; nos testes comparamos com espaço comum. */
const plain = (text: string | null) => text?.replaceAll(" ", " ") ?? null;
const find = (preset: typeof trama, name: string) => preset.products.find((p) => p.name === name)!;

describe("parcelamento", () => {
  const mod = { enabled: true, maxInstallments: 6, minInstallment: 2000 };

  it("n = min(máximo, floor(preço / parcela mínima))", () => {
    expect(installmentPlan(38990, mod)).toEqual({ count: 6, value: 6498 }); // 19 → limitado a 6
    expect(installmentPlan(11990, mod)).toEqual({ count: 5, value: 2398 }); // floor(5,99) = 5
    expect(installmentPlan(6000, mod)).toEqual({ count: 3, value: 2000 });
  });

  it("limites da parcela mínima: exatamente 2x vale; abaixo disso esconde a linha", () => {
    expect(installmentPlan(4000, mod)).toEqual({ count: 2, value: 2000 });
    expect(installmentPlan(3999, mod)).toBeNull(); // floor(1,99) = 1
    expect(installmentPlan(2000, mod)).toBeNull();
    expect(installmentPlan(1990, mod)).toBeNull();
  });

  it("módulo desligado ou ausente não mostra a linha; mínimo padrão é R$ 20", () => {
    expect(installmentPlan(38990, { enabled: false, maxInstallments: 6 })).toBeNull();
    expect(installmentPlan(38990, undefined)).toBeNull();
    expect(installmentPlan(4000, { enabled: true, maxInstallments: 6 })).toEqual({ count: 2, value: 2000 });
  });

  it("arredonda o valor da parcela ao centavo", () => {
    expect(installmentPlan(10001, { enabled: true, maxInstallments: 3, minInstallment: 2000 })).toEqual({
      count: 3,
      value: 3334,
    });
  });
});

describe("frete simulado", () => {
  const base = (over: Partial<ShippingInput> = {}): ShippingInput => ({
    cep: "01310-100",
    itemPrice: 10000,
    shipping: trama.config.shipping,
    modules: trama.config.modules,
    storeAddress: trama.config.legal.address,
    ...over,
  });
  const ok = (input: ShippingInput) => {
    const q = quoteShipping(input);
    if (q.status !== "ok") throw new Error("esperava ok");
    return q;
  };

  it("CEP inválido: sem opções", () => {
    for (const cep of ["", "1234", "abcde-fgh", "0131010", "013101000", "01310 100"]) {
      expect(quoteShipping(base({ cep }))).toEqual({ status: "invalid" });
    }
  });

  it("aceita CEP com e sem máscara", () => {
    expect(normalizeCep("01310100")).toBe("01310100");
    expect(normalizeCep(" 01310-100 ")).toBe("01310100");
    expect(maskCep("01310100")).toBe("01310-100");
    expect(maskCep("0131")).toBe("0131");
  });

  it("região 0–3: fator 1,0 e prazo +0", () => {
    const q = ok(base({ cep: "30130-010" }));
    expect(q.options.map((o) => [o.label, o.price, o.deadline])).toEqual([
      ["Econômico", 1490, "5 a 8 dias úteis"],
      ["Expresso", 2490, "2 a 3 dias úteis"],
    ]);
  });

  it("região 4–6: fator 1,3 e prazo +2", () => {
    const q = ok(base({ cep: "40000-000" }));
    expect(q.options.map((o) => [o.price, o.deadline])).toEqual([
      [1937, "7 a 10 dias úteis"], // round(1490 × 1,3)
      [3237, "4 a 5 dias úteis"], // round(2490 × 1,3)
    ]);
  });

  it("região 7–9: fator 1,6 e prazo +4", () => {
    const q = ok(base({ cep: "90000-000" }));
    expect(q.options.map((o) => [o.price, o.deadline])).toEqual([
      [2384, "9 a 12 dias úteis"],
      [3984, "6 a 7 dias úteis"],
    ]);
  });

  it("é determinístico", () => {
    expect(quoteShipping(base({ cep: "40000-000" }))).toEqual(quoteShipping(base({ cep: "40000000" })));
  });

  it("frete grátis: Econômico vira Grátis a partir do mínimo; abaixo, informa quanto falta", () => {
    const above = ok(base({ itemPrice: 19900 }));
    expect(above.options[0]).toMatchObject({ label: "Econômico", price: 0, free: true });
    expect(above.options[1]).toMatchObject({ label: "Expresso", free: false });
    expect(above.missingForFree).toBeNull();

    const below = ok(base({ itemPrice: 19899 }));
    expect(below.options[0].free).toBe(false);
    expect(below.missingForFree).toBe(1);

    expect(ok(base({ itemPrice: 9900 })).missingForFree).toBe(10000);
  });

  it("frete grátis desligado: nunca grátis e sem linha 'faltam'", () => {
    const modules = { ...trama.config.modules, freteGratis: { enabled: false, minValue: 19900 } };
    const q = ok(base({ modules, itemPrice: 99900 }));
    expect(q.options.every((o) => !o.free)).toBe(true);
    expect(q.missingForFree).toBeNull();
  });

  describe("Forno da Vila (cobertura por prefixo, retirada)", () => {
    const f = (over: Partial<ShippingInput> = {}) =>
      base({
        shipping: forno.config.shipping,
        modules: forno.config.modules,
        storeAddress: forno.config.legal.address,
        ...over,
      });

    it("CEP coberto: Econômico 1–2 dias, Expresso hoje, e retirada com endereço", () => {
      const q = ok(f({ cep: "01310-100", itemPrice: 4290 }));
      expect(q.covered).toBe(true);
      expect(q.options.map((o) => [o.label, o.price, o.deadline])).toEqual([
        ["Econômico", 990, "1 a 2 dias úteis"],
        ["Expresso", 1690, "hoje"],
      ]);
      expect(q.pickup).toEqual({ address: forno.config.legal.address });
      expect(q.missingForFree).toBe(8000 - 4290);
    });

    it("fora da cobertura: sem opções de entrega, só retirada", () => {
      const q = ok(f({ cep: "80010-000" }));
      expect(q.covered).toBe(false);
      expect(q.options).toEqual([]);
      expect(q.pickup).not.toBeNull();
      expect(q.missingForFree).toBeNull();
    });

    it("frete grátis a partir de R$ 80", () => {
      const q = ok(f({ cep: "01310-100", itemPrice: 8000 }));
      expect(q.options[0]).toMatchObject({ label: "Econômico", free: true, price: 0 });
    });
  });

  it("sem retirada ligada, não oferece retirada", () => {
    expect(ok(base()).pickup).toBeNull();
  });
});

describe("busca", () => {
  it("normaliza acentos, maiúsculas e espaços", () => {
    expect(normalizeText("  PÃO   de Mel ")).toBe("pao de mel");
    expect(normalizeText("Açaí")).toBe("acai");
  });

  it('"pao" e "PÃO" encontram "Pão de Queijo"', () => {
    for (const term of ["pao", "PÃO", "Pão", "pAo"]) {
      expect(searchProducts(forno.products, term).map((p) => p.name)).toContain("Pão de Queijo (12 unidades)");
    }
  });

  it("busca em nome, descrição e SKU do produto", () => {
    expect(searchProducts(trama.products, "FV-").length).toBe(0);
    expect(searchProducts(trama.products, "ts-vml").map((p) => p.name)).toEqual(["Vestido Midi Linho"]);
    expect(searchProducts(trama.products, "fenda lateral").map((p) => p.name)).toEqual(["Vestido Midi Linho"]);
  });

  it("busca por SKU de variante", () => {
    const hit = searchProducts(trama.products, "TS-CBP-M-PT");
    expect(hit.map((p) => p.name)).toEqual(["Camiseta Básica Pima"]);
    expect(searchProducts(forno.products, "fv-mar-med").map((p) => p.name)).toEqual(["Pizza Margherita"]);
  });

  it("termo vazio ou sem correspondência não retorna nada", () => {
    expect(searchProducts(trama.products, "   ")).toEqual([]);
    expect(searchProducts(trama.products, "xyzinexistente")).toEqual([]);
  });

  it("várias palavras: todas precisam aparecer", () => {
    expect(searchProducts(trama.products, "vestido linho").length).toBe(1);
    expect(searchProducts(trama.products, "vestido couro")).toEqual([]);
  });
});

describe("filtros dinâmicos", () => {
  const feminino = trama.products.filter((p) => p.categoryId === "feminino");
  const groups = buildFilterGroups(feminino, trama.config.attributeDefs);

  it("só atributos filterable, só valores que existem na categoria", () => {
    expect(groups.map((g) => g.key)).toEqual(["tamanho", "cor"]);
    expect(groups[0].values).toEqual(["P", "M", "G"]);
    expect(groups[1].values).toEqual(["Off-white", "Areia", "Preto", "Marinho", "Verde oliva"]);
    // material existe nos produtos mas não é filterable
    expect(groups.some((g) => g.key === "material")).toBe(false);
  });

  it("não gera grupo quando nenhum produto tem o atributo", () => {
    const acessorios = trama.products.filter((p) => p.categoryId === "acessorios");
    const g = buildFilterGroups(acessorios, trama.config.attributeDefs);
    expect(g.map((x) => x.key)).toEqual(["cor"]);
  });

  it("Forno: filtro vem do atributo 'dieta' (filterable) e não de sabor/porção", () => {
    const g = buildFilterGroups(forno.products, forno.config.attributeDefs);
    expect(g.map((x) => x.key)).toEqual(["dieta"]);
    expect(g[0].values.sort()).toEqual(["Vegano", "Vegetariano"]);
  });

  it("mesmo atributo soma (OU); atributos diferentes restringem (E)", () => {
    const names = (sel: Record<string, string[]>) => applyFilters(feminino, sel).map((p) => p.id);
    const ouTamanho = names({ tamanho: ["P", "G"] });
    expect(ouTamanho).toEqual(expect.arrayContaining(["ts-001", "ts-002", "ts-003"]));
    // OU dentro de cor
    const ouCor = names({ cor: ["Areia", "Marinho"] });
    expect(ouCor).toEqual(expect.arrayContaining(["ts-001", "ts-003", "ts-004", "ts-006"]));
    // E entre atributos: cor Preto E tamanho M → só quem tem as duas coisas
    const e = names({ tamanho: ["M"], cor: ["Preto"] });
    expect(e.sort()).toEqual(["ts-002", "ts-003"]);
    // sem seleção devolve tudo
    expect(names({})).toHaveLength(feminino.length);
    expect(names({ tamanho: [] })).toHaveLength(feminino.length);
  });

  it("serializa e lê a URL (ida e volta)", () => {
    const params = serializeFilters({ tamanho: ["M", "G"], cor: ["Preto"] }, "menor-preco", groups);
    expect(params.toString()).toBe("tamanho=M%2CG&cor=Preto&ordem=menor-preco");
    const back = parseFilters(new URLSearchParams(params.toString()), groups);
    expect(back).toEqual({ selection: { tamanho: ["M", "G"], cor: ["Preto"] }, order: "menor-preco" });
  });

  it("leitura ignora maiúsculas/acentos, valores e chaves desconhecidos e ordem inválida", () => {
    const parsed = parseFilters(new URLSearchParams("tamanho=m,xxl&cor=OFF-WHITE&marca=x&ordem=aleatoria"), groups);
    expect(parsed).toEqual({ selection: { tamanho: ["M"], cor: ["Off-white"] }, order: "relevantes" });
  });

  it("ordem padrão não vai para a URL", () => {
    expect(serializeFilters({}, "relevantes", groups).toString()).toBe("");
  });

  it("ordena por preço sem alterar a lista original", () => {
    const original = feminino.map((p) => p.id);
    const asc = sortProducts(feminino, "menor-preco").map((p) => p.price);
    const desc = sortProducts(feminino, "maior-preco").map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(sortProducts(feminino, "relevantes").map((p) => p.id)).toEqual(original);
    expect(feminino.map((p) => p.id)).toEqual(original);
  });
});

describe("homeBlocks", () => {
  const blocks: HomeBlock[] = [
    { id: "a", type: "featured", enabled: true, title: "A", linkLabel: "x", linkHref: "/", productIds: [] },
    { id: "b", type: "categories", enabled: false, categoryIds: [] },
    {
      id: "c",
      type: "banner",
      enabled: true,
      image: { src: "/x", alt: "x" },
      title: "C",
      ctaLabel: "x",
      ctaHref: "/",
    },
  ];

  it("respeita a ordem do array e o enabled", () => {
    expect(activeHomeBlocks(blocks).map((b) => b.id)).toEqual(["a", "c"]);
    expect(activeHomeBlocks([...blocks].reverse()).map((b) => b.id)).toEqual(["c", "a"]);
  });

  it("presets reais: blocos na ordem do preset", () => {
    expect(activeHomeBlocks(trama.config.homeBlocks).map((b) => b.type)).toEqual([
      "banner",
      "categories",
      "featured",
      "shippingProgress",
    ]);
    expect(activeHomeBlocks(forno.config.homeBlocks).map((b) => b.type)).toEqual([
      "banner",
      "chips",
      "spotlight",
      "featured",
      "shippingProgress",
    ]);
  });
});

describe("faixa de aviso", () => {
  it("gerada pelos módulos", () => {
    expect(plain(announcementMessage(trama.config.modules))).toBe("Frete grátis acima de R$ 199");
    expect(plain(announcementMessage(forno.config.modules, forno.config.pickup?.leadTime))).toBe("Frete grátis acima de R$ 80 · Retire na loja em 20 min");
    expect(announcementMessage({})).toBeNull();
    expect(announcementMessage({ freteGratis: { enabled: false, minValue: 100 } })).toBeNull();
    expect(announcementMessage({ retiradaLocal: true })).toBe("Retire na loja");
  });

  it("valor compacto só tira ,00", () => {
    expect(formatBRLCompact(19900)).toMatch(/^R\$\s199$/);
    expect(formatBRLCompact(19950)).toMatch(/199,50/);
  });
});

describe("variações", () => {
  const vestido: Product = find(trama, "Vestido Midi Linho");

  it("eixos na ordem das definições (tamanho antes de cor)", () => {
    const axes = variantAxes(vestido, trama.config.attributeDefs);
    expect(axes.map((a) => a.key)).toEqual(["tamanho", "cor"]);
    expect(axes[1].values).toEqual(["Off-white", "Areia"]);
  });

  it("combinação sem estoque fica indisponível (G + Areia tem estoque 0)", () => {
    expect(isOptionAvailable(vestido, { tamanho: "G" }, "cor", "Areia")).toBe(false);
    expect(isOptionAvailable(vestido, { tamanho: "G" }, "cor", "Off-white")).toBe(true);
    expect(isOptionAvailable(vestido, { cor: "Areia" }, "tamanho", "G")).toBe(false);
    expect(isOptionAvailable(vestido, {}, "tamanho", "G")).toBe(true);
  });

  it("variante só é resolvida com todos os eixos escolhidos", () => {
    const axes = variantAxes(vestido, trama.config.attributeDefs);
    expect(selectedVariant(vestido, axes, { tamanho: "M" })).toBeUndefined();
    expect(selectedVariant(vestido, axes, { tamanho: "M", cor: "Areia" })?.sku).toBe("TS-VML-M-AR");
  });

  it("Forno: porção define preço da variante", () => {
    const pizza = find(forno, "Pizza Margherita");
    const axes = variantAxes(pizza, forno.config.attributeDefs);
    expect(axes.map((a) => a.key)).toEqual(["porcao"]);
    expect(selectedVariant(pizza, axes, { porcao: "Média (6 fatias)" })?.price).toBe(5490);
  });
});
