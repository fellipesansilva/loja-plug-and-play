import { describe, expect, it } from "vitest";
import type { Coupon, Order, Product } from "@/domain/types";
import { cartIsAllDigital, physicalSubtotal, resolveLines, setLineQty, makeLineId, addLine } from "./cart";
import { buildOrder } from "./checkout";
import {
  firstInvalid,
  validateAddress,
  validateCard,
  validateIdentification,
  composeAddress,
} from "./checkout-validation";
import { applyCoupon } from "./coupon";
import {
  CARD_DECLINED_MESSAGE,
  TEST_CARD_NUMBER,
  addBusinessDays,
  boletoDueDate,
  cardBrand,
  fakePixCode,
  nextOrderId,
  processCard,
} from "./payment";
import { pixPricing } from "./pix";
import { availableStock, isSoldOut } from "./product";
import { quoteShipping } from "./shipping";
import { computeTotals } from "./totals";
import {
  isValidCpf,
  isValidExpiry,
  maskCpfForStorage,
  isValidPhone,
  maskCardNumber,
  maskCpf,
  maskExpiry,
  maskPhone,
  simulateCepLookup,
} from "./validation";
import { cartWords } from "./cart-words";
import { itemName, variantText } from "./item-name";
import { shippingRow } from "./shipping-row";
import { getPreset, presets } from "@/presets";

const trama = getPreset("trama-studio")!;
const forno = getPreset("forno-da-vila")!;

const NOW = new Date("2026-03-12T12:00:00-03:00");
const coupons: Coupon[] = [
  { code: "TENOFF", type: "percent", value: 10, minValue: 10000, active: true },
  { code: "FIXO20", type: "fixed", value: 2000, active: true },
  { code: "GRANDE", type: "fixed", value: 99999, active: true },
  { code: "VELHO", type: "percent", value: 20, active: true, expiresAt: "2024-03-01T00:00:00-03:00" },
  { code: "OFF", type: "percent", value: 50, active: false },
];

describe("cupom", () => {
  it("percentual e fixo; código sem diferenciar maiúsculas e com espaços", () => {
    expect(applyCoupon("tenoff", coupons, 20000, NOW)).toMatchObject({ status: "applied", discount: 2000 });
    expect(applyCoupon("  TenOff ", coupons, 12345, NOW)).toMatchObject({ status: "applied", discount: 1235 }); // 1234,5 → 1235
    expect(applyCoupon("fixo20", coupons, 5000, NOW)).toMatchObject({ status: "applied", discount: 2000 });
  });

  it("nunca desconta mais do que o subtotal", () => {
    expect(applyCoupon("GRANDE", coupons, 3000, NOW)).toMatchObject({ status: "applied", discount: 3000 });
  });

  it("vencido, inválido, inativo e abaixo do mínimo", () => {
    expect(applyCoupon("VELHO", coupons, 50000, NOW)).toEqual({ status: "expired" });
    expect(applyCoupon("naoexiste", coupons, 50000, NOW)).toEqual({ status: "invalid" });
    expect(applyCoupon("", coupons, 50000, NOW)).toEqual({ status: "invalid" });
    expect(applyCoupon("OFF", coupons, 50000, NOW)).toEqual({ status: "invalid" });
    expect(applyCoupon("TENOFF", coupons, 9999, NOW)).toEqual({ status: "below-min", minValue: 10000 });
  });

  it("os cupons dos presets: um válido e um vencido", () => {
    for (const p of [trama, forno]) {
      const results = p.coupons.map((c) => applyCoupon(c.code, p.coupons, 100000, NOW).status);
      expect(results.sort()).toEqual(["applied", "expired"]);
    }
  });
});

