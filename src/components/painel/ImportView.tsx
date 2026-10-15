"use client";

import { useRef, useState } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { decodeCsvBytes } from "@/lib/csv";
import { IMPORT_MAX_ROWS, planImport, templateCsv, templateColumns, type ImportPlan } from "@/lib/csv-import";
import { formatBRL } from "@/lib/money";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";

const primary = "inline-flex min-h-12 items-center justify-center rounded-button bg-primary px-lg font-bold text-background disabled:opacity-50";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-lg font-bold";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const SHOWN_ROWS = 50;

type Done = { created: number; updated: number; errors: number };

/** Importação de produtos por CSV: modelo do preset, prévia (criados, atualizados, erros) e confirmação. */
export function ImportView() {
  const { slug } = usePreset();
  const products = useDemoStore((s) => s.products);
  const categories = useDemoStore((s) => s.categories);
  const config = useDemoStore((s) => s.config);
  const upsertProducts = useDemoStore((s) => s.upsertProducts);

  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [fileName, setFileName] = useState("");
  const [encodingNote, setEncodingNote] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const defs = config.attributeDefs;

  function downloadTemplate() {
    const blob = new Blob([templateCsv(defs, categories)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modelo-importacao-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function onFile(file: File | undefined) {
    setDone(null);
    setPlan(null);
    setEncodingNote(false);
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_FILE_BYTES) {
      setPlan({ ok: false, error: "O arquivo tem mais de 2 MB. Divida em arquivos menores." });
      return;
    }
    try {
      const { text, fallback } = decodeCsvBytes(new Uint8Array(await file.arrayBuffer()));
      setEncodingNote(fallback);
      const stamp = Date.now().toString(36);
      setPlan(
        planImport(text, {
          products,
          categories,
          defs,
          placeholderColor: config.theme.colors.primary.replace("#", ""),
          newId: () => `imp-${stamp}-${counter.current++}`,
        }),
      );
    } catch {
      setPlan({ ok: false, error: "Não foi possível ler o arquivo." });
    }
  }

  function reset() {
    setPlan(null);
    setFileName("");
    setEncodingNote(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function confirm() {
    if (!plan?.ok) return;
    const valid = plan.rows.flatMap((r) => (r.product ? [r.product] : []));
    if (valid.length === 0) return;
    upsertProducts(valid);
    setDone({ created: plan.created, updated: plan.updated, errors: plan.errors });
    reset();
  }

  const validCount = plan?.ok ? plan.created + plan.updated : 0;

  return (
    <section className="px-md py-lg">
      <PageTitle title="Importação" />
      <h1 className="text-3xl">Importação</h1>
      <p className="mt-sm max-w-[40rem] text-muted">
        Importe produtos por planilha CSV. O SKU identifica o produto: SKU novo cria, SKU que já existe atualiza. Até {IMPORT_MAX_ROWS} linhas por arquivo, com
        separador ; ou , e preço em formato brasileiro (19,90).
      </p>

      <div className="mt-md flex flex-col gap-md md:max-w-[36rem]">
        <div>
          <button type="button" className={ghost} onClick={downloadTemplate} data-testid="download-template">
            Baixar modelo (CSV)
          </button>
          <p className="mt-xs text-sm text-muted">Colunas: {templateColumns(defs).join(", ")}.</p>
        </div>

        <div>
          <label htmlFor="import-file" className="text-sm font-bold">
            Arquivo CSV
          </label>
          <input
            ref={inputRef}
            id="import-file"
            type="file"
            accept=".csv,text/csv"
            data-testid="import-file"
            onChange={(e) => void onFile(e.target.files?.[0])}
            className="mt-xs block w-full text-sm"
          />
        </div>
      </div>

      {done && (
        <p role="status" data-testid="import-done" className="mt-md rounded-md border border-border bg-surface p-md">
          Importação concluída: {done.created} {done.created === 1 ? "criado" : "criados"}, {done.updated} {done.updated === 1 ? "atualizado" : "atualizados"}
          {done.errors > 0 ? `; ${done.errors} ${done.errors === 1 ? "linha com erro foi ignorada" : "linhas com erro foram ignoradas"}` : ""}.{" "}
          <StoreLink href="/painel/produtos" className="font-bold text-primary underline">
            Ver produtos
          </StoreLink>
        </p>
      )}

      {plan && !plan.ok && (
        <div role="alert" data-testid="import-error" className="mt-md rounded-md border border-danger p-md">
          <p className="font-bold text-danger">{plan.error}</p>
          <p className="mt-xs text-sm">Nada foi importado.</p>
        </div>
      )}

      {plan?.ok && (
        <div className="mt-md" data-testid="import-preview">
          <h2 className="text-xl">Prévia de {fileName}</h2>
          {encodingNote && <p className="mt-xs text-sm text-muted">O arquivo não estava em UTF-8; foi lido como Windows-1252. Confira os acentos.</p>}
          <dl className="mt-sm grid max-w-[28rem] grid-cols-3 gap-md text-sm">
            <div className="rounded-md border border-border bg-surface p-sm">
              <dt className="text-muted">Criados</dt>
              <dd className="text-2xl font-bold" data-testid="count-created">
                {plan.created}
              </dd>
            </div>
            <div className="rounded-md border border-border bg-surface p-sm">
              <dt className="text-muted">Atualizados</dt>
              <dd className="text-2xl font-bold" data-testid="count-updated">
                {plan.updated}
              </dd>
            </div>
            <div className="rounded-md border border-border bg-surface p-sm">
              <dt className="text-muted">Com erro</dt>
              <dd className="text-2xl font-bold" data-testid="count-errors">
                {plan.errors}
              </dd>
            </div>
          </dl>
          {plan.ignoredColumns.length > 0 && (
            <p className="mt-sm text-sm text-muted" data-testid="ignored-columns">
              Colunas ignoradas (não fazem parte do modelo): {plan.ignoredColumns.join(", ")}.
            </p>
          )}

          {plan.errors > 0 && (
            <div className="mt-md">
              <h3 className="text-lg">Linhas com erro (não serão importadas)</h3>
              <ul className="mt-xs flex flex-col gap-xs text-sm" data-testid="import-errors">
                {plan.rows
                  .filter((r) => r.action === "error")
                  .map((r) => (
                    <li key={r.line} className="rounded-md border border-danger p-sm" data-testid="import-error-row" data-line={r.line}>
                      <strong>Linha {r.line}:</strong> {r.reason}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {validCount > 0 && (
            <div className="mt-md">
              <h3 className="text-lg">Linhas válidas</h3>
              <ul className="mt-xs flex flex-col gap-xs text-sm" data-testid="import-valid">
                {plan.rows
                  .filter((r) => r.product)
                  .slice(0, SHOWN_ROWS)
                  .map((r) => (
                    <li key={r.line} className="flex flex-wrap justify-between gap-sm rounded-md border border-border bg-surface p-sm" data-testid="import-valid-row" data-action={r.action}>
                      <span>
                        <strong>{r.action === "create" ? "Novo" : "Atualiza"}</strong> · {r.sku} · {r.product!.name}
                      </span>
                      <span>
                        {formatBRL(r.product!.price)} · estoque {r.product!.stock}
                      </span>
                    </li>
                  ))}
              </ul>
              {validCount > SHOWN_ROWS && <p className="mt-xs text-sm text-muted">… e mais {validCount - SHOWN_ROWS} linhas válidas.</p>}
            </div>
          )}

          <div className="mt-md flex flex-wrap gap-sm">
            <button type="button" className={primary} disabled={validCount === 0} onClick={confirm} data-testid="import-confirm">
              {validCount === 0 ? "Nenhuma linha válida para importar" : `Importar ${validCount} ${validCount === 1 ? "linha válida" : "linhas válidas"}`}
            </button>
            <button type="button" className={ghost} onClick={reset}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
