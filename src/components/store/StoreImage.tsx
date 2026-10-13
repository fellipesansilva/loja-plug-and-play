import Image from "next/image";
import type { Image as ImageData } from "@/domain/types";

/**
 * Imagem do preset preenchendo o contêiner (que deve ser `relative` e ter dimensões).
 * `unoptimized`: placeholders SVG locais não passam pelo otimizador; fotos reais (WebP já
 * dimensionado em public/) também são servidas como estão. `lcp` só para a imagem do LCP.
 */
export function StoreImage({
  image,
  sizes,
  lcp = false,
  className = "object-cover",
}: {
  image: ImageData;
  sizes: string;
  lcp?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      unoptimized
      preload={lcp}
      loading={lcp ? "eager" : "lazy"}
      className={className}
    />
  );
}
