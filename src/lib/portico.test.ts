import { describe, expect, it } from "vitest";
import { arcaInflaveis as arca } from "@/presets/arca-inflaveis";
import { LOGO_ERRO, LOGO_MAX_BYTES, logoProblem, observacaoPortico, textoSobre } from "./portico";

describe("configurador do pórtico", () => {
  it("logo: PNG, JPG e SVG de até 5 MB passam", () => {
    expect(logoProblem({ name: "logo.png", type: "image/png", size: 1000 })).toBeNull();
    expect(logoProblem({ name: "logo.JPG", type: "image/jpeg", size: LOGO_MAX_BYTES })).toBeNull();
    expect(logoProblem({ name: "logo.svg", type: "image/svg+xml", size: 10 })).toBeNull();
    expect(logoProblem({ name: "logo.jpeg", type: "", size: 10 })).toBeNull();
  });

  it("logo: outro formato ou mais de 5 MB dá a mensagem com o formato aceito", () => {
    expect(logoProblem({ name: "logo.pdf", type: "application/pdf", size: 10 })).toBe(LOGO_ERRO);
    expect(logoProblem({ name: "logo.gif", type: "image/gif", size: 10 })).toBe(LOGO_ERRO);
    expect(logoProblem({ name: "logo.png", type: "image/png", size: LOGO_MAX_BYTES + 1 })).toBe(LOGO_ERRO);
    expect(logoProblem({ name: "malicioso.exe", type: "image/png", size: 10 })).toBe(LOGO_ERRO);
    expect(LOGO_ERRO).toContain("PNG, JPG ou SVG");
  });

  it("observação com texto ou com o nome do logo", () => {
    expect(observacaoPortico({ medidas: "6 × 4 m", cor: "Azul-petróleo", texto: " Minha Marca ", logoNome: null })).toBe('6 × 4 m · cor Azul-petróleo · texto "Minha Marca"');
    expect(observacaoPortico({ medidas: "6 × 4 m", cor: "Amarelo", texto: "x", logoNome: "empresa.svg" })).toBe("6 × 4 m · cor Amarelo · logo empresa.svg");
  });

  it("texto claro sobre cor escura e escuro sobre cor clara", () => {
    expect(textoSobre("#0f4c5c")).toBe("claro");
    expect(textoSobre("#f2b705")).toBe("escuro");
    expect(textoSobre("não é cor")).toBe("claro");
  });

  it("o limite de texto, as medidas e a paleta vêm do preset; a observação mais longa possível cabe nos 500 caracteres", () => {
    const c = arca.config.orcamentoBlocks!.porticoConfigurador!;
    expect(c.textoMax).toBe(22);
    expect(c.paleta.map((p) => p.id)).toEqual(["petroleo", "amarelo", "cinza"]);
    const maiorNome = c.paleta.map((p) => p.nome).sort((a, b) => b.length - a.length)[0];
    const pior = observacaoPortico({ medidas: c.medidas, cor: maiorNome, texto: "x".repeat(c.textoMax), logoNome: null });
    expect(pior.length).toBeLessThan(500);
  });
});
