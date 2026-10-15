"use client";

import { cartWords, type CartWords } from "@/lib/cart-words";
import { useDemoStore } from "@/store/demo-store";

/** Textos do carrinho no rótulo do preset ativo ("Carrinho", "Sacola"). */
export function useCartWords(): CartWords {
  const label = useDemoStore((s) => s.config.cartLabel);
  const gender = useDemoStore((s) => s.config.cartGender);
  return cartWords(label, gender);
}
