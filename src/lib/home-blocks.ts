import type { HomeBlock } from "@/domain/types";

/** Blocos ligados, na ordem do array (a ordem do preset é a ordem na home). */
export function activeHomeBlocks(blocks: HomeBlock[]): HomeBlock[] {
  return blocks.filter((b) => b.enabled);
}
