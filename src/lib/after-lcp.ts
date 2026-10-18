"use client";

import { useSyncExternalStore } from "react";

/**
 * Portão "depois do LCP". Abre quando a foto principal da página (a primeira <img fetchpriority="high">, a do banner ou a da galeria do
 * produto) terminou de carregar e a página teve dois quadros para pintá-la; sem foto principal, abre logo na hidratação. Um limite de
 * tempo abre o portão mesmo se a foto não terminar (rede muito lenta ou foto com erro), para nada ficar sem carregar.
 *
 * Serve para o que não pode disputar banda com a foto do LCP: fotos dos cards abaixo da primeira tela, fontes da loja e ferramentas do
 * orçamento. Uma vez aberto, fica aberto: a navegação dentro da loja não espera de novo.
 */
const LIMIT_MS = 5000;
const listeners = new Set<() => void>();
let open = false;
let started = false;

function release() {
  if (open) return;
  open = true;
  for (const l of listeners) l();
  listeners.clear();
}

function afterPaint() {
  requestAnimationFrame(() => requestAnimationFrame(release));
}

function start() {
  if (started || typeof document === "undefined") return;
  started = true;
  setTimeout(release, LIMIT_MS);
  const lcp = document.querySelector<HTMLImageElement>('img[fetchpriority="high"]');
  if (!lcp || lcp.complete) {
    afterPaint();
    return;
  }
  lcp.addEventListener("load", afterPaint, { once: true });
  lcp.addEventListener("error", afterPaint, { once: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

/** O portão como fonte externa (o que o useSyncExternalStore consome); exportado para os testes. */
export const afterLcpStore = { subscribe, getSnapshot: () => open };

/** Falso no servidor e na hidratação; verdadeiro depois que a foto principal foi pintada. */
export function useAfterLcp(): boolean {
  return useSyncExternalStore(afterLcpStore.subscribe, afterLcpStore.getSnapshot, () => false);
}

/** Só para os testes: volta o portão ao estado inicial. */
export function resetAfterLcpForTests() {
  open = false;
  started = false;
  listeners.clear();
}
