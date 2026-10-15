"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, type ComponentProps } from "react";
import { prefixHref } from "@/lib/preset-href";
import { usePreset } from "@/store/PresetProvider";

/**
 * Link interno da loja: o caminho ganha sempre o prefixo do preset da rota (/carrinho → /forno/carrinho).
 * Âncoras (#...), endereços externos e caminhos que já têm o prefixo passam como estão.
 */
export const StoreLink = forwardRef<HTMLAnchorElement, Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }>(
  function StoreLink({ href, ...props }, ref) {
    const { slug } = usePreset();
    return <NextLink ref={ref} href={prefixHref(slug, href)} {...props} />;
  },
);

/** Função que prefixa caminhos com o preset da rota (para router.push e afins). */
export function usePresetHref(): (href: string) => string {
  const { slug } = usePreset();
  return (href) => prefixHref(slug, href);
}

/** Router do Next com os caminhos já prefixados pelo preset da rota. */
export function usePresetRouter() {
  const router = useRouter();
  const href = usePresetHref();
  return {
    push: (path: string) => router.push(href(path)),
    replace: (path: string) => router.replace(href(path)),
    back: () => router.back(),
  };
}
