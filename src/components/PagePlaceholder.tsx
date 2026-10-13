export function PagePlaceholder({ title, note }: { title: string; note?: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-md py-lg">
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      <p className="mt-sm text-muted">{note ?? "Conteúdo desta tela será entregue em uma fatia futura."}</p>
    </section>
  );
}
