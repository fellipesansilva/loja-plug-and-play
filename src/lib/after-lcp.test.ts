import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { afterLcpStore, resetAfterLcpForTests } from "./after-lcp";

type Listener = () => void;

/** <img> mínima: `complete` e os ouvintes de load/error. */
function fakeImg(complete: boolean) {
  const handlers: Record<string, Listener[]> = {};
  return {
    complete,
    addEventListener: (name: string, fn: Listener) => {
      (handlers[name] ??= []).push(fn);
    },
    fire: (name: string) => (handlers[name] ?? []).forEach((fn) => fn()),
  };
}

function setup(img: ReturnType<typeof fakeImg> | null) {
  vi.useFakeTimers();
  vi.stubGlobal("document", { querySelector: (sel: string) => (sel === 'img[fetchpriority="high"]' ? img : null) });
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => setTimeout(fn, 16));
  resetAfterLcpForTests();
}

describe("portão depois do LCP (fotos dos cards, fontes e ferramentas esperam a foto principal)", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    resetAfterLcpForTests();
  });

  it("começa fechado; só abre depois do load da foto principal e de dois quadros", () => {
    const img = fakeImg(false);
    setup(img);
    const opened = vi.fn();
    afterLcpStore.subscribe(opened);
    expect(afterLcpStore.getSnapshot()).toBe(false);
    vi.advanceTimersByTime(3000); // a foto ainda não terminou: continua fechado
    expect(afterLcpStore.getSnapshot()).toBe(false);
    img.fire("load");
    expect(afterLcpStore.getSnapshot()).toBe(false); // ainda faltam os quadros de pintura
    vi.advanceTimersByTime(40);
    expect(afterLcpStore.getSnapshot()).toBe(true);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it("foto principal que já estava carregada na hidratação: abre depois de dois quadros", () => {
    setup(fakeImg(true));
    afterLcpStore.subscribe(() => {});
    expect(afterLcpStore.getSnapshot()).toBe(false);
    vi.advanceTimersByTime(40);
    expect(afterLcpStore.getSnapshot()).toBe(true);
  });

  it("página sem foto principal (carrinho, checkout): abre na hidratação, sem esperar nada", () => {
    setup(null);
    afterLcpStore.subscribe(() => {});
    vi.advanceTimersByTime(40);
    expect(afterLcpStore.getSnapshot()).toBe(true);
  });

  it("foto com erro também libera; e um limite de 5 s libera se a foto nunca termina", () => {
    const comErro = fakeImg(false);
    setup(comErro);
    afterLcpStore.subscribe(() => {});
    comErro.fire("error");
    vi.advanceTimersByTime(40);
    expect(afterLcpStore.getSnapshot()).toBe(true);

    vi.unstubAllGlobals();
    resetAfterLcpForTests();
    setup(fakeImg(false));
    afterLcpStore.subscribe(() => {});
    vi.advanceTimersByTime(4900);
    expect(afterLcpStore.getSnapshot()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(afterLcpStore.getSnapshot()).toBe(true);
  });

  it("depois de aberto continua aberto (navegar dentro da loja não espera de novo)", () => {
    setup(null);
    afterLcpStore.subscribe(() => {});
    vi.advanceTimersByTime(40);
    afterLcpStore.subscribe(() => {});
    expect(afterLcpStore.getSnapshot()).toBe(true);
  });
});
