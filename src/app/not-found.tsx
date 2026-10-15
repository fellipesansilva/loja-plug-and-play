import Link from "next/link";
import { presets } from "@/presets";

/** 404 sem preset (endereço desconhecido, como /orbita ou /xyz): oferece as lojas existentes. */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2">Este endereço não existe. Escolha uma das lojas da demonstração:</p>
      <ul className="mt-4 flex flex-col gap-2">
        {presets.map((p) => (
          <li key={p.id}>
            <Link href={`/${p.shortId}`} className="inline-flex min-h-11 items-center underline">
              {p.config.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
