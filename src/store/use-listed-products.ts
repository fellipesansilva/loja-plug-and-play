"use client";

import { useMemo } from "react";
import type { Product } from "@/domain/types";
import { isListed } from "@/lib/product";
import { useDemoStore } from "./demo-store";

/** Produtos que aparecem na loja (os ativos). O painel usa `s.products` direto. */
export function useListedProducts(): Product[] {
  const all = useDemoStore((s) => s.products);
  return useMemo(() => all.filter(isListed), [all]);
}
