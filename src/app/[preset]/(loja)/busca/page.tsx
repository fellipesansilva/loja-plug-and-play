import { PageFallback } from "@/components/store/PageFallback";
import { Suspense } from "react";
import { SearchView } from "@/components/store/SearchView";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback title="Busca" />}>
      <SearchView />
    </Suspense>
  );
}
