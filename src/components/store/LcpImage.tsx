import { preload } from "react-dom";
import type { Image as ImageData } from "@/domain/types";
import { lcpImagePlan, lcpPreloads } from "@/lib/image-variants";
import { StoreImage } from "./StoreImage";

/**
 * Foto do LCP da galeria do produto (preenche o contêiner `relative` com dimensões). Foto pesada de preset vira um <picture> com `srcset` das
 * variantes (celular: 360 e 640; telas largas: também o original) e `fetchpriority="high"`, e o preload leva exatamente o mesmo srcset, sizes e
 * media: o navegador baixa a foto uma vez só, na variante que cobre o espaço. Foto leve ou fora dos presets segue no caminho de antes (original).
 */
export function LcpImage({ image, gutterRem = 0, fallbackSizes }: { image: ImageData; gutterRem?: number; fallbackSizes: string }) {
  const plan = lcpImagePlan(image.src, gutterRem);
  if (!plan) return <StoreImage image={image} sizes={fallbackSizes} lcp variants={false} />;
  for (const p of lcpPreloads(plan)) preload(plan.src, { as: "image", imageSrcSet: p.imageSrcSet, imageSizes: p.imageSizes, media: p.media, fetchPriority: "high" });
  return (
    <picture>
      <source media={plan.wide.media} srcSet={plan.wide.srcSet} sizes={plan.wide.sizes} />
      <img
        src={plan.fallback}
        srcSet={plan.phone.srcSet}
        sizes={plan.phone.sizes}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        data-nimg="fill"
        className="object-cover"
        style={{ position: "absolute", height: "100%", width: "100%", left: 0, top: 0, right: 0, bottom: 0, color: "transparent" }}
      />
    </picture>
  );
}
