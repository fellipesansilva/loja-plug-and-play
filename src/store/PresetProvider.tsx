"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { Preset } from "@/domain/types";
import { shouldExposeStore } from "@/lib/expose-store";
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

/** `preset` é o preset base desta loja (os dados originais, entregues pelo servidor); o estado editável fica no store. */
type PresetInfo = { id: string; slug: string; preset: Preset };
const PresetContext = createContext<PresetInfo | null>(null);

/** Preset da rota atual: id, segmento da URL e os dados base. É a única fonte do preset para os componentes. */
export function usePreset(): PresetInfo {
  const preset = useContext(PresetContext);
  if (!preset) throw new Error("usePreset precisa estar dentro do PresetProvider (layout /[preset]).");
  return preset;
}

/**
 * Único ponto por onde o preset chega aos componentes: o layout da rota /[preset] (servidor) lê o preset e passa os dados dele como
 * props (vão no HTML, não no JavaScript); este provider entrega o store e o contexto do preset. O cliente nunca importa o registro com
 * todos os presets: cada loja recebe só os dados do próprio preset. Cada preset tem o seu store e o seu localStorage.
 */
export function PresetProvider({ preset, children }: { preset: Preset; children: ReactNode }) {
  const store = getDemoStore(preset);
  const info = useMemo(() => ({ id: preset.id, slug: preset.shortId, preset }), [preset]);

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
