export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/**
 * Wrapper de storage que nunca lança: se o backend (localStorage) estiver
 * indisponível ou lançar exceção, cai para um Map em memória.
 */
export function createSafeStorage(getBackend: () => StorageLike | undefined): StorageLike {
  const memory = new Map<string, string>();

  return {
    getItem(key) {
      try {
        const value = getBackend()?.getItem(key);
        if (value !== undefined) return value;
      } catch {
        // cai para memória
      }
      return memory.get(key) ?? null;
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        getBackend()?.setItem(key, value);
      } catch {
        // mantém apenas em memória
      }
    },
    removeItem(key) {
      memory.delete(key);
      try {
        getBackend()?.removeItem(key);
      } catch {
        // ignora
      }
    },
  };
}

export const safeStorage = createSafeStorage(() =>
  typeof window === "undefined" ? undefined : window.localStorage,
);
