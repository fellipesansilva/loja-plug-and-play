import type { ImageCandidate } from "@/domain/types";

/** "a.avif 480w, b.avif 720w" a partir dos candidatos (a mesma string vai no <source> e no preload). */
export function toSrcSet(candidates: ImageCandidate[]): string {
  return candidates.map((c) => `${c.src} ${c.width}w`).join(", ");
}
