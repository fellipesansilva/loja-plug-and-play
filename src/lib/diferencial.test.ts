import { describe, expect, it } from "vitest";
import { getPreset } from "@/presets";
import { answerFor, normalizeQuestion } from "./bot";
import { newsletterKeyFor, validateNewsletter } from "./newsletter";
import { productSlugOf, whatsappText, whatsappUrl } from "./whatsapp";

const trama = getPreset("trama-studio")!;
const bot = trama.config.bot!;
const whats = trama.config.whatsapp!;
const news = trama.config.newsletter!;

describe("bot simulado: respostas do preset, sem IA", () => {
  it("normaliza acento, caixa e pontuação", () => {
    expect(normalizeQuestion("  Qual o PRAZO de entrega?! ")).toBe("qual o prazo de entrega");
    expect(normalizeQuestion("Devolução / Troca")).toBe("devolucao troca");
  });

  it("responde cada tema do repertório (prazo, frete, troca, pagamento) com o texto do preset", () => {
    const tema = (q: string) => {
      const a = answerFor(bot, q);
      return a.kind === "topic" ? a.topic.id : "fallback";
    };
    expect(tema("Qual o prazo de entrega?")).toBe("prazo");
    expect(tema("quanto custa o frete")).toBe("frete");
    expect(tema("posso devolver se não gostar?")).toBe("troca");
    expect(tema("TEM GARANTIA?")).toBe("troca");
    expect(tema("aceita pix e cartão?")).toBe("pagamento");
    const a = answerFor(bot, "prazo");
    expect(a.kind === "topic" && a.topic.answer).toBe(bot.topics[0].answer);
  });

  it("as respostas repetem os números do próprio preset (frete grátis, parcelas, prazos de troca)", () => {
    const text = (id: string) => bot.topics.find((t) => t.id === id)!.answer.replace(/\s/g, " ");
    expect(text("frete")).toContain("R$ 199,00");
    expect(text("pagamento")).toContain("6x");
    expect(text("pagamento")).toContain(`${trama.config.modules.descontoPix!.percent}%`);
    expect(text("troca")).toContain(`${trama.config.policies.regretDays} dias`);
    expect(text("troca")).toContain(`${trama.config.policies.defect.days} dias`);
    expect(text("prazo")).toContain("5 a 8 dias úteis");
  });

  it("pergunta fora do repertório e pergunta vazia caem na resposta fixa de 'não sei'", () => {
    expect(answerFor(bot, "vocês vendem geladeira?")).toEqual({ kind: "fallback" });
    expect(answerFor(bot, "   ")).toEqual({ kind: "fallback" });
    expect(answerFor(bot, "???")).toEqual({ kind: "fallback" });
    expect(bot.fallback.length).toBeGreaterThan(0);
    expect(bot.whatsappOffer).toBe("Falar pelo WhatsApp");
  });

  it("a palavra-chave vale como palavra: 'entregador' não casa com 'entrega' no meio de outra palavra", () => {
    expect(answerFor(bot, "contratar entregadores")).toEqual({ kind: "topic", topic: bot.topics[0] });
    expect(answerFor(bot, "reentrega")).toEqual({ kind: "fallback" });
  });
});

describe("WhatsApp: mensagem pré-preenchida e demonstração", () => {
  it("com produto na página, a mensagem traz o nome; sem produto, a saudação", () => {
    expect(whatsappText(whats, "Vestido Midi Linho")).toBe("Olá! Tenho interesse em Vestido Midi Linho da Trama Studio. Podem me ajudar?");
    expect(whatsappText(whats, null)).toBe(whats.greeting);
    expect(whatsappText(whats, "  ")).toBe(whats.greeting);
  });

  it("na demonstração (isReal falso) não há link para o WhatsApp; com número real, o link leva a mensagem codificada", () => {
    expect(whats.isReal).toBe(false);
    expect(whatsappUrl(whats, "oi")).toBeNull();
    expect(whatsappUrl({ ...whats, isReal: true }, "olá & oi")).toBe("https://wa.me/5511900000000?text=ol%C3%A1%20%26%20oi");
    expect(whatsappUrl({ ...whats, isReal: true, number: "123" }, "oi")).toBeNull();
  });

  it("o produto da página vem do endereço", () => {
    expect(productSlugOf("/produto/vestido-midi-linho")).toBe("vestido-midi-linho");
    expect(productSlugOf("/carrinho")).toBeNull();
    expect(productSlugOf("/")).toBeNull();
  });
});

describe("newsletter: consentimento ativo", () => {
  it("sem consentimento o envio é recusado, com a mensagem do preset", () => {
    const r = validateNewsletter({ email: "ana@example.com", consent: false }, news);
    expect(r).toEqual({ ok: false, field: "consent", message: news.refusal });
  });

  it("com consentimento e e-mail válido, aceita (e normaliza espaços)", () => {
    expect(validateNewsletter({ email: "  ana@example.com ", consent: true }, news)).toEqual({ ok: true, email: "ana@example.com" });
  });

  it("e-mail inválido é recusado antes do consentimento", () => {
    for (const email of ["", "ana", "ana@", "ana@x", "a b@x.com"]) {
      expect(validateNewsletter({ email, consent: true }, news), email).toMatchObject({ ok: false, field: "email", message: news.invalidEmail });
    }
  });

  it("os e-mails de demonstração ficam numa chave por preset, só no navegador", () => {
    expect(newsletterKeyFor("trama")).toBe("loja-newsletter-v1-trama");
    expect(newsletterKeyFor("trama")).not.toBe(newsletterKeyFor("forno"));
  });
});
