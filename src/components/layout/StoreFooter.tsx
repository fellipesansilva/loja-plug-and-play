"use client";

import { useConsent } from "@/components/consent/ConsentProvider";
import { StoreLink } from "@/components/store/StoreLink";
import { useDemoStore } from "@/store/demo-store";

const linkClass = "inline-flex min-h-11 items-center underline";

export function StoreFooter() {
  const { name, legal } = useDemoStore((s) => s.config);
  const { reopen } = useConsent();
  return (
    <footer className="mt-xl border-t border-border bg-footer-bg" data-testid="store-footer">
      {/* pb-20: espaço no fim da página para o botão Demo (fixo no canto) não cobrir texto */}
      <div className="mx-auto w-full max-w-5xl px-md pb-20 pt-lg text-sm text-footer-text">
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
          <StoreLink href="/trocas-e-devolucoes" className={linkClass}>
            Trocas e devoluções
          </StoreLink>
          <StoreLink href="/arrependimento" className={linkClass}>
            Desistir da compra
          </StoreLink>
          <StoreLink href="/privacidade" className={linkClass}>
            Política de Privacidade
          </StoreLink>
          <button type="button" onClick={reopen} className={linkClass}>
            Preferências de cookies
          </button>
        </nav>
        <p className="mt-sm">Loja de demonstração — os dados desta identificação são fictícios e nenhum pedido real é processado.</p>
      </div>
    </footer>
  );
}
