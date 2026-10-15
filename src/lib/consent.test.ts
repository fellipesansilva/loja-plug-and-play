import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { CONSENT_SET_ATTR, consentKey, earlyConsentScript, parseConsent, serializeConsent } from "./consent";

describe("consentimento de cookies", () => {
  it("a chave é separada por preset", () => {
    expect(consentKey("trama")).toBe("loja-consent-v1-trama");
    expect(consentKey("forno")).not.toBe(consentKey("trama"));
  });

  it("grava escolha, data e versão do texto, e lê de volta", () => {
    const now = new Date("2026-10-15T15:00:00Z");
    const raw = serializeConsent("rejected", "2", now);
    expect(JSON.parse(raw)).toEqual({ choice: "rejected", at: "2026-10-15T15:00:00.000Z", version: "2" });
    expect(parseConsent(raw, "2")).toEqual({ choice: "rejected", at: "2026-10-15T15:00:00.000Z", version: "2" });
  });

  it("escolha dada para outra versão do texto, vazia ou quebrada = perguntar de novo", () => {
    expect(parseConsent(serializeConsent("accepted", "1"), "2")).toBeNull();
    expect(parseConsent(null, "1")).toBeNull();
    expect(parseConsent("", "1")).toBeNull();
    expect(parseConsent("{lixo", "1")).toBeNull();
    expect(parseConsent(JSON.stringify({ choice: "talvez", at: "2026-01-01T00:00:00Z", version: "1" }), "1")).toBeNull();
    expect(parseConsent(JSON.stringify({ choice: "accepted", at: "ontem", version: "1" }), "1")).toBeNull();
  });
});

describe("script inline que esconde o aviso de quem já escolheu", () => {
  function run(slug: string, version: string, storage: { getItem: (k: string) => string | null }) {
    const attrs: Record<string, string> = {};
    vm.runInNewContext(earlyConsentScript(slug, version), {
      localStorage: storage,
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
      isNaN,
      Date,
      JSON,
    });
    return attrs;
  }
  const only = (slug: string, raw: string) => ({ getItem: (k: string) => (k === consentKey(slug) ? raw : null) });

  it("com escolha válida desta loja e desta versão, marca o <html>", () => {
    expect(run("forno", "1", only("forno", serializeConsent("rejected", "1")))).toEqual({ [CONSENT_SET_ATTR]: "1" });
    expect(run("forno", "1", only("forno", serializeConsent("accepted", "1")))).toEqual({ [CONSENT_SET_ATTR]: "1" });
  });

  it("sem escolha, de outra loja, de outra versão, quebrada ou com storage lançando erro, não marca (o aviso continua visível)", () => {
    expect(run("forno", "1", { getItem: () => null })).toEqual({});
    expect(run("forno", "1", only("trama", serializeConsent("accepted", "1")))).toEqual({});
    expect(run("forno", "2", only("forno", serializeConsent("accepted", "1")))).toEqual({});
    expect(run("forno", "1", only("forno", "{lixo"))).toEqual({});
    expect(
      run("forno", "1", {
        getItem: () => {
          throw new Error("bloqueado");
        },
      }),
    ).toEqual({});
  });

  it("nunca esconde por si só: só põe um atributo (o CSS esconde) e não redireciona nem mexe no corpo", () => {
    const script = earlyConsentScript("forno", "1");
    expect(script).not.toContain("location");
    expect(script).not.toContain("display");
    expect(script).not.toContain("body");
  });
});
