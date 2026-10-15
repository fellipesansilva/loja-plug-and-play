/**
 * O store só é exposto em window.__demoStore fora de produção ou com NEXT_PUBLIC_EXPOSE_STORE=1 (usado só no build
 * de teste do E2E). Em produção normal ele não existe.
 */
export function shouldExposeStore(env: { NODE_ENV?: string; NEXT_PUBLIC_EXPOSE_STORE?: string }): boolean {
  return env.NODE_ENV !== "production" || env.NEXT_PUBLIC_EXPOSE_STORE === "1";
}
