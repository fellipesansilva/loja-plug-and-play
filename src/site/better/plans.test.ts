import { describe, expect, it } from "vitest";
import { formatBRLCompact } from "@/lib/money";
import { addons, CONTRACT_MONTHS, INCLUDED_PRODUCTS, money, plans, PRICES } from "./plans";

const nbsp = (s: string) => s.replace(/ /g, " ");

describe("planos da Better Studio (valores em centavos)", () => {
  it("os valores são inteiros em centavos, como na referência", () => {
    expect(PRICES).toEqual({
      prontaFrom: 179000,
      prontaHostingPerYear: 39000,
      extraProduct: 400,
      completaSetup: 89000,
      completaMonthly: 14900,
      botSetup: 69000,
      botMonthly: 7900,
      customFrom: 49000,
    });
    for (const v of Object.values(PRICES)) expect(Number.isInteger(v)).toBe(true);
  });

  it("a formatação vem de src/lib/money.ts, em reais inteiros", () => {
    expect(money(PRICES.prontaFrom)).toBe(formatBRLCompact(179000));
    expect(nbsp(money(PRICES.prontaFrom))).toBe("R$ 1.790");
    expect(nbsp(money(PRICES.completaMonthly))).toBe("R$ 149");
    expect(nbsp(money(PRICES.completaSetup))).toBe("R$ 890");
    expect(nbsp(money(PRICES.extraProduct))).toBe("R$ 4");
  });

  it("Loja Pronta: a partir de R$ 1.790, hospedagem de R$ 390/ano e R$ 4 por produto adicional", () => {
    const p = plans.find((x) => x.id === "pronta")!;
    expect(p.name).toBe("Loja Pronta");
    expect(nbsp(p.priceLabel)).toBe("a partir de");
    expect(p.price).toBe(179000);
    expect(p.priceSuffix).toBe("");
    expect(nbsp(p.note)).toBe("+ hospedagem e domínio por R$ 390/ano");
    expect(p.features.map(nbsp)).toContain(`Até ${INCLUDED_PRODUCTS} produtos cadastrados (R$ 4 por produto adicional)`);
    expect(p.features).toHaveLength(6);
    expect(p.badge).toBeUndefined();
    expect(p.cta).toBe("Quero a Loja Pronta");
  });

  it("Loja Completa: setup de R$ 890 + R$ 149/mês, contrato de 12 meses e o selo Recomendado", () => {
    const p = plans.find((x) => x.id === "completa")!;
    expect(nbsp(p.priceLabel)).toBe("setup de R$ 890 +");
    expect(p.price).toBe(14900);
    expect(p.priceSuffix).toBe("/mês");
    expect(p.note).toBe(`hospedagem e domínio inclusos · contrato de ${CONTRACT_MONTHS} meses`);
    expect(CONTRACT_MONTHS).toBe(12);
    expect(p.badge).toBe("Recomendado");
    expect(p.features[0]).toBe("Tudo da Loja Pronta");
    expect(p.cta).toBe("Quero a Loja Completa");
  });

  it("os extras: bot R$ 690 + R$ 79/mês, WhatsApp incluso e personalização a partir de R$ 490", () => {
    expect(addons.map((a) => [a.name, nbsp(a.detail)])).toEqual([
      ["Assistente virtual (bot)", "R$ 690 de setup + R$ 79/mês"],
      ["Botão de WhatsApp", "Incluso nos dois planos"],
      ["Personalização sob medida", "A partir de R$ 490"],
    ]);
  });
});
