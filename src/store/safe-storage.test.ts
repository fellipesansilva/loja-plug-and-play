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
