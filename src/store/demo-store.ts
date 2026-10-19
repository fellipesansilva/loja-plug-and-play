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
  Preset,
  Product,
  QuoteContact,
  QuoteListItem,
  QuoteRequest,
  QuoteStatus,
  StoreConfig,
  ThemeTokens,
} from "@/domain/types";
import { applyStatus, isValidTransition, withHistory } from "@/lib/order-status";
import { addToList, clampNote, clampQty, makeProtocol } from "@/lib/quote";
import { addConfiguredToList, normalizeQuoteList } from "@/lib/quote-list";
import { applyQuoteStatus, isValidQuoteTransition } from "@/lib/quote-status";
import { evaluateRegret, type RegretResult } from "@/lib/regret";
import { addLine, removeLine, setLineQty, type AddToCartInput } from "@/lib/cart";
import { CONFIG_VERSION, applyOverrides, configKeyFor, emptyOverrides, migrateOverrides, type StoreOverrides } from "@/lib/store-config";
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
  /** Modo orçamento: a lista do visitante e as solicitações enviadas (exemplos do preset + feitas na demo, da mais recente à mais antiga). */
  quoteList: QuoteListItem[];
  quotes: QuoteRequest[];
  /** Configuração salva no painel (tema, módulos, dados da loja, políticas). Vive na chave própria `loja-config-v1-<preset>`, não no estado de demonstração. */
  overrides: StoreOverrides;
};

type DemoActions = {
  /** Restaura tudo ao original do preset desta loja (inclusive a configuração salva no painel). */
  reset: () => void;
  /** Grava a configuração do painel na chave própria e passa a usá-la na loja na hora (sem recarregar). */
  saveOverrides: (next: StoreOverrides) => void;
  /** Lê a configuração salva (migrando o formato antigo) e a aplica; chamado depois da hidratação do estado. */
  loadOverrides: () => void;
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
  /** Muda o status sem checar a transição (usado pelo painel Demo: "Simular pagamento aprovado"); entra no histórico. */
  /** Cria o produto ou, se já existe um com o mesmo id, substitui (painel: formulário de produto). */
  saveProduct: (product: Product) => void;
  /** Cria ou substitui vários produtos de uma vez, pelo id (painel: importação CSV). */
  upsertProducts: (products: Product[]) => void;
  /** Inativo some da loja, mas continua no painel. */
  setProductActive: (productId: string, active: boolean) => void;
  setOrderStatus: (orderId: string, status: OrderStatus, now?: Date) => void;
  /** Modo orçamento: lista de orçamento do visitante. */
  addToQuote: (productId: string, qty?: number) => void;
  /** Item configurado (pórtico com a marca, reservatório dimensionado). Observação acima de 500 caracteres: recusa e devolve a mensagem. */
  addConfiguredToQuote: (productId: string, note: string, qty?: number) => { ok: true } | { ok: false; error: string };
  /** `id` é o da linha da lista: o do produto nos itens comuns, "<produto>#n" nos configurados. */
  setQuoteQty: (id: string, qty: number) => void;
  setQuoteNote: (id: string, note: string) => void;
  removeFromQuote: (id: string) => void;
  /** Envia a lista: gera o protocolo, grava a solicitação (itens + contato), esvazia a lista e devolve a solicitação. Lista vazia: null. */
  submitQuote: (contact: QuoteContact, now?: Date) => QuoteRequest | null;
  /** Mudança de status de uma solicitação (só a próxima etapa ou "perdido" permitido). Devolve se mudou. */
  changeQuoteStatus: (id: string, status: QuoteStatus, now?: Date) => boolean;
  /** Mudança de status do painel: só vale a próxima etapa ou o cancelamento permitido. Devolve se mudou. */
  changeOrderStatus: (orderId: string, status: OrderStatus, now?: Date) => boolean;
  /** Pedido de arrependimento (simulado): dentro do prazo do preset, grava o protocolo e muda o status para "cancelado". */
  requestRegret: (orderId: string, email: string, now?: Date) => RegretResult;
};

export const EMPTY_CHECKOUT: CheckoutDraft = { couponCode: null, cep: "", shippingId: null };

export type DemoState = DemoData & DemoActions;

