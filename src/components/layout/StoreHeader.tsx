"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/store/Icons";
import { useDemoStore } from "@/store/demo-store";

const links = [
  { href: "/sobre", label: "Sobre" },
  { href: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
  { href: "/privacidade", label: "Privacidade" },
];

const iconButton =
  "inline-flex size-11 items-center justify-center rounded-button text-text hover:bg-border/50";

function SearchForm({ pill, autoFocus = false }: { pill: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const [term, setTerm] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/busca?q=${encodeURIComponent(q)}` : "/busca");
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`flex items-center ${pill ? "rounded-button border border-border bg-surface pl-md" : "border-b border-border"}`}
    >
      <input
        type="search"
        name="q"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar produtos"
        aria-label="Buscar produtos"
        autoFocus={autoFocus}
        className="h-11 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-muted focus:outline-none"
      />
      <button type="submit" aria-label="Buscar" className={iconButton}>
        <SearchIcon />
      </button>
    </form>
  );
}

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const name = useDemoStore((s) => s.config.name);
  const searchLayout = useDemoStore((s) => s.config.layout.search);
  const categories = useDemoStore((s) => s.categories);
  const count = useDemoStore((s) => s.cart.reduce((sum, l) => sum + l.qty, 0));

  return (
    <header className="bg-background">
      <AnnouncementBar />
      <div className="border-b border-border">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-sm px-md py-sm">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="menu-loja"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link
            href="/"
            className="store-logo col-start-2 truncate text-center text-base md:text-xl md:col-start-1 md:row-start-1 md:text-left"
            data-testid="store-name"
          >
            {name}
          </Link>
          <div className="col-start-3 flex items-center md:col-start-3">
            {searchLayout === "icon" && (
              <button
                type="button"
                className={iconButton}
                aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
                aria-expanded={searchOpen}
                aria-controls="busca-cabecalho"
                onClick={() => setSearchOpen((v) => !v)}
              >
                {searchOpen ? <CloseIcon /> : <SearchIcon />}
              </button>
            )}
            <Link
              href="/carrinho"
              className={`${iconButton} relative`}
              aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
            >
              <CartIcon />
              {count > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute right-0 top-0 inline-flex min-w-5 items-center justify-center rounded-button bg-primary px-xs text-xs font-bold text-background"
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        {searchLayout === "icon" && searchOpen && (
          <div id="busca-cabecalho" className="mx-auto w-full max-w-5xl px-md pb-sm">
            <SearchForm pill={false} autoFocus />
          </div>
        )}
        {searchLayout === "bar" && (
          <div className="mx-auto w-full max-w-5xl px-md pb-sm">
            <SearchForm pill />
          </div>
        )}
      </div>
      <nav
        id="menu-loja"
        aria-label="Menu principal"
        className={`${menuOpen ? "block" : "hidden"} border-b border-border md:block`}
      >
        <ul className="mx-auto flex w-full max-w-5xl flex-col px-md py-xs md:flex-row md:flex-wrap md:gap-md">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categoria/${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center text-text hover:text-primary"
              >
                {c.name}
              </Link>
            </li>
          ))}
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center text-muted hover:text-primary"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
