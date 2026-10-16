import type { Image, Preset } from "@/domain/types";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 1024 * 1024;

/** Valida o arquivo escolhido: JPG, PNG ou WebP, até 1 MB. Devolve a mensagem de erro, ou null se está ok. */
export function imageFileProblem(file: { name: string; type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return `${file.name}: use uma imagem JPG, PNG ou WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: a imagem tem mais de 1 MB. Reduza o arquivo e tente de novo.`;
  return null;
}

/** Imagens que o preset já tem (produtos e categorias), sem repetir o mesmo arquivo. */
export function presetImagePool(preset: Pick<Preset, "products" | "categories">): Image[] {
  const seen = new Set<string>();
  const out: Image[] = [];
  for (const image of [...preset.products.flatMap((p) => p.images), ...preset.categories.flatMap((c) => c.image ?? [])]) {
    if (seen.has(image.src)) continue;
    seen.add(image.src);
    out.push(image);
  }
  return out;
}
