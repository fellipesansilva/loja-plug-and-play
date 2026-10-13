"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoStore } from "@/store/demo-store";

const links = [
  { href: "/busca", label: "Buscar" },
  { href: "/carrinho", label: "Carrinho" },
  { href: "/sobre", label: "Sobre" },
  { href: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
  { href: "/privacidade", label: "Privacidade" },
];

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  const name = useDemoStore((s) => s.config.name);
  const categories = useDemoStore((s) => s.categories);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-md px-md py-sm">
        <Link href="/" className="font-heading text-xl font-bold text-primary" data-testid="store-name">
          {name}
        </Link>
        <button
          type="button"
          className="rounded-md border border-border px-md py-sm text-sm md:hidden"
          aria-expanded={open}
          aria-controls="menu-loja"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fechar menu" : "Abrir menu"}
        </button>
      </div>
      <nav
        id="menu-loja"
        aria-label="Menu principal"
        className={`${open ? "block" : "hidden"} border-t border-border md:block md:border-t-0`}
      >
        <ul className="mx-auto flex w-full max-w-5xl flex-col gap-xs px-md py-sm md:flex-row md:flex-wrap md:gap-md">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/categoria/${c.slug}`} className="block py-xs text-text hover:text-primary">
                {c.name}
              </Link>
            </li>
          ))}
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-xs text-muted hover:text-primary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
