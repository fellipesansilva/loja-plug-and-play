"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Image as ImageData } from "@/domain/types";

/** Larguras (px) das versões menores de cada foto (scripts/image-variants.mjs): <nome>-360.webp e <nome>-640.webp. */
export const IMAGE_VARIANT_WIDTHS = [360, 640] as const;

/**
 * srcset da foto de um preset (arquivo em /images/presets/<loja>/<nome>.webp, fora os banners): o navegador baixa a versão que cobre o espaço
 * exibido. Miniaturas de 100 px e cards de 200 px não precisam do arquivo de 150 KB. Fotos enviadas pelo painel (data:) não têm versões.
 */
export function imageSrcSet(src: string): string | undefined {
  const m = /^(\/images\/presets\/[^/]+\/(?!banner)[^/]+?)\.webp$/.exec(src);
  if (!m || /-(360|640)\.webp$/.test(src)) return undefined;
  return IMAGE_VARIANT_WIDTHS.map((w) => `${m[1]}-${w}.webp ${w}w`).join(", ");
}

/**
 * Imagem do preset preenchendo o contêiner (que deve ser `relative` e ter dimensões).
 * `unoptimized`: placeholders SVG locais não passam pelo otimizador; fotos reais (WebP já
 * dimensionado em public/) também são servidas como estão. `lcp` só para a imagem do LCP.
 *
 * `defer`: imagem abaixo da primeira tela. Só entra na página (e só então é baixada) quando chega a ~300 px da janela.
 * O `loading="lazy"` do navegador não basta: no PageSpeed e no Lighthouse mobile ele baixa todas as imagens da página
 * junto com o banner, e os ~2 MB disputam a banda com a imagem do LCP.
 */
export function StoreImage({
  image,
  sizes,
  lcp = false,
  defer = false,
  variants = true,
  className = "object-cover",
}: {
  image: ImageData;
  sizes: string;
  lcp?: boolean;
  defer?: boolean;
  /** Falso quando a foto aparece grande (galeria do produto): usa só o arquivo original. */
  variants?: boolean;
  className?: string;
}) {
  const [near, setNear] = useState(!defer || lcp);
  const holder = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (near) return;
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  if (!near) return <span ref={holder} aria-hidden="true" className="absolute inset-0" data-deferred-image={image.src} />;
  const srcSet = !lcp && variants ? imageSrcSet(image.src) : undefined;
  if (srcSet) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- o next/image sem otimizador não gera srcset; este <img> reproduz o dele (fill)
      <img
        src={image.src}
        srcSet={srcSet}
        sizes={sizes}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        data-nimg="fill"
        className={className}
        style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, color: "transparent" }}
      />
    );
  }
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
