import type { Metadata } from "next";
import { PainelShell } from "@/components/layout/PainelShell";

// O painel nunca é indexado.
export const metadata: Metadata = { title: "Painel da loja", robots: { index: false, follow: false } };

/** Layout do painel: desktop-first, menu lateral. */
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
