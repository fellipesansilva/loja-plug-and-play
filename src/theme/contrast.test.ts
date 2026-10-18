import { describe, expect, it } from "vitest";
import { MIN_TEXT_CONTRAST, contrastIssues, contrastRatio, parseHex, relativeLuminance } from "./contrast";
import type { ThemeTokens } from "@/domain/types";

const colors = (over: Partial<ThemeTokens["colors"]>): ThemeTokens["colors"] => ({
  primary: "#4b5340", secondary: "#a68a64", background: "#f5f3ef", surface: "#f5f3ef", text: "#1c1b19", muted: "#6b675f", border: "#ddd8cf",
  success: "#3f5a2e", warning: "#b7791f", danger: "#b4443c", announcementBg: "#4b5340", announcementText: "#ffffff", highlightBg: "#4b5340",
  highlightText: "#ffffff", footerBg: "#f5f3ef", footerText: "#6b675f", ...over,
});

describe("contraste WCAG", () => {
  it("valores de referência: preto sobre branco 21:1, iguais 1:1, simétrico", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
    expect(parseHex("#abc")).toEqual([170, 187, 204]);
    expect(parseHex("azul")).toBeNull();
  });

  it("limite de 4,5:1: #767676 sobre branco passa (4,54), #777777 reprova (4,48)", () => {
    expect(MIN_TEXT_CONTRAST).toBe(4.5);
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
    const pairs = [["text", "background"]] as const;
    expect(contrastIssues(colors({ text: "#767676", background: "#ffffff" }), pairs)).toEqual([]);
    const bad = contrastIssues(colors({ text: "#777777", background: "#ffffff" }), pairs);
    expect(bad).toHaveLength(1);
    expect(bad[0]).toMatchObject({ fg: "text", bg: "background", min: 4.5 });
    expect(bad[0].ratio).toBeLessThan(4.5);
  });

  it("devolve só os pares reprovados e ignora cor que não é hexadecimal (var(...))", () => {
    const pairs = [["announcementText", "announcementBg"], ["background", "primary"], ["text", "secondary"]] as const;
    expect(contrastIssues(colors({}), pairs)).toEqual([]);
    const issues = contrastIssues(colors({ secondary: "#5c4033" }), pairs);
    expect(issues.map((i) => `${i.fg}/${i.bg}`)).toEqual(["text/secondary"]);
    expect(contrastIssues(colors({ primary: "var(--x)" }), pairs)).toEqual([]);
  });
});
