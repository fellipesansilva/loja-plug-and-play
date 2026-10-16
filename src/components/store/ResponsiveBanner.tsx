import { preload } from "react-dom";
import type { Image } from "@/domain/types";
import { toSrcSet } from "@/lib/image-sources";

/**
 * Foto principal da home, responsiva: um <picture> com recorte de celular e de desktop, cada um em AVIF e WebP e em
 * várias larguras, para o celular nunca baixar a versão de desktop. O contêiner pai deve ser `relative` e ter altura.
 * A imagem é a candidata ao LCP: carrega na hora (eager) e com prioridade alta; o preload do script inline
 * (early-theme-script.ts) usa exatamente os mesmos srcset e sizes.
 */
export function ResponsiveBanner({ image }: { image: Image }) {
  const sources = image.sources ?? [];
  // Preload da foto principal (opt-in por preset: `image.preload`), com o MESMO srcset, sizes e media do <picture>: um download só.
  if (image.preload) {
    for (const s of sources) {
      preload(s.avif[s.avif.length - 1].src, { as: "image", imageSrcSet: toSrcSet(s.avif), imageSizes: s.sizes, media: s.media, type: "image/avif", fetchPriority: "high" });
    }
  }
  return (
    <picture>
      {sources.flatMap((s) => [
        <source key={`${s.media}-avif`} media={s.media} type="image/avif" srcSet={toSrcSet(s.avif)} sizes={s.sizes} />,
        <source key={`${s.media}-webp`} media={s.media} type="image/webp" srcSet={toSrcSet(s.webp)} sizes={s.sizes} />,
      ])}
      <img
        src={image.src}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
    </picture>
  );
}
