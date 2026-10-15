import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { StoreFooter } from "@/components/layout/StoreFooter";

/** Layout da vitrine: mobile-first. O aviso de cookies fica fixo na base e só aparece até a escolha. */
export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <div className="flex min-h-screen flex-col">
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </ConsentProvider>
  );
}
