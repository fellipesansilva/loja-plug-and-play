import { Suspense } from "react";
import { RegretView } from "@/components/store/RegretView";

export default function Page() {
  return (
    <Suspense fallback={<h1 className="mx-auto w-full max-w-5xl px-md py-lg text-2xl">Carregando…</h1>}>
      <RegretView />
    </Suspense>
  );
}
