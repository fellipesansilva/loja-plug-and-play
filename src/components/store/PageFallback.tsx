/**
 * Fallback do Suspense das páginas que leem a URL no navegador (categoria, busca, arrependimento). Reserva a altura da tela: sem isso,
 * quando o conteúdo chega o rodapé pula de lugar (CLS de 0,05 a 0,3 na lista de produtos antes da hidratação).
 */
export function PageFallback({ title }: { title: string }) {
  return (
    <div className="min-h-[100svh]">
      <h1 className="mx-auto w-full max-w-page px-md py-lg text-2xl">{title}</h1>
    </div>
  );
}
