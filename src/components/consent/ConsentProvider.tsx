"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { consentKey, parseConsent, serializeConsent, type ConsentChoice } from "@/lib/consent";
import { safeStorage } from "@/store/safe-storage";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";
import { StoreLink } from "@/components/store/StoreLink";

type Consent = {
  /** false até a página hidratar e a escolha gravada ser lida. */
  ready: boolean;
  choice: ConsentChoice | null;
  accept: () => void;
  reject: () => void;
  /** Reabre o aviso (link "Preferências de cookies" do rodapé). */
  reopen: () => void;
};

const ConsentContext = createContext<Consent | null>(null);

const listeners = new Set<() => void>();
const PENDING = "\u0000pending";

export function useConsent(): Consent {
  const c = useContext(ConsentContext);
  if (!c) throw new Error("useConsent precisa estar dentro do ConsentProvider (layout da vitrine).");
  return c;
}

/**
 * PONTO DE CONTROLE dos recursos não essenciais (medição de audiência, pixels, chat, mapas de terceiros...).
 * Qualquer script ou cookie não essencial deve ser renderizado DENTRO deste componente: ele só monta os filhos
 * depois do "Aceitar". Recusado, ou sem escolha ainda, nada é carregado. Hoje a loja não tem nenhum.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { choice } = useConsent();
  return choice === "accepted" ? <>{children}</> : null;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { slug } = usePreset();
  const { notice, version } = useDemoStore((s) => s.config.policies.cookies);
  const key = consentKey(slug);

  // Lido do armazenamento (não do estado do React) para sobreviver a recarregar; no servidor vale PENDING.
  const raw = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => void listeners.delete(onChange);
    },
    () => safeStorage.getItem(key) ?? "",
    () => PENDING,
  );
  const ready = raw !== PENDING;
  const record = ready ? parseConsent(raw, version) : null;
  const [reopened, setReopened] = useState(false);

  const save = useCallback(
    (choice: ConsentChoice) => {
      safeStorage.setItem(key, serializeConsent(choice, version));
      setReopened(false);
      listeners.forEach((l) => l());
    },
    [key, version],
  );

  const value = useMemo<Consent>(
    () => ({
      ready,
      choice: record?.choice ?? null,
      accept: () => save("accepted"),
      reject: () => save("rejected"),
      reopen: () => setReopened(true),
    }),
    [ready, record?.choice, save],
  );

  const visible = ready && (record === null || reopened);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {visible && <CookieBanner notice={notice} current={record?.choice ?? null} onAccept={value.accept} onReject={value.reject} />}
    </ConsentContext.Provider>
  );
}

/** Mesmo tamanho, cor e peso nos dois botões: recusar é tão fácil e tão visível quanto aceitar. */
const choiceButton = "flex min-h-11 flex-1 items-center justify-center rounded-button border border-text bg-surface px-lg font-bold text-text";

function CookieBanner({
  notice,
  current,
  onAccept,
  onReject,
}: {
  notice: string;
  current: ConsentChoice | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Publica a altura do aviso em --cookie-banner-h: elementos fixos da página (barra de compra, botão Demo) sobem
  // com `transform` (que não conta como deslocamento de layout) para o aviso nunca cobrir compra nem carrinho.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--cookie-banner-h", `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--cookie-banner-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Aviso de cookies"
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-md py-md shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-sm md:flex-row md:items-center md:gap-md">
        <p className="flex-1 text-sm text-text">
          {notice}{" "}
          <StoreLink href="/privacidade" className="underline">
            Política de Privacidade
          </StoreLink>
          {current && <span className="sr-only"> Escolha atual: {current === "accepted" ? "aceitou" : "recusou"}.</span>}
        </p>
        <div className="flex gap-sm md:w-80">
          <button type="button" onClick={onReject} className={choiceButton}>
            Recusar
          </button>
          <button type="button" onClick={onAccept} className={choiceButton}>
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
