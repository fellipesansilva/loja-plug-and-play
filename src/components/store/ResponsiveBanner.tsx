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
