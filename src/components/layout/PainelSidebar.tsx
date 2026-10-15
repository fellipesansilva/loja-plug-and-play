"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { usePathname } from "next/navigation";
import { stripPresetPrefix } from "@/lib/preset-href";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

const items = [
  { href: "/painel/produtos", label: "Produtos" },
  { href: "/painel/pedidos", label: "Pedidos" },
  { href: "/painel/importacao", label: "Importação" },
  { href: "/painel/configuracoes/loja", label: "Configurações" },
];

const settings = [
  { href: "/painel/configuracoes/loja", label: "Loja" },
  { href: "/painel/configuracoes/tema", label: "Tema" },
  { href: "/painel/configuracoes/modulos", label: "Módulos" },
  { href: "/painel/configuracoes/preset", label: "Preset" },
];

export function PainelSidebar() {
  const { slug } = usePreset();
  const pathname = stripPresetPrefix(slug, usePathname());
  const name = useDemoStore((s) => s.config.name);
  const inSettings = pathname.startsWith("/painel/configuracoes");

  return (
    <aside
      aria-label="Menu lateral do painel"
      className="w-full border-b border-border bg-surface md:w-60 md:shrink-0 md:border-b-0 md:border-r"
    >
      <p className="px-md pt-md font-heading text-lg font-bold text-primary">{name}</p>
      <p className="px-md text-xs text-muted">Painel administrativo</p>
      <nav aria-label="Menu do painel" className="p-sm">
        <ul className="flex flex-row flex-wrap gap-xs md:flex-col">
          {items.map((i) => {
            const active = i.label === "Configurações" ? inSettings : pathname.startsWith(i.href);
            return (
              <li key={i.label}>
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-md px-md py-sm ${active ? "bg-primary text-surface" : "text-text hover:bg-background"}`}
                >
                  {i.label}
                </Link>
                {i.label === "Configurações" && inSettings && (
                  <ul className="ml-md mt-xs flex flex-col gap-xs">
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
        </ul>
      </nav>
    </aside>
  );
}
