"use client";

import dynamic from "next/dynamic";
import type { HomeBlock } from "@/domain/types";
import { useAfterLcp } from "@/lib/after-lcp";
import { useDemoStore } from "@/store/demo-store";

// Código de cada módulo em arquivo à parte: só entra na página quando o preset liga o módulo e a foto principal já foi pintada.
const Testimonials = dynamic(() => import("./Testimonials"), { ssr: false });
const Newsletter = dynamic(() => import("./Newsletter"), { ssr: false });

type TestimonialsBlock = Extract<HomeBlock, { type: "testimonials" }>;

/** Seção de depoimentos da home. Reserva o espaço (sem salto de layout) até o código chegar. Módulo desligado: não renderiza nada. */
export function TestimonialsSlot({ block }: { block: TestimonialsBlock }) {
  const on = useDemoStore((s) => s.config.modules.depoimentos === true);
  const ready = useAfterLcp();
  if (!on) return null;
  if (!ready) return <div aria-hidden="true" data-testid="depoimentos-reservado" className="min-h-[52rem] sm:min-h-[26rem] lg:min-h-[17rem]" />;
  return <Testimonials block={block} />;
}

/** Campo de e-mail do rodapé. Módulo desligado: não renderiza nada. */
export function NewsletterSlot() {
  const on = useDemoStore((s) => s.config.modules.newsletter === true);
  const ready = useAfterLcp();
  if (!on) return null;
  if (!ready) return <div aria-hidden="true" data-testid="newsletter-reservado" className="mb-lg min-h-[24rem] sm:min-h-[20rem]" />;
  return <Newsletter />;
}
