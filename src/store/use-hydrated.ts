"use client";

import { useSyncExternalStore } from "react";
import { useDemoStore } from "./demo-store";

/**
 * true depois que o estado salvo (localStorage) foi aplicado ao store. Até lá o store tem o preset padrão,
 * então telas que podem "não achar" um item (produto, categoria) devem esperar este sinal.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDemoStore.persist.onFinishHydration(onChange),
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}
