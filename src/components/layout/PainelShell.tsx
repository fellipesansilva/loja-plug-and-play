"use client";

import { usePathname } from "next/navigation";
import { PainelSidebar } from "./PainelSidebar";

export function PainelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // A tela de login não exibe o menu lateral.
  if (pathname === "/painel/login") return <main>{children}</main>;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PainelSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
