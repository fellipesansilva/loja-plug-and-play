"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { shouldExposeStore } from "@/lib/expose-store";
import { getPreset } from "@/presets";
import { StoreContext, getDemoStore, type DemoStore } from "./demo-store";

declare global {
  interface Window {
    /** Store da loja atual; exposto apenas fora de produção (ou com NEXT_PUBLIC_EXPOSE_STORE=1) para testes E2E. */
    __demoStore?: DemoStore;
  }
}

const EXPOSE_STORE = shouldExposeStore({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_EXPOSE_STORE: process.env.NEXT_PUBLIC_EXPOSE_STORE,
});

type PresetInfo = { id: string; slug: string };
const PresetContext = createContext<PresetInfo | null>(null);

/** Preset da rota atual: id e segmento da URL. É a única fonte do preset para os componentes. */
export function usePreset(): PresetInfo {
  const preset = useContext(PresetContext);
  if (!preset) throw new Error("usePreset precisa estar dentro do PresetProvider (layout /[preset]).");
  return preset;
}

/**
 * Único ponto por onde o preset chega aos componentes: o layout da rota /[preset] passa o id do segmento e este
 * provider entrega o store e o contexto do preset. Cada preset tem o seu store e o seu localStorage.
 */
export function PresetProvider({ presetId, children }: { presetId: string; children: ReactNode }) {
  const preset = getPreset(presetId);
  if (!preset) throw new Error(`Preset desconhecido: ${presetId}`);
  const store = getDemoStore(preset.id);
  const info = useMemo(() => ({ id: preset.id, slug: preset.shortId }), [preset.id, preset.shortId]);

  useEffect(() => {
    if (EXPOSE_STORE) window.__demoStore = store;
    // Hidratação manual (no cliente, após montar) do estado salvo desta loja (carrinho, pedidos, edições).
    void Promise.resolve(store.persist.rehydrate()).then(() => store.getState().loadOverrides());
    return () => {
      if (window.__demoStore === store) delete window.__demoStore;
    };
  }, [store]);

  return (
    <PresetContext.Provider value={info}>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </PresetContext.Provider>
  );
}
