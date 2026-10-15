import { create } from "zustand";
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
import { ACTIVE_PRESET_ID, getPreset } from "@/presets";
import { addLine, removeLine, setLineQty, type AddToCartInput } from "@/lib/cart";
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
  /** Cupom, CEP e entrega escolhidos no carrinho. */
  checkout: CheckoutDraft;
};

type DemoActions = {
  /** Restaura tudo ao original do preset desta loja (o preset é definido no build, não troca em tempo de execução). */
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
  const preset = getPreset(id) ?? getPreset(ACTIVE_PRESET_ID)!;
  const clone = structuredClone({
    config: preset.config,
    categories: preset.categories,
    products: preset.products,
    orders: preset.orders,
    coupons: preset.coupons,
  });
  return { presetId: preset.id, ...clone, cart: [], checkout: { ...EMPTY_CHECKOUT } };
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...dataFromPreset(ACTIVE_PRESET_ID),
      reset: () => set(dataFromPreset(ACTIVE_PRESET_ID)),
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
      name: STORAGE_KEY,
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
        if (saved?.presetId !== ACTIVE_PRESET_ID || !saved.config) return current;
        return { ...current, ...saved };
      },
    },
  ),
);