describe("total do pedido", () => {
  const pix = { enabled: true, percent: 5 };

  it("subtotal − cupom − Pix (sobre o valor após o cupom) + frete", () => {
    const t = computeTotals({ subtotal: 20000, couponDiscount: 2000, shipping: 1490, method: "pix", descontoPix: pix });
    expect(t).toEqual({ subtotal: 20000, couponDiscount: 2000, afterCoupon: 18000, pixDiscount: 900, shipping: 1490, total: 18590 });
  });

  it("o desconto Pix nunca incide sobre o frete", () => {
    const withShipping = computeTotals({ subtotal: 10000, shipping: 5000, method: "pix", descontoPix: pix });
    const without = computeTotals({ subtotal: 10000, shipping: 0, method: "pix", descontoPix: pix });
    expect(withShipping.pixDiscount).toBe(without.pixDiscount);
    expect(withShipping.total - without.total).toBe(5000);
  });

  it("só no Pix: cartão e boleto não recebem o desconto", () => {
    for (const method of ["cartao", "boleto"] as const) {
      expect(computeTotals({ subtotal: 10000, method, descontoPix: pix }).pixDiscount).toBe(0);
    }
    expect(computeTotals({ subtotal: 10000, method: "pix", descontoPix: { enabled: false, percent: 5 } }).pixDiscount).toBe(0);
    expect(computeTotals({ subtotal: 10000, method: "pix" }).pixDiscount).toBe(0);
  });

  it("arredonda cada parcela ao centavo", () => {
    expect(pixPricing(9999, pix)).toEqual({ price: 9499, discount: 500 }); // 499,95 → 500
    expect(pixPricing(1, pix)).toEqual({ price: 1, discount: 0 });
    expect(pixPricing(100, { enabled: true, percent: 0 })).toBeNull();
    expect(computeTotals({ subtotal: 18990, couponDiscount: 1899, method: "pix", descontoPix: pix }).pixDiscount).toBe(855); // 170,91 × 5% = 8,5455
  });

  it("cupom maior que o subtotal zera os itens, mas o frete continua", () => {
    const t = computeTotals({ subtotal: 3000, couponDiscount: 99999, shipping: 990 });
    expect(t.afterCoupon).toBe(0);
    expect(t.total).toBe(990);
  });

  it("frete grátis pelo subtotal do carrinho (não pelo preço de um item) e retirada", () => {
    const base = {
      shipping: trama.config.shipping,
      modules: trama.config.modules,
      storeAddress: trama.config.legal.address,
      cep: "01310-100",
    };
    // dois itens de R$ 119,90: cada um abaixo de R$ 199, juntos acima
    const item = 11990;
    const alone = quoteShipping({ ...base, itemPrice: item });
    const together = quoteShipping({ ...base, itemPrice: item * 2 });
    if (alone.status !== "ok" || together.status !== "ok") throw new Error("esperava ok");
    expect(alone.options[0].free).toBe(false);
    expect(together.options[0]).toMatchObject({ free: true, price: 0 });

    const fornoQuote = quoteShipping({
      cep: "80010-000",
      itemPrice: 1000,
      shipping: forno.config.shipping,
      modules: forno.config.modules,
      storeAddress: forno.config.legal.address,
    });
    if (fornoQuote.status !== "ok") throw new Error("esperava ok");
    expect(fornoQuote.options).toEqual([]);
    expect(fornoQuote.pickup).not.toBeNull(); // retirada continua disponível fora da cobertura
  });
});

