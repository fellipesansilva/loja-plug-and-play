import { devices, type Page } from "@playwright/test";
import { test, expect, ORIGIN, TRAMA } from "./helpers";

// A foto do LCP da galeria do produto: srcset com as variantes, preload casado e UM download só. Roda uma vez (projeto trama), com endereços completos.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.metadata.preset !== TRAMA, "Roda uma vez (projeto trama)");
  await page.addInitScript(() => {
    for (const s of ["arca", "trama", "forno"]) localStorage.setItem(`loja-consent-v1-${s}`, JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" }));
  });
});

const ARCA = [
  ["/arca/produto/portico-inflavel", "portico-inflavel"],
  ["/arca/produto/reservatorio-flexivel-fechado", "reservatorio-flexivel-fechado"],
  ["/arca/produto/reservatorio-aberto", "reservatorio-aberto"],
] as const;
const DIR = "/images/presets/arca-inflaveis";

/** Abre a página e devolve as requisições da foto (original ou variante) e o que a <img> do LCP escolheu. */
async function abrir(page: Page, path: string, arquivo: string) {
  const pedidos: string[] = [];
  const erros: string[] = [];
  page.on("request", (r) => {
    if (new RegExp(`/${arquivo}(-\\d+)?\\.webp$`).test(new URL(r.url()).pathname)) pedidos.push(new URL(r.url()).pathname.split("/").pop()!);
  });
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text());
  });
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`${ORIGIN}${path}`, { waitUntil: "networkidle" });
  const img = page.locator('[role="group"][aria-roledescription="galeria"] ul li').first().locator("img");
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const info = await img.evaluate((e) => {
    const i = e as HTMLImageElement;
    return {
      srcset: i.getAttribute("srcset"),
      sizes: i.getAttribute("sizes"),
      current: new URL(i.currentSrc).pathname.split("/").pop()!,
      bytes: Math.round((performance.getEntriesByType("resource").find((r) => r.name === i.currentSrc) as PerformanceResourceTiming | undefined)?.encodedBodySize ?? 0),
      priority: i.getAttribute("fetchpriority"),
      loading: i.getAttribute("loading"),
      noPicture: !i.closest("picture"),
      src: i.getAttribute("src"),
      fonteSrcset: i.closest("picture")?.querySelector("source")?.getAttribute("srcset") ?? null,
    };
  });
  return { pedidos, erros, info, img };
}

// Celular coerente: tela, janela e user agent de celular. O projeto usa o perfil de desktop (tela de 1920 × 1080); emular só a janela de
// celular sobre ele faz o Chrome avaliar o <source media> contra a tela de desktop e baixar duas fotos, combinação que não existe em aparelho.
const celular = (densidade: number) => ({ viewport: { width: 412, height: 823 }, screen: { width: 412, height: 823 }, deviceScaleFactor: densidade, isMobile: true, hasTouch: true, userAgent: devices["Pixel 5"].userAgent });

