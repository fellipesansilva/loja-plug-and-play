"use client";

import { useSyncExternalStore } from "react";
import { useDemoStoreApi } from "./demo-store";

/**
 * true depois que o estado salvo (localStorage) foi aplicado ao store. Até lá o store tem o preset padrão,
 * então telas que podem "não achar" um item (produto, categoria) devem esperar este sinal.
 */
export function useHydrated(): boolean {
  const { persist } = useDemoStoreApi();
  return useSyncExternalStore(
    (onChange) => persist.onFinishHydration(onChange),
    () => persist.hasHydrated(),
    () => false,
  );
}
