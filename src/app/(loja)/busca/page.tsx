import { Suspense } from "react";
import { SearchView } from "@/components/store/SearchView";

export default function Page() {
  return (
    <Suspense fallback={<h1 className="mx-auto w-full max-w-5xl px-md py-lg text-2xl">Busca</h1>}>
      <SearchView />
    </Suspense>
  );
}
