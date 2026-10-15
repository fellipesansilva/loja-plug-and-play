"use client";

import { useSyncExternalStore } from "react";
import { safeStorage } from "@/store/safe-storage";

/** Avisa, em todas as telas do painel, quando o navegador recusou gravar (armazenamento cheio): o trabalho vale só até recarregar. */
export function StorageFullAlert() {
  const failed = useSyncExternalStore(
    (onChange) => safeStorage.subscribeWriteFailure(onChange),
    () => safeStorage.hasWriteFailed(),
    () => false,
  );
  if (!failed) return null;
  return (
    <p role="alert" data-testid="storage-full" className="border-b border-danger bg-surface px-md py-sm text-sm font-medium text-danger">
      O armazenamento do navegador está cheio: as últimas alterações não foram salvas e somem ao recarregar. Remova imagens enviadas ou use as imagens do preset.
    </p>
  );
}
