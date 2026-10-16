import { describe, expect, it } from "vitest";
import { arcaInflaveis as arca } from "@/presets/arca-inflaveis";
import { formatarLitros, observacaoDimensionador, sugerir, textoDias, volumeNecessario } from "./dimensionador";

const cfg = arca.config.orcamentoBlocks!.dimensionador!;

describe("dimensionador de reservatório", () => {
  it("1.500 L/dia × 3 dias = 4.500 L → menor modelo fechado que atende: 5.000 L", () => {
    expect(volumeNecessario(1500, 3)).toBe(4500);
    expect(sugerir(cfg.fechado, 1500, 3)).toEqual({ tipo: "modelo", capacidade: 5000, necessario: 4500 });
  });

  it("consumo vazio, zero ou inválido: sem sugestão", () => {
    for (const c of [0, -5, NaN, Infinity]) expect(sugerir(cfg.fechado, c, 3).tipo, String(c)).toBe("sem-consumo");
    expect(volumeNecessario(0, 5)).toBe(0);
    expect(sugerir({ produto: "x", capacidades: [] }, 1000, 1).tipo).toBe("sem-consumo");
  });

  it("capacidade exata atende; um litro a mais passa para o próximo modelo", () => {
    expect(sugerir(cfg.fechado, 1000, 5)).toMatchObject({ tipo: "modelo", capacidade: 5000 });
    expect(sugerir(cfg.fechado, 1000, 1)).toMatchObject({ tipo: "modelo", capacidade: 1000 });
    expect(sugerir(cfg.fechado, 1001, 1)).toMatchObject({ tipo: "modelo", capacidade: 5000 });
  });

  it("a linha aberta usa a própria lista, sem o modelo de 1.000 L", () => {
    expect(cfg.aberto.capacidades).not.toContain(1000);
    expect(sugerir(cfg.aberto, 500, 1)).toMatchObject({ tipo: "modelo", capacidade: 5000 });
    expect(sugerir(cfg.fechado, 500, 1)).toMatchObject({ tipo: "modelo", capacidade: 1000 });
  });

  it("acima da maior capacidade: quantos reservatórios da maior (arredonda para cima)", () => {
    expect(sugerir(cfg.fechado, 5000, 5)).toEqual({ tipo: "varios", capacidade: 20000, quantidade: 2, necessario: 25000 });
    expect(sugerir(cfg.fechado, 20001, 1)).toMatchObject({ tipo: "varios", quantidade: 2 });
    expect(sugerir(cfg.fechado, 20000, 1)).toMatchObject({ tipo: "modelo", capacidade: 20000 });
    expect(sugerir(cfg.fechado, 20000, 15)).toMatchObject({ tipo: "varios", quantidade: 15 });
  });

  it("não depende da ordem da lista do preset", () => {
    expect(sugerir({ produto: "x", capacidades: [20000, 1000, 5000] }, 1500, 3)).toMatchObject({ capacidade: 5000 });
  });

  it("volumes inteiros: consumo fracionado é arredondado para baixo, nunca vira float", () => {
    expect(volumeNecessario(1500.9, 3)).toBe(4500);
    expect(Number.isInteger(volumeNecessario(1234.5, 7))).toBe(true);
  });

  it("textos em português: milhar com ponto e plural de dias", () => {
    expect(formatarLitros(4500)).toBe("4.500");
    expect(formatarLitros(20000)).toBe("20.000");
    expect(formatarLitros(900)).toBe("900");
    expect(textoDias(1)).toBe("1 dia");
    expect(textoDias(2)).toBe("2 dias");
    expect(textoDias(15)).toBe("15 dias");
  });

  it("observação do item: capacidade, volume necessário e a conta", () => {
    const s = sugerir(cfg.fechado, 1500, 3);
    if (s.tipo === "sem-consumo") throw new Error("sem sugestão");
    expect(observacaoDimensionador(s, 1500, 3, cfg.unidadeConsumo)).toBe("5.000 L · para 4.500 L (1.500 L/dia × 3 dias)");
    const m = sugerir(cfg.fechado, 1500, 1);
    if (m.tipo === "sem-consumo") throw new Error("sem sugestão");
    expect(observacaoDimensionador(m, 1500, 1, cfg.unidadeConsumo)).toBe("5.000 L · para 1.500 L (1.500 L/dia × 1 dia)");
  });

  it("os limites de dias e as capacidades vêm do preset (1 a 15 dias; fechado 1.000 a 20.000 L)", () => {
    expect([cfg.diasMin, cfg.diasMax]).toEqual([1, 15]);
    expect(cfg.fechado.capacidades).toEqual([1000, 5000, 10000, 20000]);
    expect(cfg.aberto.capacidades).toEqual([5000, 10000, 20000]);
    expect(cfg.unidadeConsumo).toBe("L/dia");
  });
});
