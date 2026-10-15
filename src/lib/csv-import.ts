import type { Attribute, AttributeDef, Category, Product } from "@/domain/types";
import { placeholderImage } from "@/presets/helpers";
import { csvCell, parseCsv, stripBom } from "./csv";
import { formatPriceInput, parsePriceCsv } from "./price-input";
import { MAX_SKU_LENGTH, SKU_PATTERN } from "./product-form";
import { normalizeText } from "./search";
import { slugify } from "./slug";

export const IMPORT_MAX_ROWS = 500;
/** Colunas base do modelo, na ordem. As seguintes são os atributos definidos pelo preset. */
export const BASE_COLUMNS = ["sku", "nome", "preco", "estoque", "categoria", "descricao"] as const;
const REQUIRED = ["sku", "nome", "preco", "estoque", "categoria"] as const;

export type ImportContext = {
  products: readonly Product[];
  categories: readonly Category[];
  defs: readonly AttributeDef[];
  /** Cor do preset (hex sem "#") para a imagem de substituição dos produtos criados sem foto. */
  placeholderColor: string;
  newId: () => string;
};

export type ImportRow = {
  /** Linha no arquivo (1 = cabeçalho). */
  line: number;
  sku: string;
  action: "create" | "update" | "error";
  reason?: string;
  /** Produto pronto para gravar (só nas linhas válidas). */
  product?: Product;
  name: string;
};

export type ImportPlan =
  | { ok: false; error: string }
  | { ok: true; rows: ImportRow[]; created: number; updated: number; errors: number; ignoredColumns: string[] };

/** Colunas do modelo do preset: base + uma por atributo definido. */
export function templateColumns(defs: readonly AttributeDef[]): string[] {
  return [...BASE_COLUMNS, ...defs.map((d) => d.key)];
}

/** Modelo para baixar: BOM + ";" + CRLF (abre direto no Excel em português), cabeçalho e uma linha de exemplo. */
export function templateCsv(defs: readonly AttributeDef[], categories: readonly Category[]): string {
  const example: Record<string, string> = {
    sku: "EXEMPLO-001",
    nome: "Nome do produto",
    preco: formatPriceInput(1990),
    estoque: "10",
    categoria: categories[0]?.slug ?? "",
    descricao: "Descrição do produto",
  };
  const columns = templateColumns(defs);
  return `﻿${columns.join(";")}\r\n${columns.map((c) => csvCell(example[c] ?? "")).join(";")}\r\n`;
}

const norm = (s: string) => normalizeText(s).replace(/\s+/g, "");

/**
 * Lê o CSV e planeja a importação SEM gravar nada: o que seria criado, o que seria atualizado (pelo SKU) e as linhas
 * com erro (com número da linha e motivo). Erros do arquivo inteiro (vazio, colunas erradas, mais de 500 linhas)
 * devolvem `ok: false` e nada é importado.
 */
