export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Storage seguro, com aviso de quando o navegador recusou gravar (ex.: armazenamento cheio). */
export type SafeStorage = StorageLike & {
  /** true se a última gravação no navegador foi recusada: os dados valem só até recarregar. */
  hasWriteFailed(): boolean;
  subscribeWriteFailure(listener: () => void): () => void;
};

/**
 * Wrapper de storage que nunca lança: se o backend (localStorage) estiver
 * indisponível ou lançar exceção, cai para um Map em memória.
 */
export function createSafeStorage(getBackend: () => StorageLike | undefined): SafeStorage {
  const memory = new Map<string, string>();
  const listeners = new Set<() => void>();
  let failed = false;
  const setFailed = (value: boolean) => {
    if (failed === value) return;
    failed = value;
    listeners.forEach((l) => l());
  };

  return {
    hasWriteFailed: () => failed,
    subscribeWriteFailure(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
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
        setFailed(false);
      } catch {
        // mantém apenas em memória e avisa (o painel mostra que o armazenamento do navegador está cheio)
        setFailed(true);
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