describe("CPF", () => {
  it("aceita CPFs válidos, com ou sem máscara", () => {
    for (const cpf of ["529.982.247-25", "52998224725", "111.444.777-35", "390.533.447-05"]) {
      expect(isValidCpf(cpf), cpf).toBe(true);
    }
  });

  it("recusa dígitos verificadores errados, tamanho errado e vazio", () => {
    for (const cpf of ["529.982.247-26", "529.982.247-24", "123.456.789-00", "1234567890", "123456789012", "", "abc"]) {
      expect(isValidCpf(cpf), cpf).toBe(false);
    }
  });

  it("recusa todos os dígitos iguais (que passariam na conta)", () => {
    for (let d = 0; d <= 9; d++) expect(isValidCpf(String(d).repeat(11)), String(d)).toBe(false);
  });

  it("máscaras de CPF, celular, cartão e validade", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
    expect(maskPhone("1112345678")).toBe("(11) 1234-5678");
    expect(maskPhone("1")).toBe("(1");
    expect(maskCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(maskExpiry("1228")).toBe("12/28");
    expect(isValidPhone("(11) 91234-5678")).toBe(true);
    expect(isValidPhone("(11) 21234-5678")).toBe(false);
    expect(isValidExpiry("12/30", NOW)).toBe(true);
    expect(isValidExpiry("02/26", NOW)).toBe(false);
    expect(isValidExpiry("13/30", NOW)).toBe(false);
  });

  it("busca de CEP simulada: só os prefixos 01–05 (São Paulo)", () => {
    expect(simulateCepLookup("01310-100")).toEqual({ city: "São Paulo", state: "SP" });
    expect(simulateCepLookup("05999-000")).toEqual({ city: "São Paulo", state: "SP" });
    expect(simulateCepLookup("06000-000")).toBeNull();
    expect(simulateCepLookup("80010-000")).toBeNull();
    expect(simulateCepLookup("0131")).toBeNull();
  });

  it("validação do formulário aponta o primeiro campo inválido na ordem da tela", () => {
    const errors = validateIdentification({ name: "Ana", email: "x", phone: "1", cpf: "111.111.111-11", marketing: false });
    expect(Object.keys(errors)).toEqual(["name", "email", "phone", "cpf"]);
    expect(firstInvalid(errors, ["name", "email", "phone", "cpf"])).toBe("name");
    expect(
      validateIdentification({ name: "Ana Souza", email: "ana@example.com", phone: "(11) 91234-5678", cpf: "529.982.247-25", marketing: false }),
    ).toEqual({});
    expect(firstInvalid({ cpf: "CPF inválido" }, ["name", "email", "phone", "cpf"])).toBe("cpf");
    expect(firstInvalid({}, ["name"])).toBeNull();
  });

  it("validação do endereço e composição", () => {
    const empty = validateAddress({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
    expect(Object.keys(empty)).toEqual(["cep", "street", "number", "district", "city", "state"]);
    const ok = { cep: "01310-100", street: "Av. Paulista", number: "1000", complement: "ap 12", district: "Bela Vista", city: "São Paulo", state: "sp" };
    expect(validateAddress(ok)).toEqual({});
    expect(composeAddress(ok)).toBe("Av. Paulista, 1000 (ap 12) — Bela Vista, São Paulo/SP, CEP 01310-100");
  });
});

describe("cartão de teste", () => {
  it("aprova só o número de teste, em qualquer máscara", () => {
    for (const number of [TEST_CARD_NUMBER, "4111 1111 1111 1111"]) {
      const r = processCard({ number, cvv: "123", installments: 3 });
      expect(r).toEqual({ ok: true, payment: { method: "cartao", installments: 3, brand: "Visa", last4: "1111" } });
    }
  });

  it("recusa qualquer outro número", () => {
    for (const number of ["4111 1111 1111 1112", "5555 5555 5555 4444", "", "4111"]) {
      expect(processCard({ number, cvv: "123", installments: 1 })).toEqual({ ok: false, error: CARD_DECLINED_MESSAGE });
    }
    expect(CARD_DECLINED_MESSAGE).toBe("Cartão recusado (demonstração)");
  });

  it("o pedido nunca contém o número completo nem o CVV", () => {
    const cvv = "987";
    const result = processCard({ number: "4111 1111 1111 1111", cvv, installments: 2 });
    if (!result.ok) throw new Error("esperava aprovado");
    const line = resolveLines(addLine([], trama.products, { productId: "ts-014", qty: 1 }), trama.products);
    const order = buildOrder({
      id: "TS-1009",
      lines: line,
      customer: { name: "Ana Souza", email: "ana@example.com", phone: "(11) 91234-5678", cpf: "52998224725" },
      delivery: { type: "retirada" },
      payment: result.payment,
      totals: computeTotals({ subtotal: 45990 }),
    });
    const json = JSON.stringify(order);
    expect(json).not.toContain("4111111111111111");
    expect(json).not.toContain("4111 1111 1111 1111");
    expect(json).not.toContain(`"${cvv}"`);
    expect(json).not.toMatch(/cvv/i);
    expect(order.payment).toEqual({ method: "cartao", installments: 2, brand: "Visa", last4: "1111" });
    expect(order.status).toBe("pago");
    expect(validateCard({ number: "4111 1111 1111 1111", name: "ANA SOUZA", expiry: "12/30", cvv: "123", installments: 1 }, NOW)).toEqual({});
    expect(Object.keys(validateCard({ number: "4111", name: "", expiry: "", cvv: "1", installments: 1 }, NOW))).toEqual(["cardNumber", "cardName", "cardExpiry", "cardCvv"]);
  });

  it("bandeira", () => {
    expect(cardBrand("4111")).toBe("Visa");
    expect(cardBrand("5555")).toBe("Mastercard");
    expect(cardBrand("3782")).toBe("Amex");
    expect(cardBrand("9999")).toBe("Cartão");
  });
});

describe("boleto, Pix e número do pedido", () => {
  it("vencimento em 3 dias úteis (pula fim de semana)", () => {
    // quinta 12/03/2026: sexta (1), segunda (2), terça 17/03 (3)
    expect(boletoDueDate(new Date(2026, 2, 12))).toBe("2026-03-17");
    expect(addBusinessDays(new Date(2026, 2, 13), 3).getDay()).toBe(3); // sexta + 3 úteis = quarta
    expect(boletoDueDate(new Date(2026, 2, 9))).toBe("2026-03-12"); // segunda → quinta
  });

  it("código Pix fictício e identificado como demonstração", () => {
    expect(fakePixCode("TS-1009")).toContain("DEMO");
  });

  it("próximo número: prefixo + maior número usado + 1", () => {
    const orders = (ids: string[]) => ids.map((id) => ({ id })) as Pick<Order, "id">[];
    expect(nextOrderId("TS", orders(["TS-1001", "TS-1008", "FV-2001"]))).toBe("TS-1009");
    expect(nextOrderId("FV", orders(["TS-1001"]))).toBe("FV-1001");
    expect(nextOrderId("TS", orders(["TS-1009"]))).toBe("TS-1010");
  });
});

describe("produto digital (fixture)", () => {
  const physical = trama.products.find((p) => p.id === "ts-014")!; // bolsa, 6 em estoque
  const course: Product = {
    ...structuredClone(physical),
    id: "dg-001",
    slug: "curso-fixture",
    name: "Curso (fixture)",
    sku: "DG-001",
    type: "digital",
    price: 19700,
    stock: 0, // sem estoque cadastrado: digital está sempre disponível
    variants: [],
  };
  const products = [...trama.products, course];

  it("sem estoque: sempre disponível e nunca esgotado", () => {
    expect(availableStock(course)).toBe(Infinity);
    expect(isSoldOut(course)).toBe(false);
    expect(isSoldOut({ ...course, type: "physical" })).toBe(true);
    const cart = addLine([], products, { productId: "dg-001", qty: 40 });
    expect(cart[0].qty).toBe(40);
  });

  it("carrinho só digital: sem entrega e sem frete; misto: entrega normal", () => {
    const onlyDigital = resolveLines(addLine([], products, { productId: "dg-001", qty: 1 }), products);
    expect(cartIsAllDigital(onlyDigital)).toBe(true);
    expect(physicalSubtotal(onlyDigital)).toBe(0);

    const mixed = resolveLines(
      addLine(addLine([], products, { productId: "dg-001", qty: 1 }), products, { productId: "ts-014", qty: 1 }),
      products,
    );
    expect(cartIsAllDigital(mixed)).toBe(false);
    expect(physicalSubtotal(mixed)).toBe(45990); // o digital não conta para o frete grátis
    expect(cartIsAllDigital([])).toBe(false);
  });

  it("quantidade do seletor: digital vai até o limite (99); físico respeita o estoque", () => {
    const cart = addLine(addLine([], products, { productId: "dg-001", qty: 1 }), products, { productId: "ts-014", qty: 1 });
    const lines = resolveLines(cart, products);
    expect(lines.find((l) => l.digital)!.maxQty).toBe(99);
    expect(lines.find((l) => !l.digital)!.maxQty).toBe(6);
    const bumped = setLineQty(cart, products, makeLineId("ts-014", undefined, []), 50);
    expect(bumped.find((l) => l.productId === "ts-014")!.qty).toBe(6);
    expect(setLineQty(cart, products, makeLineId("ts-014", undefined, []), 0).find((l) => l.productId === "ts-014")!.qty).toBe(1);
  });
});

describe("CPF mascarado para gravar", () => {
  it("guarda só os 2 últimos dígitos", () => {
    expect(maskCpfForStorage("529.982.247-25")).toBe("***.***.***-25");
    expect(maskCpfForStorage("52998224725")).toBe("***.***.***-25");
    expect(maskCpfForStorage("111.444.777-35")).toBe("***.***.***-35");
    for (const cpf of ["529.982.247-25", "111.444.777-35"]) {
      expect(maskCpfForStorage(cpf)).not.toMatch(/[0-9]{3}[.][0-9]{3}[.][0-9]{3}/);
      expect(maskCpfForStorage(cpf).replace(/[^0-9]/g, "")).toHaveLength(2);
    }
  });
});

describe("rótulo do carrinho vem do preset", () => {
  it("Carrinho (masculino) e Sacola (feminino)", () => {
    expect(cartWords()).toMatchObject({ name: "Carrinho", to: "ao carrinho", add: "Adicionar ao carrinho", added: "Adicionado ao carrinho", view: "Ver carrinho", back: "Voltar para o carrinho", empty: "Seu carrinho está vazio" });
    expect(cartWords("Sacola", "f")).toMatchObject({ name: "Sacola", to: "à sacola", add: "Adicionar à sacola", added: "Adicionado à sacola", view: "Ver sacola", back: "Voltar para a sacola", empty: "Sua sacola está vazia" });
  });

  it("os presets declaram rótulo e gênero", () => {
    expect([trama.config.cartLabel, trama.config.cartGender ?? "m"]).toEqual(["Carrinho", "m"]);
    expect([forno.config.cartLabel, forno.config.cartGender]).toEqual(["Sacola", "f"]);
  });
});

describe("cartão como módulo próprio", () => {
  it("Trama: cartão + parcelamento; Forno: cartão à vista (sem parcelamento)", () => {
    expect(trama.config.modules.cartao?.enabled).toBe(true);
    expect(trama.config.modules.parcelamento?.enabled).toBe(true);
    expect(forno.config.modules.cartao?.enabled).toBe(true);
    expect(forno.config.modules.parcelamento?.enabled).toBeFalsy();
  });
});

describe("linha de frete: retirada não é frete grátis", () => {
  it("retirada vira 'Retirada no local' com R$ 0,00 (nunca 'Grátis')", () => {
    const row = shippingRow("pickup", 0);
    expect(row.label).toBe("Retirada no local");
    expect(row.value.replace(/\u00a0/g, " ")).toBe("R$ 0,00");
    expect(shippingRow("pickup", 999).value).not.toBe("Grátis");
  });

  it("entrega continua 'Frete', com 'Grátis' quando o valor é zero", () => {
    expect(shippingRow("ship", 0)).toEqual({ label: "Frete", value: "Grátis" });
    const paid = shippingRow("ship", 990);
    expect(paid.label).toBe("Frete");
    expect(paid.value.replace(/\u00a0/g, " ")).toBe("R$ 9,90");
  });

  it("digital e ainda sem escolha", () => {
    expect(shippingRow("digital")).toEqual({ label: "Frete", value: "Não se aplica" });
    expect(shippingRow("pending")).toEqual({ label: "Frete", value: "A calcular" });
    expect(shippingRow("pending", 0, "—")).toEqual({ label: "Frete", value: "—" });
  });

  it("só o Forno tem retirada; a Trama não oferece", () => {
    expect(forno.config.modules.retiradaLocal).toBe(true);
    expect(trama.config.modules.retiradaLocal).toBeFalsy();
    const q = quoteShipping({
      cep: "01310-100",
      itemPrice: 50000,
      shipping: trama.config.shipping,
      modules: trama.config.modules,
      storeAddress: trama.config.legal.address,
    });
    if (q.status !== "ok") throw new Error("esperava ok");
    expect(q.pickup).toBeNull();
  });

  it("o Expresso do Forno continua previsto (R$ 16,90, hoje) e a regra de frete não mudou", () => {
    expect(forno.config.shipping.options.find((o) => o.id === "expresso")).toMatchObject({ basePrice: 1690, days: "same-day" });
    expect(forno.config.modules.freteGratis).toEqual({ enabled: true, minValue: 8000 });
  });
});

describe("nome de item sem parênteses aninhados", () => {
  it("variante com parênteses vira vírgula e o item usa ' · '", () => {
    expect(variantText({ porcao: "Grande (8 fatias)" })).toBe("Grande, 8 fatias");
    expect(variantText({ tamanho: "M", cor: "Off-white" })).toBe("M / Off-white");
    expect(variantText({ porcao: "Fatia" })).toBe("Fatia");
    expect(itemName("Pizza Margherita", variantText({ porcao: "Grande (8 fatias)" }))).toBe("Pizza Margherita · Grande, 8 fatias");
    expect(itemName("Bolsa", null)).toBe("Bolsa");
  });

  const nested = /\([^)]*\(/;
  it.each(presets.map((p) => [p.id, p] as const))("preset %s: nenhum nome (produto, variação ou item de pedido) tem parênteses aninhados", (_id, preset) => {
    const names: string[] = [];
    for (const p of preset.products) {
      names.push(p.name);
      for (const v of p.variants) names.push(itemName(p.name, variantText(v.attributes)));
      for (const a of p.addons ?? []) names.push(a.label);
    }
    for (const o of preset.orders) for (const i of o.items) names.push(i.name);
    expect(names.length).toBeGreaterThanOrEqual(preset.products.length);
    for (const name of names) expect(name, name).not.toMatch(nested);
  });

  it("os itens de pedido do Forno usam o novo formato", () => {
    const names = forno.orders.flatMap((o) => o.items.map((i) => i.name));
    expect(names).toContain("Pizza Margherita · Média, 6 fatias");
    expect(names).toContain("Pizza Quatro Queijos · Grande, 8 fatias");
    expect(names.filter((n) => n.includes("(") && n.includes(" · "))).toEqual([]);
  });
});
