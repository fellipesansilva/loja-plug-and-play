import { describe, expect, it } from "vitest";
import { formatBRL, parseBRLToCents } from "./money";

describe("money", () => {
  it("formata centavos em BRL", () => {
    expect(formatBRL(18990).replace(/\s/g, " ")).toBe("R$ 189,90");
    expect(formatBRL(19900).replace(/\s/g, " ")).toBe("R$ 199,00");
  });
  it("converte texto em centavos", () => {
    expect(parseBRLToCents("319,90")).toBe(31990);
    expect(parseBRLToCents("319.90")).toBe(31990);
    expect(parseBRLToCents("1.299,50")).toBe(129950);
  });
});
