import { describe, expect, it } from "vitest";
import { consentKey, parseConsent, serializeConsent } from "./consent";

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
