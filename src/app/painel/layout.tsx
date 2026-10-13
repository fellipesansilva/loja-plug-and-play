import type { Metadata } from "next";
import { PainelShell } from "@/components/layout/PainelShell";

export const metadata: Metadata = { title: "Painel da loja" };

/** Layout do painel: desktop-first, menu lateral. */
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
