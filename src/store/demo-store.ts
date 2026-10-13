import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CartLine,
  Category,
  Coupon,
  Order,
  Product,
  StoreConfig,
  ThemeTokens,
} from "@/domain/types";
import { DEFAULT_PRESET_ID, getPreset } from "@/presets";
import { safeStorage } from "./safe-storage";
import { STORAGE_KEY, STORAGE_VERSION } from "./storage-key";

type DemoData = {
  presetId: string;
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  cart: CartLine[];
};

type DemoActions = {
  /** Troca nome, tema, módulos, catálogo e pedidos de uma vez. */
  applyPreset: (id: string) => void;
  /** Restaura tudo ao original do preset ativo. */
  reset: () => void;
  setThemeColor: (key: keyof ThemeTokens["colors"], value: string) => void;
  setStoreName: (name: string) => void;
  /** Soma `qty` à linha do mesmo produto/variante, limitando ao estoque disponível. */
  addToCart: (line: CartLine) => void;
};

export type DemoState = DemoData & DemoActions;

/** Cópia profunda do preset: o estado nunca compartilha referência com os dados-fonte. */
function dataFromPreset(id: string): DemoData {
  const preset = getPreset(id) ?? getPreset(DEFAULT_PRESET_ID)!;
  const clone = structuredClone({
    config: preset.config,
    categories: preset.categories,
    products: preset.products,
    orders: preset.orders,
    coupons: preset.coupons,
  });
  return { presetId: preset.id, ...clone, cart: [] };
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...dataFromPreset(DEFAULT_PRESET_ID),
      applyPreset: (id) => set(dataFromPreset(id)),
      reset: () => set(dataFromPreset(get().presetId)),
      setThemeColor: (key, value) =>
        set((s) => ({
          config: {
            ...s.config,
            theme: { ...s.config.theme, colors: { ...s.config.theme.colors, [key]: value } },
          },
        })),
      setStoreName: (name) => set((s) => ({ config: { ...s.config, name } })),
      addToCart: ({ productId, variantId, qty }) =>
        set((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product || qty < 1) return {};
          const stock = variantId
            ? (product.variants.find((v) => v.id === variantId)?.stock ?? 0)
            : product.stock;
          const same = (l: CartLine) => l.productId === productId && l.variantId === variantId;
          const current = s.cart.find(same)?.qty ?? 0;
          const next = Math.min(current + qty, stock);
          if (next <= current) return {};
          const lines = s.cart.filter((l) => !same(l));
          return { cart: [...lines, { productId, variantId, qty: next }] };
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      // Formato antigo é descartado (cai no preset padrão) em vez de quebrar a vitrine.
      migrate: () => ({}) as DemoState,
      storage: createJSONStorage(() => safeStorage),
      // Hidratação manual (no cliente, após montar) para evitar mismatch com o SSR.
      skipHydration: true,
      partialize: ({ presetId, config, categories, products, orders, coupons, cart }) => ({
        presetId, config, categories, products, orders, coupons, cart,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<DemoData> | undefined;
        if (!saved?.presetId || !getPreset(saved.presetId) || !saved.config) return current;
        return { ...current, ...saved };
      },
    },
  ),
);
