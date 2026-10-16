import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { STORE_ROUTES } from "@/lib/store-routes";
import { config, proxy } from "./proxy";

function call(path: string) {
  const res = proxy(new NextRequest(`http://localhost:3411${path}`));
  const loc = res.headers.get("location");
  return { status: res.status, to: loc ? loc.replace("http://localhost:3411", "") : null };
}

describe("redirecionamentos legados (proxy)", () => {
  it("/ vai para o preset padrão", () => expect(call("/")).toEqual({ status: 308, to: "/trama" }));
  it("/?preset=forno vai para /forno", () => expect(call("/?preset=forno")).toEqual({ status: 308, to: "/forno" }));
  it("mantém o caminho e os outros parâmetros", () => {
    expect(call("/produto/pizza-margherita?preset=forno")).toEqual({ status: 308, to: "/forno/produto/pizza-margherita" });
    expect(call("/busca?q=a&preset=FORNO&ordem=x")).toEqual({ status: 308, to: "/forno/busca?q=a&ordem=x" });
  });
  it("caminho da loja sem preset vai para o padrão", () => {
    expect(call("/carrinho")).toEqual({ status: 308, to: "/trama/carrinho" });
    expect(call("/painel/produtos")).toEqual({ status: 308, to: "/trama/painel/produtos" });
  });
  it("preset desconhecido na query cai no padrão", () => expect(call("/?preset=orbita")).toEqual({ status: 308, to: "/trama" }));
  it("rotas já prefixadas passam; desconhecidas passam para o 404", () => {
    expect(call("/forno/carrinho").status).toBe(200);
    expect(call("/orbita").status).toBe(200);
    expect(call("/xyz").status).toBe(200);
  });
  it("/trama?preset=forno tira o parâmetro redundante", () => expect(call("/trama?preset=forno")).toEqual({ status: 308, to: "/trama" }));
});

describe("onde o proxy roda (matcher)", () => {
  const runs = (url: string) => unstable_doesMiddlewareMatch({ config, url: `http://localhost:3411${url}` });

  it("roda onde pode redirecionar: /, rotas da loja sem preset e qualquer caminho com ?preset=", () => {
    for (const url of ["/", "/?preset=forno", "/carrinho", "/produto/pizza-margherita", "/produto/pizza-margherita?preset=forno", "/painel/produtos", "/busca?q=a&preset=forno", "/trama?preset=forno", "/forno/carrinho?preset=forno"]) {
      expect(runs(url), url).toBe(true);
    }
  });

  it("cada rota de STORE_ROUTES está no matcher (a lista do matcher repete a de store-routes.ts)", () => {
    for (const route of STORE_ROUTES) {
      expect(runs(`/${route}`), route).toBe(true);
      expect(runs(`/${route}/x`), route).toBe(true);
    }
  });

  it("não roda nas páginas de preset, nos arquivos estáticos nem nas imagens", () => {
    for (const url of ["/trama", "/forno", "/arca", "/forno/categoria/pizzas", "/arca/produto/saco-para-teste-de-carga", "/arca/setor/agro", "/trama/carrinho?x=1", "/images/presets/arca-inflaveis/banner-m-768.avif", "/fonts/arca/barlow-400.woff2", "/_next/static/chunks/a.js", "/favicon.ico", "/placeholder?l=x"]) {
      expect(runs(url), url).toBe(false);
    }
  });

  it("caminhos desconhecidos sem ?preset= (/orbita, /xyz) não passam pelo proxy e caem no 404 da rota", () => {
    expect(runs("/orbita")).toBe(false);
    expect(runs("/xyz")).toBe(false);
  });

  it("com ?preset= o proxy roda também em arquivos? não: .ext fica de fora", () => {
    expect(runs("/images/a.avif?preset=forno")).toBe(false);
  });
});