test.describe("celular de densidade 2 (412 × 823): páginas de produto da Arca", () => {
  test.use(celular(2));

  for (const [path, arquivo] of ARCA) {
    test(`${path}: a foto do LCP tem srcset, baixa a variante de 960 px, uma vez só`, async ({ page }) => {
      const { pedidos, erros, info } = await abrir(page, path, arquivo);
      expect(info.srcset).toBe(`${DIR}/${arquivo}-360.webp 360w, ${DIR}/${arquivo}-640.webp 640w, ${DIR}/${arquivo}-960.webp 960w`);
      expect(info.sizes).toBe("calc(100vw - 2rem)");
      expect(info.src).toBe(`${DIR}/${arquivo}-960.webp`);
      expect(info.current).toBe(`${arquivo}-960.webp`);
      expect(info.bytes, "peso da foto servida").toBeGreaterThan(0);
      expect(info.bytes).toBeLessThan(150 * 1024); // a variante, não o original de 142 a 187 KB
      expect(info.priority).toBe("high");
      expect(info.loading).toBe("eager");
      expect(pedidos, `pedidos da foto: ${pedidos.join(", ")}`).toEqual([`${arquivo}-960.webp`]);
      expect(erros).toEqual([]);
    });
  }

  test("o preload tem o mesmo srcset, sizes e media do <picture> (com a de 960 px), e a foto é baixada uma vez", async ({ page }) => {
    const { info, pedidos } = await abrir(page, "/arca/produto/portico-inflavel", "portico-inflavel");
    const links = await page.evaluate(() => [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((l) => ({ srcset: l.getAttribute("imagesrcset"), sizes: l.getAttribute("imagesizes"), media: l.getAttribute("media"), href: l.getAttribute("href") })));
    const fonte = await page.locator("picture source").first().evaluate((s) => ({ srcset: s.getAttribute("srcset"), sizes: s.getAttribute("sizes"), media: s.getAttribute("media") }));
    expect(links).toHaveLength(2);
    const celularLink = links.find((l) => l.media === "(max-width: 767px)")!;
    const largas = links.find((l) => l.media === "(min-width: 768px)")!;
    expect(celularLink.srcset).toBe(info.srcset);
    expect(celularLink.srcset).toContain("portico-inflavel-960.webp 960w");
    expect(celularLink.sizes).toBe(info.sizes);
    expect(largas.srcset).toBe(fonte.srcset);
    expect(largas.sizes).toBe(fonte.sizes);
    expect(links.every((l) => l.href === null)).toBe(true); // sem href: o navegador só usa o imagesrcset (não há preload do original)
    expect(pedidos).toHaveLength(1);
  });

  test("Forno e Trama pesada: também baixam a de alta densidade (960 px; 900 px na Trama, a largura do original), uma vez só; Trama leve segue com o original", async ({ page }) => {
    const forno = await abrir(page, "/forno/produto/pizza-margherita", "pizza-margherita-1");
    expect(forno.info.current).toBe("pizza-margherita-1-960.webp");
    expect(forno.info.sizes).toBe("100vw");
    expect(forno.pedidos).toEqual(["pizza-margherita-1-960.webp"]);
    expect(forno.erros).toEqual([]);
    const outra = await page.context().newPage();
    await outra.addInitScript(() => localStorage.setItem("loja-consent-v1-trama", JSON.stringify({ choice: "rejected", at: "2026-01-01T00:00:00.000Z", version: "1" })));
    const pesada = await abrir(outra, "/trama/produto/calca-chino", "calca-chino-1");
    expect(pesada.info.current).toBe("calca-chino-1-960.webp");
    expect(pesada.info.srcset).toContain("calca-chino-1-960.webp 900w");
    expect(pesada.pedidos).toEqual(["calca-chino-1-960.webp"]);
    expect(pesada.erros).toEqual([]);
    const leve = await abrir(await page.context().newPage(), "/trama/produto/vestido-midi-linho", "vestido-midi-linho-1");
    expect(leve.info.noPicture).toBe(true);
    expect(leve.info.srcset).toBeNull();
    expect(leve.info.current).toBe("vestido-midi-linho-1.webp");
    expect(leve.pedidos).toEqual(["vestido-midi-linho-1.webp"]);
    expect(leve.erros).toEqual([]);
  });
});

test.describe("celular de densidade 1 (412 × 823)", () => {
  test.use(celular(1));

  test("a variante de 640 px cobre os 380 px de tela: segue sem mudança", async ({ page }) => {
    const { info, pedidos } = await abrir(page, "/arca/produto/portico-inflavel", "portico-inflavel");
    expect(info.current).toBe("portico-inflavel-640.webp");
    expect(pedidos).toEqual(["portico-inflavel-640.webp"]);
  });
});

test.describe("desktop (1280 px)", () => {
  test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });

  test("densidade 1: a variante de 640 px cobre a coluna de 572 px (sem mudança)", async ({ page }) => {
    const { info, pedidos, erros } = await abrir(page, "/arca/produto/portico-inflavel", "portico-inflavel");
    expect(info.current).toBe("portico-inflavel-640.webp");
    expect(info.fonteSrcset).toBe(`${DIR}/portico-inflavel-360.webp 360w, ${DIR}/portico-inflavel-640.webp 640w, ${DIR}/portico-inflavel.webp 1200w`); // telas largas: sem a de 960
    const fonte = await page.locator("picture source").first().getAttribute("sizes");
    expect(fonte).toBe("calc((min(100vw, 75rem) - 3.5rem) / 2)");
    expect(pedidos).toEqual(["portico-inflavel-640.webp"]);
    expect(erros).toEqual([]);
  });

  test("a foto ocupa a coluna esperada (a conta do sizes bate com o layout)", async ({ page }) => {
    await abrir(page, "/arca/produto/portico-inflavel", "portico-inflavel");
    const largura = await page.locator('[role="group"][aria-roledescription="galeria"] ul li').first().evaluate((e) => Math.round(e.getBoundingClientRect().width));
    expect(largura).toBe(572);
  });
});

test.describe("desktop de densidade alta (1280 px, DPR 2)", () => {
  test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

  test("a coluna de 572 px pede 1.144 px físicos: mantém o original, sem perder nitidez (sem mudança)", async ({ page }) => {
    const { info, pedidos } = await abrir(page, "/arca/produto/portico-inflavel", "portico-inflavel");
    expect(info.current).toBe("portico-inflavel.webp");
    expect(info.bytes).toBeGreaterThan(100 * 1024); // o original
    expect(pedidos).toEqual(["portico-inflavel.webp"]);
  });
});
