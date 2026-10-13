import { PainelShell } from "@/components/layout/PainelShell";

/** Layout do painel: desktop-first, menu lateral. */
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
