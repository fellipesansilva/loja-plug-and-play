"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Image } from "@/domain/types";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { StoreImage } from "./StoreImage";

const SIZES = "(min-width: 768px) 50vw, 100vw";

/** Galeria com rolagem por deslizar (scroll-snap), botões anterior/próxima e indicador de posição. */
export function ProductGallery({
  images,
  tall = false,
  children,
}: {
  images: Image[];
  /** Foto de ponta a ponta com altura fixa (página em folha), em vez da proporção do produto. */
  tall?: boolean;
  /** Controles sobrepostos à foto (voltar, favoritar). */
  children?: ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(total - 1, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  function onScroll() {
    const track = trackRef.current;
    if (track && track.clientWidth > 0) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  const nav =
    "absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-button bg-background/90 text-text disabled:opacity-40";

  return (
    <div className="relative" role="group" aria-roledescription="galeria" aria-label="Fotos do produto">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {images.map((img, i) => (
          <li
            key={img.src}
            className={`relative w-full shrink-0 snap-center overflow-hidden bg-surface ${tall ? "h-[420px] md:h-[520px]" : "aspect-product"}`}
          >
            <StoreImage image={img} sizes={SIZES} lcp={i === 0} />
          </li>
        ))}
      </ul>
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className={`${nav} left-sm`}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            disabled={index === total - 1}
            onClick={() => goTo(index + 1)}
            className={`${nav} right-sm`}
          >
            <ChevronRightIcon />
          </button>
          <p
            data-testid="gallery-position"
            aria-live="polite"
            className="absolute bottom-sm right-sm rounded-button bg-background/90 px-sm py-xs text-xs font-medium text-text"
          >
            {index + 1} / {total}
          </p>
        </>
      )}
      {children}
    </div>
  );
}
