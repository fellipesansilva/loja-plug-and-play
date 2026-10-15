import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

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
