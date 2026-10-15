import { StoreLink as Link } from "@/components/store/StoreLink";

type Chip = { label: string; href: string; active?: boolean };

/** Chips de categoria em pílula, com rolagem horizontal. O chip ativo usa a cor de texto como fundo. */
export function CategoryChips({ items, label = "Categorias" }: { items: Chip[]; label?: string }) {
  return (
    <nav aria-label={label} className="-mx-md overflow-x-auto px-md [scrollbar-width:none]">
      <ul className="flex w-max gap-sm py-xs">
        {items.map((c) => {
          const look = c.active
            ? "bg-text text-background border-text"
            : "bg-surface text-text border-border";
          const className = `inline-flex min-h-11 items-center whitespace-nowrap rounded-button border px-md text-sm font-bold ${look}`;
          return (
            <li key={c.label}>
              {c.href.startsWith("#") ? (
                <a href={c.href} className={className}>
                  {c.label}
                </a>
              ) : (
                <Link href={c.href} aria-current={c.active ? "page" : undefined} className={className}>
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
