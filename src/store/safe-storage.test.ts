import { describe, expect, it } from "vitest";
import { createSafeStorage, type StorageLike } from "./safe-storage";

function fakeBackend(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const throwing: StorageLike = {
  getItem() {
    throw new Error("indisponível");
  },
  setItem() {
    throw new Error("indisponível");
  },
  removeItem() {
    throw new Error("indisponível");
  },
};

describe("safe-storage", () => {
  it("usa o backend quando funciona", () => {
    const backend = fakeBackend();
    const s = createSafeStorage(() => backend);
    s.setItem("a", "1");
    expect(backend.data.get("a")).toBe("1");
    expect(s.getItem("a")).toBe("1");
    expect(s.getItem("inexistente")).toBeNull();
    s.removeItem("a");
    expect(backend.data.has("a")).toBe(false);
  });

  it("cai em memória quando getItem/setItem lançam exceção", () => {
    const s = createSafeStorage(() => throwing);
    expect(() => s.setItem("a", "1")).not.toThrow();
    expect(s.getItem("a")).toBe("1");
    expect(() => s.removeItem("a")).not.toThrow();
    expect(s.getItem("a")).toBeNull();
  });

  it("cai em memória quando o acesso ao backend lança (ex.: SecurityError)", () => {
    const s = createSafeStorage(() => {
      throw new Error("SecurityError");
    });
    s.setItem("k", "v");
    expect(s.getItem("k")).toBe("v");
  });

  it("funciona sem backend (SSR)", () => {
    const s = createSafeStorage(() => undefined);
    s.setItem("k", "v");
    expect(s.getItem("k")).toBe("v");
  });
});

describe("aviso de gravação recusada", () => {
  it("marca a falha quando o navegador recusa gravar, avisa quem assina e limpa na próxima gravação que der certo", () => {
    let full = true;
    const backend: StorageLike = {
      getItem: () => null,
      setItem: () => {
        if (full) throw new DOMException("cheio", "QuotaExceededError");
      },
      removeItem: () => {},
    };
    const s = createSafeStorage(() => backend);
    let calls = 0;
    const off = s.subscribeWriteFailure(() => calls++);
    expect(s.hasWriteFailed()).toBe(false);
    s.setItem("k", "v");
    expect(s.hasWriteFailed()).toBe(true);
    expect(calls).toBe(1);
    full = false;
    s.setItem("k", "v2");
    expect(s.hasWriteFailed()).toBe(false);
    expect(calls).toBe(2);
    off();
    full = true;
    s.setItem("k", "v3");
    expect(calls).toBe(2);
  });
});