/** Cópia profunda do preset: o estado nunca compartilha referência com os dados-fonte. */
function dataFromPreset(preset: Preset): DemoData {
  const clone = structuredClone({
    config: preset.config,
    categories: preset.categories,
    products: preset.products,
    orders: preset.orders,
    coupons: preset.coupons,
  });
  return {
    presetId: preset.id,
    ...clone,
    orders: clone.orders.map(withHistory),
    cart: [],
    checkout: { ...EMPTY_CHECKOUT },
    quoteList: [],
    quotes: structuredClone(preset.quotes ?? []),
    overrides: emptyOverrides(),
  };
}

/**
 * Um store por preset: cada loja (/trama, /forno…) tem o seu, com os dados do preset e o estado salvo na chave dela.
 * O preset chega aos componentes por um único ponto, o PresetProvider do layout da rota.
 */
export function createDemoStore(preset: Preset) {
  return createStore<DemoState>()(
  persist(
    (set, get) => ({
      ...dataFromPreset(preset),
      reset: () => {
        safeStorage.removeItem(configKeyFor(preset.shortId));
        set(dataFromPreset(preset));
      },
      saveOverrides: (next) => {
        safeStorage.setItem(configKeyFor(preset.shortId), JSON.stringify(next));
        set((s) => ({ overrides: next, config: applyOverrides(preset, s.config, next) }));
      },
      loadOverrides: () => {
        let raw: unknown = null;
        try {
          const text = safeStorage.getItem(configKeyFor(preset.shortId));
          raw = text ? JSON.parse(text) : null;
        } catch {
          raw = null;
        }
        const ov = migrateOverrides(raw, preset.config.themeChoices);
        if (!ov) return;
        if ((raw as { version?: number }).version !== CONFIG_VERSION) safeStorage.setItem(configKeyFor(preset.shortId), JSON.stringify(ov));
        set((s) => ({ overrides: ov, config: applyOverrides(preset, s.config, ov) }));
      },
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
        set((s) => ({ orders: [withHistory(order), ...s.orders], cart: [], checkout: { ...EMPTY_CHECKOUT } })),
      saveProduct: (product) => get().upsertProducts([product]),
      upsertProducts: (list) =>
        set((s) => {
          const byId = new Map(list.map((p) => [p.id, p]));
          const replaced = s.products.map((p) => byId.get(p.id) ?? p);
          const known = new Set(s.products.map((p) => p.id));
          return { products: [...replaced, ...list.filter((p) => !known.has(p.id))] };
        }),
      setProductActive: (productId, active) =>
        set((s) => ({ products: s.products.map((p) => (p.id === productId ? { ...p, active } : p)) })),
      setOrderStatus: (orderId, status, now = new Date()) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? applyStatus(o, status, now) : o)) })),
      changeOrderStatus: (orderId, status, now = new Date()) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || !isValidTransition(order, status)) return false;
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? applyStatus(o, status, now) : o)) }));
        return true;
      },
      addToQuote: (productId, qty = 1) => set((s) => ({ quoteList: addToList(s.quoteList, productId, qty) })),
      addConfiguredToQuote: (productId, note, qty = 1) => {
        const r = addConfiguredToList(get().quoteList, productId, note, qty);
        if (!r.ok) return { ok: false, error: r.error };
        set({ quoteList: r.list });
        return { ok: true };
      },
      setQuoteQty: (id, qty) => set((s) => ({ quoteList: s.quoteList.map((i) => (i.id === id ? { ...i, qty: clampQty(qty) } : i)) })),
      setQuoteNote: (id, note) => set((s) => ({ quoteList: s.quoteList.map((i) => (i.id === id ? { ...i, note: clampNote(note) } : i)) })),
      removeFromQuote: (id) => set((s) => ({ quoteList: s.quoteList.filter((i) => i.id !== id) })),
      submitQuote: (contact, now = new Date()) => {
        const { quoteList, products, quotes } = get();
        const items = quoteList.flatMap((i) => {
          const p = products.find((x) => x.id === i.productId);
          return p ? [{ productId: p.id, name: p.name, sku: p.sku, qty: i.qty, note: i.note }] : [];
        });
        if (items.length === 0) return null;
        const request: QuoteRequest = {
          id: makeProtocol(now, new Set(quotes.map((q) => q.id))),
          createdAt: now.toISOString(),
          status: "nova",
          items,
          contact,
          history: [{ status: "nova", at: now.toISOString() }],
        };
        set((s) => ({ quotes: [request, ...s.quotes], quoteList: [] }));
        return request;
      },
      changeQuoteStatus: (id, status, now = new Date()) => {
        const q = get().quotes.find((x) => x.id === id);
        if (!q || !isValidQuoteTransition(q.status, status)) return false;
        set((s) => ({ quotes: s.quotes.map((x) => (x.id === id ? applyQuoteStatus(x, status, now) : x)) }));
        return true;
      },
      requestRegret: (orderId, email, now = new Date()) => {
        const { orders, config } = get();
        const result = evaluateRegret(orders, orderId, email, config.policies.regretDays ?? 0, now);
        if (result.kind === "ok") {
          const regret = { protocol: result.protocol, requestedAt: now.toISOString() };
          set((s) => ({
            orders: s.orders.map((o) => (o.id === result.orderId ? { ...applyStatus(o, "cancelado", now), regret } : o)),
          }));
        }
        return result;
      },
    }),
    {
      name: storageKeyFor(preset.shortId),
      version: STORAGE_VERSION,
      // v5 → v6 (histórico de status, produto ativo/inativo, rótulo de retirada): pedidos, catálogo, carrinho e cupons são
      // mantidos; a config volta a ser a do preset (que ganhou campos), preservando o nome e o tema editados.
      // Qualquer outro formato antigo é descartado (cai no preset padrão) em vez de quebrar a vitrine.
      migrate: (persisted, version) => migrateState(persisted, version, preset) as DemoState,
      storage: createJSONStorage(() => safeStorage),
      // Hidratação manual (no cliente, após montar) para evitar mismatch com o SSR.
      skipHydration: true,
      partialize: ({ presetId, config, categories, products, orders, coupons, cart, checkout, quoteList, quotes }) => ({
        presetId, config, categories, products, orders, coupons, cart, checkout, quoteList, quotes,
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
export function getDemoStore(preset: Preset): DemoStore {
  let store = stores.get(preset.id);
  if (!store) {
    store = createDemoStore(preset);
    stores.set(preset.id, store);
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

/**
 * Migração do estado salvo (exportada para teste). Devolve {} para formatos que não dá para aproveitar.
 * v5/v6 → v7: histórico dos pedidos, lista e solicitações de orçamento. v7 → v8: blocos de segmento e produtos novos da loja em orçamento.
 * v8 → v9: ferramentas do orçamento (config.orcamentoBlocks) e itens da lista com `id` e `configurado` (id = productId, configurado = false).
 */
export function migrateState(persisted: unknown, version: number, current: Preset): Partial<DemoData> {
  const saved = persisted as Partial<DemoData> | undefined;
  if (!saved || saved.presetId !== current.id || !saved.config) return {};
  const quoteStore = current.config.modules.orcamento?.enabled === true;
  const refreshedConfig = () => ({ ...structuredClone(current.config), name: saved.config!.name, theme: saved.config!.theme });
  let state: Partial<DemoData>;
  if (version === 8) {
    // Loja de venda: o estado segue como está. Loja em orçamento: só acrescenta as ferramentas (config.orcamentoBlocks) à config salva;
    // produtos, categorias, solicitações e o que foi editado no painel ficam como estão.
    state = quoteStore ? { ...saved, config: { ...saved.config, orcamentoBlocks: structuredClone(current.config.orcamentoBlocks) } } : saved;
  } else if (version === 7) {
    state = quoteStore
      ? { ...saved, config: refreshedConfig(), categories: structuredClone(current.categories), products: structuredClone(current.products) }
      : saved;
  } else if (version === 5 || version === 6) {
    state = {
      ...saved,
      config: refreshedConfig(),
      orders: (saved.orders ?? []).map(withHistory),
      quotes: saved.quotes ?? structuredClone(current.quotes ?? []),
    };
  } else {
    return {};
  }
  return { ...state, quoteList: normalizeQuoteList(state.quoteList) };
}
