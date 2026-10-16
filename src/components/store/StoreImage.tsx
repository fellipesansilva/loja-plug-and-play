"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Image as ImageData } from "@/domain/types";

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
  className = "object-cover",
}: {
  image: ImageData;
  sizes: string;
  lcp?: boolean;
  defer?: boolean;
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
