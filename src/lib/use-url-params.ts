"use client";

import { useMemo, useSyncExternalStore } from "react";

const EVENT = "loja:urlchange";

/** Avisa quem lê a URL que ela mudou por history.replaceState (que não dispara evento nenhum). */
export function notifyUrlChange(): void {
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
};

/**
 * Parâmetros da URL lidos no navegador, sem useSearchParams. O useSearchParams obriga a página a esperar um Suspense, e a
 * página sai do servidor só com o aviso "Carregando…" (o rodapé pula quando o conteúdo chega: CLS). Com este hook o servidor
 * entrega a página completa, sem filtros, e os filtros da URL entram logo após a hidratação.
 */
export function useUrlSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}
