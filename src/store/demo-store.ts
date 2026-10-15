"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CartLine,
  Category,
  CheckoutDraft,
  Coupon,
  Order,
  OrderStatus,
  Product,
  StoreConfig,
  ThemeTokens,
} from "@/domain/types";
import { getPreset } from "@/presets";
import { addLine, removeLine, setLineQty, type AddToCartInput } from "@/lib/cart";
import { safeStorage } from "./safe-storage";
import { STORAGE_VERSION, storageKeyFor } from "./storage-key";

type DemoData = {
  presetId: string;
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  cart: CartLine[];
  /** Cupom, CEP e entrega escolhidos no carrinho. */
  checkout: CheckoutDraft;
};

type DemoActions = {
  /** Restaura tudo ao original do preset desta loja. */
  reset: () => void;
  setThemeColor: (key: keyof ThemeTokens["colors"], value: string) => void;
  setStoreName: (name: string) => void;
  /** Soma à linha com o mesmo lineId (produto + variante + adicionais) ou cria uma nova; respeita o estoque. */
  addToCart: (input: AddToCartInput) => void;
  setLineQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  /** Aplica (ou, com null, remove) o cupom do carrinho. */
  setCoupon: (code: string | null) => void;
  setShipping: (cep: string, shippingId: string | null) => void;
  /** Grava o pedido e zera o carrinho e as escolhas do checkout. */
  placeOrder: (order: Order) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
};

export const EMPTY_CHECKOUT: CheckoutDraft = { couponCode: null, cep: "", shippingId: null };

export type DemoState = DemoData & DemoActions;

/** Cópia profunda do preset: o estado nunca compartilha referência com os dados-fonte. */
function dataFromPreset(id: string): DemoData {
  const preset = getPreset(id);
  if (!preset) throw new Error(`Preset desconhecido: ${id}`);
  const clone = structuredClone({
    config: preset.config,
    categories: preset.categories,
    products: preset.products,
    orders: preset.orders,
    coupons: preset.coupons,
  });
  return { presetId: preset.id, ...clone, cart: [], checkout: { ...EMPTY_CHECKOUT } };
}

/**
 * Um store por preset: cada loja (/trama, /forno…) tem o seu, com os dados do preset e o estado salvo na chave dela.
 * O preset chega aos componentes por um único ponto, o PresetProvider do layout da rota.
 */
export function createDemoStore(presetId: string) {
  const preset = getPreset(presetId);
  if (!preset) throw new Error(`Preset desconhecido: ${presetId}`);
  return createStore<DemoState>()(
  persist(
    (set) => ({
      ...dataFromPreset(preset.id),
      reset: () => set(dataFromPreset(preset.id)),
      setThemeColor: (key, value) =>
        set((s) => ({
          config: {
            ...s.config,
            theme: { ...s.config.theme, colors: { ...s.config.theme.colors, [key]: value } },
          },
        })),
      setStoreName: (name) => set((s) => ({ config: { ...s.config, name } })),
      addToCart: (input) => set((s) => ({ cart: addLine(s.cart, s.products, input) })),
      setLineQty: (lineId, qty) => set((s) => ({ cart: setLineQty(s.cart, s.products, lineId, qty) })),
      removeLine: (lineId) =>
        set((s) => {
          const cart = removeLine(s.cart, lineId);
          return { cart, checkout: cart.length ? s.checkout : { ...EMPTY_CHECKOUT } };
        }),
      setCoupon: (code) => set((s) => ({ checkout: { ...s.checkout, couponCode: code } })),
      setShipping: (cep, shippingId) => set((s) => ({ checkout: { ...s.checkout, cep, shippingId } })),
      placeOrder: (order) =>
        set((s) => ({ orders: [order, ...s.orders], cart: [], checkout: { ...EMPTY_CHECKOUT } })),
      setOrderStatus: (orderId, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) })),
    }),
    {
      name: storageKeyFor(preset.shortId),
      version: STORAGE_VERSION,
      // Formato antigo é descartado (cai no preset padrão) em vez de quebrar a vitrine.
      migrate: () => ({}) as DemoState,
      storage: createJSONStorage(() => safeStorage),
      // Hidratação manual (no cliente, após montar) para evitar mismatch com o SSR.
      skipHydration: true,
      partialize: ({ presetId, config, categories, products, orders, coupons, cart, checkout }) => ({
        presetId, config, categories, products, orders, coupons, cart, checkout,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<DemoData> | undefined;
        // Estado salvo de outro preset (não deveria existir: a chave é por loja) é ignorado.
        if (saved?.presetId !== preset.id || !saved.config) return current;
        return { ...current, ...saved };
      },
    },
  ),
  );
}

export type DemoStore = ReturnType<typeof createDemoStore>;

const stores = new Map<string, DemoStore>();

/** Store do preset (criado uma vez por preset e reaproveitado; no servidor serve só para renderizar a página estática). */
export function getDemoStore(presetId: string): DemoStore {
  let store = stores.get(presetId);
  if (!store) {
    store = createDemoStore(presetId);
    stores.set(presetId, store);
  }
  return store;
}

export const StoreContext = createContext<DemoStore | null>(null);

/** Store da loja que está na tela (a do preset da rota). */
export function useDemoStoreApi(): DemoStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useDemoStore precisa estar dentro do PresetProvider (layout /[preset]).");
  return store;
}

/** Seleciona uma parte do estado da loja atual. */
export function useDemoStore<T>(selector: (state: DemoState) => T): T {
  return useStore(useDemoStoreApi(), selector);
}