export function planImport(rawText: string, ctx: ImportContext): ImportPlan {
  const text = stripBom(rawText);
  if (text.trim() === "") return { ok: false, error: "O arquivo está vazio." };
  const { rows } = parseCsv(text);
  if (rows.length === 0) return { ok: false, error: "O arquivo está vazio." };

  const header = rows[0].cells.map((c) => norm(c));
  const known = new Set<string>([...BASE_COLUMNS, ...ctx.defs.map((d) => d.key)]);
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Colunas obrigatórias ausentes: ${missing.join(", ")}. Confira o cabeçalho (primeira linha) ou baixe o modelo.`,
    };
  }
  const dup = header.find((c, i) => c !== "" && header.indexOf(c) !== i);
  if (dup) return { ok: false, error: `A coluna "${dup}" aparece mais de uma vez no cabeçalho.` };
  const ignoredColumns = rows[0].cells.filter((c, i) => c.trim() !== "" && !known.has(header[i]));

  const data = rows.slice(1);
  if (data.length === 0) return { ok: false, error: "O arquivo não tem nenhuma linha de produto depois do cabeçalho." };
  if (data.length > IMPORT_MAX_ROWS) {
    return { ok: false, error: `O arquivo tem ${data.length} linhas de produto; o limite é ${IMPORT_MAX_ROWS}. Divida em arquivos menores.` };
  }

  const col = (cells: string[], key: string): string => {
    const i = header.indexOf(key);
    return i === -1 ? "" : (cells[i] ?? "").trim();
  };

  const bySku = new Map(ctx.products.map((p) => [p.sku.toLowerCase(), p]));
  const variantOwner = new Map(ctx.products.flatMap((p) => p.variants.map((v) => [v.sku.toLowerCase(), p] as const)));
  const seenInFile = new Map<string, number>();
  const takenSlugs = new Set(ctx.products.map((p) => p.slug));
  const out: ImportRow[] = [];

  for (const { line, cells } of data) {
    const sku = col(cells, "sku");
    const name = col(cells, "nome");
    const fail = (reason: string): ImportRow => ({ line, sku, name, action: "error", reason });

    if (!sku) {
      out.push(fail("SKU vazio"));
      continue;
    }
    if (sku.length > MAX_SKU_LENGTH || !SKU_PATTERN.test(sku)) {
      out.push(fail(`SKU inválido (${sku}): use só letras, números, ponto, hífen e sublinhado, até ${MAX_SKU_LENGTH} caracteres`));
      continue;
    }
    const key = sku.toLowerCase();
    const first = seenInFile.get(key);
    if (first !== undefined) {
      out.push(fail(`SKU repetido no arquivo (já usado na linha ${first})`));
      continue;
    }
    seenInFile.set(key, line);

    const owner = variantOwner.get(key);
    if (owner) {
      out.push(fail(`O SKU ${sku} é de uma variação do produto "${owner.name}"; importe pelo SKU do produto`));
      continue;
    }

    const existing = bySku.get(key);
    if (name.length < 2) {
      out.push(fail("Nome vazio"));
      continue;
    }
    const price = parsePriceCsv(col(cells, "preco"));
    if (price === null) {
      out.push(fail(`Preço inválido (${col(cells, "preco") || "vazio"}): use o formato 19,90`));
      continue;
    }
    const stockText = col(cells, "estoque");
    if (!/^\d+$/.test(stockText) || Number(stockText) > 1_000_000) {
      out.push(fail(`Estoque inválido (${stockText || "vazio"}): use um número inteiro, 0 ou maior`));
      continue;
    }
    const stock = Number(stockText);
    const categoryText = col(cells, "categoria");
    const category = ctx.categories.find((c) => c.slug === normalizeText(categoryText) || normalizeText(c.name) === normalizeText(categoryText));
    if (!category) {
      out.push(fail(`Categoria desconhecida (${categoryText || "vazia"}). Use: ${ctx.categories.map((c) => c.slug).join(", ")}`));
      continue;
    }
    if (existing && existing.variants.length > 0 && stock !== existing.stock) {
      out.push(fail("Produto com variações: o estoque é o das variações; corrija o estoque no painel"));
      continue;
    }

    const description = col(cells, "descricao");
    const fromFile: Attribute[] = ctx.defs.flatMap((d) => {
      const value = col(cells, d.key);
      return value ? [{ key: d.key, label: d.label, value }] : [];
    });

    if (existing) {
      const merged = [...existing.attributes.filter((a) => !fromFile.some((f) => f.key === a.key)), ...fromFile];
      out.push({
        line,
        sku,
        name,
        action: "update",
        product: { ...existing, name, price, stock: existing.variants.length ? existing.stock : stock, categoryId: category.id, description: description || existing.description, attributes: merged },
      });
      continue;
    }

    let slug = slugify(name) || "produto";
    for (let n = 2; takenSlugs.has(slug); n++) slug = `${slugify(name) || "produto"}-${n}`;
    takenSlugs.add(slug);
    out.push({
      line,
      sku,
      name,
      action: "create",
      product: {
        id: ctx.newId(),
        slug,
        name,
        price,
        images: [placeholderImage(name, ctx.placeholderColor, name)],
        description,
        sku,
        stock,
        categoryId: category.id,
        attributes: fromFile,
        variants: [],
        active: true,
      },
    });
  }

  return {
    ok: true,
    rows: out,
    created: out.filter((r) => r.action === "create").length,
    updated: out.filter((r) => r.action === "update").length,
    errors: out.filter((r) => r.action === "error").length,
    ignoredColumns,
  };
}
