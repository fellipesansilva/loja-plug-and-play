"use client";

import { useConsent } from "@/components/consent/ConsentProvider";
import { NewsletterSlot } from "@/components/extras/ExtraSlots";
import { StoreLink } from "@/components/store/StoreLink";
import { useDemoStore } from "@/store/demo-store";

const linkClass = "inline-flex min-h-11 items-center underline";

export function StoreFooter() {
  const { name, legal } = useDemoStore((s) => s.config);
  const quote = useDemoStore((s) => s.config.modules.orcamento?.enabled === true);
  const { reopen } = useConsent();
  return (
    <footer className="mt-xl border-t border-border bg-footer-bg" data-testid="store-footer">
      {/* pb-20: espaço no fim da página para o botão Demo (fixo no canto) não cobrir texto */}
      <div className="mx-auto w-full max-w-page px-md pb-20 pt-lg text-sm text-footer-text">
        <NewsletterSlot />
        <p className="font-bold" data-testid="footer-name">
          {legal.name || name}
        </p>
        <p data-testid="footer-document">{legal.document}</p>
        <p data-testid="footer-address">{legal.address}</p>
        <p>
          <a href={`mailto:${legal.email}`} className="inline-flex min-h-6 items-center underline" data-testid="footer-email">
            {legal.email}
          </a>
          {" · "}
          <span data-testid="footer-phone">{legal.phone}</span>
        </p>
        <nav aria-label="Informações da loja" className="mt-sm flex flex-wrap gap-x-md">
          <StoreLink href="/sobre" className={linkClass}>
            Sobre
          </StoreLink>
          {quote ? (
            <StoreLink href="/condicoes-comerciais" className={linkClass}>
              Condições comerciais
            </StoreLink>
          ) : (
            <>
              <StoreLink href="/trocas-e-devolucoes" className={linkClass}>
                Trocas e devoluções
              </StoreLink>
              <StoreLink href="/arrependimento" className={linkClass}>
                Desistir da compra
              </StoreLink>
            </>
          )}
          <StoreLink href="/privacidade" className={linkClass}>
            Política de Privacidade
          </StoreLink>
          <button type="button" onClick={reopen} className={linkClass}>
            Preferências de cookies
          </button>
        </nav>
        <p className="mt-sm">Loja de demonstração — os dados desta identificação são fictícios e nenhum {quote ? "pedido de orçamento" : "pedido"} real é processado.</p>
      </div>
    </footer>
  );
}
