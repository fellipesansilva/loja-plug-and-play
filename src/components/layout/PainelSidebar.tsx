"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { usePathname } from "next/navigation";
import { stripPresetPrefix } from "@/lib/preset-href";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

const saleItems = [
  { href: "/painel/produtos", label: "Produtos" },
  { href: "/painel/pedidos", label: "Pedidos" },
  { href: "/painel/importacao", label: "Importação" },
  { href: "/painel/configuracoes/loja", label: "Configurações" },
];

const quoteItems = saleItems.map((i) => (i.label === "Pedidos" ? { href: "/painel/orcamentos", label: "Orçamentos" } : i));

const settings = [
  { href: "/painel/configuracoes/loja", label: "Loja" },
  { href: "/painel/configuracoes/tema", label: "Tema" },
  { href: "/painel/configuracoes/modulos", label: "Módulos" },
  { href: "/painel/configuracoes/preset", label: "Preset" },
];

/**
 * Menu do painel. No celular vira uma faixa horizontal compacta, com rolagem lateral (o nome da loja já está na tela
 * seguinte e a faixa "Painel de demonstração" identifica o painel); a partir de md é o menu lateral.
 */
export function PainelSidebar() {
  const { slug } = usePreset();
  const pathname = stripPresetPrefix(slug, usePathname());
  const name = useDemoStore((s) => s.config.name);
  // Loja em orçamento: não há pedidos; o menu mostra as solicitações de orçamento no lugar.
  const items = useDemoStore((s) => (s.config.modules.orcamento?.enabled ? quoteItems : saleItems));
  const inSettings = pathname.startsWith("/painel/configuracoes");

  return (
    <aside
      aria-label="Menu lateral do painel"
      className="w-full border-b border-border bg-surface md:w-60 md:shrink-0 md:border-b-0 md:border-r"
    >
      <div className="hidden md:block">
        <p className="px-md pt-md font-heading text-lg font-bold text-primary">{name}</p>
        <p className="px-md text-xs text-muted">Painel administrativo</p>
      </div>
      <nav aria-label="Menu do painel" className="px-sm py-xs md:p-sm">
        <ul className="flex flex-row items-center gap-xs overflow-x-auto [scrollbar-width:none] md:flex-col md:items-stretch md:overflow-visible">
          {items.map((i) => {
            const active = i.label === "Configurações" ? inSettings : pathname.startsWith(i.href);
            return (
              <li key={i.label} className="shrink-0 md:shrink">
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-md px-md ${active ? "bg-primary text-surface" : "text-text hover:bg-background"}`}
                >
                  {i.label}
                </Link>
                {i.label === "Configurações" && inSettings && (
                  <ul className="ml-md mt-xs hidden flex-col gap-xs md:flex">
                    {settings.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="block px-sm py-xs text-sm text-muted hover:text-primary">
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          {inSettings &&
            settings.map((s) => (
              <li key={s.href} className="shrink-0 md:hidden">
                <Link href={s.href} className="flex min-h-11 items-center rounded-md px-sm text-sm text-muted">
                  {s.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
}
