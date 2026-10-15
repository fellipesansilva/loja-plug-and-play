"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/store/FormField";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { usePresetRouter } from "@/components/store/StoreLink";
import type { Image as ImageData, Product } from "@/domain/types";
import { imageFileProblem, presetImagePool } from "@/lib/image-upload";
import {
  emptyForm,
  formFromProduct,
  newUid,
  productFromForm,
  splitDefs,
  validateProductForm,
  type FormErrors,
  type ProductFormValues,
} from "@/lib/product-form";
import { getPreset } from "@/presets";
import { useDemoStore } from "@/store/demo-store";
import { usePreset } from "@/store/PresetProvider";
import { safeStorage } from "@/store/safe-storage";
import { useHydrated } from "@/store/use-hydrated";

const primary = "inline-flex min-h-12 items-center justify-center rounded-button bg-primary px-lg font-bold text-background";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-md font-bold";
const field = "mt-xs h-11 w-full rounded-md border bg-surface px-md text-base";

const Input = FormField;

/** Tela de produto do painel: "novo" (sem id) ou edição. Só monta o formulário depois de ler o estado salvo da loja. */
export function ProductEditor({ productId }: { productId?: string }) {
  const hydrated = useHydrated();
  const product = useDemoStore((s) => (productId ? s.products.find((p) => p.id === productId) : undefined));
  const categories = useDemoStore((s) => s.categories);
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const title = productId ? "Editar produto" : "Novo produto";

  const back = (
    <StoreLink href="/painel/produtos" className="inline-flex min-h-11 items-center text-primary underline">
      ← Produtos
    </StoreLink>
  );

  if (!hydrated) {
    return (
      <section className="px-md py-lg">
        <PageTitle title={title} />
        {back}
        <h1 className="text-3xl">Carregando…</h1>
      </section>
    );
  }
  if (productId && !product) {
    return (
      <section className="px-md py-lg">
        <PageTitle title="Produto" />
        {back}
        <h1 className="text-3xl">Produto não encontrado</h1>
      </section>
    );
  }

  const initial = product ? formFromProduct(product, defs) : emptyForm(categories[0]?.id ?? "");
  return (
    <section className="px-md py-lg">
      <PageTitle title={title} />
      {back}
      <h1 className="text-3xl">{title}</h1>
      <ProductForm key={product?.id ?? "novo"} initial={initial} editingId={product?.id} />
    </section>
  );
}

function ProductForm({ initial, editingId }: { initial: ProductFormValues; editingId?: string }) {
  const router = usePresetRouter();
  const { id: presetId } = usePreset();
  const products = useDemoStore((s) => s.products);
  const categories = useDemoStore((s) => s.categories);
  const defs = useDemoStore((s) => s.config.attributeDefs);
  const saveProduct = useDemoStore((s) => s.saveProduct);
  const { axes, descriptive } = splitDefs(defs);
  const formId = useId();

  const [form, setForm] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState<"ok" | "full" | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [focusTick, setFocusTick] = useState(0);

  // foco no primeiro campo com erro, na ordem da tela (depois de o erro estar no DOM)
  useEffect(() => {
    if (focusTick > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(null);
  };
  const hasVariants = form.variants.length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const ctx = { products, categories, defs, editingId };
    const found = validateProductForm(form, ctx);
    setErrors(found);
    setSaved(null);
    if (Object.keys(found).length > 0) {
      setFocusTick((t) => t + 1);
      return;
    }
    const product: Product = productFromForm(form, { ...ctx, newId: () => `np-${Date.now().toString(36)}` });
    saveProduct(product);
    // o navegador recusa gravar quando o armazenamento enche: o produto vale até recarregar e avisamos
    setSaved(safeStorage.hasWriteFailed() ? "full" : "ok");
    if (!editingId) router.replace(`/painel/produtos/${product.id}`);
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    setImageNote(null);
    for (const file of Array.from(files)) {
      const problem = imageFileProblem(file);
      if (problem) {
        setImageNote(problem);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        setForm((f) => ({ ...f, images: [...f.images, { src, alt: f.name.trim() || file.name.replace(/\.[^.]+$/, "") }] }));
        setSaved(null);
      };
      reader.onerror = () => setImageNote(`${file.name}: não foi possível ler o arquivo.`);
      reader.readAsDataURL(file);
    }
  }

  const pool = presetImagePool(getPreset(presetId)!);
  const togglePool = (image: ImageData) => {
    const on = form.images.some((i) => i.src === image.src);
    set("images", on ? form.images.filter((i) => i.src !== image.src) : [...form.images, { ...image }]);
  };

  const valuesFor = (key: string) => {
    const def = defs.find((d) => d.key === key);
    const existing = products.flatMap((p) => p.variants.map((v) => v.attributes[key]).filter(Boolean));
    return [...new Set([...Object.keys(def?.swatches ?? {}), ...existing])];
  };

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="mt-md flex max-w-[44rem] flex-col gap-md" data-testid="product-form" aria-label="Dados do produto">
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-md border border-danger p-sm text-sm font-medium text-danger" data-testid="form-errors">
          Corrija os campos destacados para salvar.
        </p>
      )}

      <Input name="name" label="Nome" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
      <Input name="price" label="Preço (R$)" inputMode="decimal" placeholder="19,90" hint="Em reais, com vírgula: 19,90" value={form.price} error={errors.price} onChange={(e) => set("price", e.target.value)} />
      <Input name="sku" label="SKU" autoComplete="off" value={form.sku} error={errors.sku} onChange={(e) => set("sku", e.target.value)} />
      {!hasVariants ? (
        <Input name="stock" label="Estoque" inputMode="numeric" value={form.stock} error={errors.stock} onChange={(e) => set("stock", e.target.value)} />
      ) : (
        <p className="text-sm text-muted" data-testid="stock-derived">
          Estoque: soma das variações ({form.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}).
        </p>
      )}

      <div>
        <label htmlFor={`${formId}-cat`} className="text-sm font-bold">
          Categoria
        </label>
        <select
          id={`${formId}-cat`}
          name="categoryId"
          value={form.categoryId}
          aria-invalid={errors.categoryId ? true : undefined}
          onChange={(e) => set("categoryId", e.target.value)}
          className={`${field} ${errors.categoryId ? "border-danger" : "border-border"}`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-xs text-sm font-medium text-danger">{errors.categoryId}</p>}
      </div>

      <div>
        <label htmlFor={`${formId}-desc`} className="text-sm font-bold">
          Descrição
        </label>
        <textarea
          id={`${formId}-desc`}
          name="description"
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="mt-xs w-full rounded-md border border-border bg-surface p-md text-base"
        />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-5 shrink-0 accent-primary" />
        <span>Ativo (aparece na loja)</span>
      </label>

      <fieldset className="flex flex-col gap-sm">
        <legend className="text-lg font-bold">Imagens</legend>
        {form.images.length > 0 && (
          <ul className="flex flex-col gap-sm" data-testid="image-list">
            {form.images.map((image, i) => (
              <li key={`${image.src.slice(0, 80)}-${i}`} className="flex items-center gap-sm rounded-md border border-border p-sm" data-testid="image-item">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-background">
                  <Image src={image.src} alt="" fill sizes="64px" unoptimized className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <label htmlFor={`${formId}-alt-${i}`} className="text-xs font-bold">
                    Descrição da imagem {i + 1}
                    {i === 0 ? " (principal)" : ""}
                  </label>
                  <input
                    id={`${formId}-alt-${i}`}
                    value={image.alt}
                    onChange={(e) => set("images", form.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                    className="h-11 w-full rounded-md border border-border bg-surface px-sm text-sm"
                  />
                </span>
                <button type="button" className={ghost} aria-label={`Remover imagem ${i + 1}`} onClick={() => set("images", form.images.filter((_, j) => j !== i))}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
        <div>
          <label htmlFor={`${formId}-file`} className="text-sm font-bold">
            Enviar imagem (JPG, PNG ou WebP, até 1 MB)
          </label>
          <input
            id={`${formId}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            data-testid="image-file"
            aria-invalid={errors.images ? true : undefined}
            aria-describedby={errors.images ? `${formId}-img-erro` : undefined}
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
            className="mt-xs block w-full text-sm"
          />
          <p className="mt-xs text-xs text-muted">A imagem fica guardada neste navegador.</p>
        </div>
        {imageNote && (
          <p role="alert" className="text-sm font-medium text-danger" data-testid="image-note">
            {imageNote}
          </p>
        )}
        <details className="rounded-md border border-border p-sm">
          <summary className="min-h-11 cursor-pointer py-sm font-bold">Escolher entre as imagens do preset ({pool.length})</summary>
          <ul className="mt-sm grid grid-cols-3 gap-sm md:grid-cols-5" data-testid="image-pool">
            {pool.map((image) => {
              const on = form.images.some((i) => i.src === image.src);
              return (
                <li key={image.src}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`${on ? "Remover" : "Usar"}: ${image.alt}`}
                    onClick={() => togglePool(image)}
                    className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 ${on ? "border-primary" : "border-border"}`}
                  >
                    <Image src={image.src} alt="" fill sizes="96px" unoptimized className="object-cover" />
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
        {errors.images && (
          <p id={`${formId}-img-erro`} role="alert" className="text-sm font-medium text-danger" data-testid="images-error">
            {errors.images}
          </p>
        )}
      </fieldset>

      {descriptive.length > 0 && (
        <fieldset className="flex flex-col gap-md">
          <legend className="text-lg font-bold">Atributos</legend>
          {descriptive.map((d) => (
            <Input
              key={d.key}
              name={`attr-${d.key}`}
              label={d.label}
              value={form.attributes[d.key] ?? ""}
              onChange={(e) => set("attributes", { ...form.attributes, [d.key]: e.target.value })}
            />
          ))}
        </fieldset>
      )}

      {axes.length > 0 && (
        <fieldset className="flex flex-col gap-md">
          <legend className="text-lg font-bold">Variações ({axes.map((a) => a.label.toLowerCase()).join(", ")})</legend>
          {form.variants.map((v, i) => (
            <div key={v.uid} className="flex flex-col gap-sm rounded-lg border border-border p-md" data-testid="variant-row">
              <p className="font-bold">Variação {i + 1}</p>
              {axes.map((a) => (
                <div key={a.key}>
                  <Input
                    name={`variant-${i}-${a.key}`}
                    label={a.label}
                    list={`${formId}-list-${a.key}`}
                    value={v.values[a.key] ?? ""}
                    error={errors[`variant-${i}-${a.key}`]}
                    onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, values: { ...x.values, [a.key]: e.target.value } } : x)))}
                  />
                </div>
              ))}
              <Input name={`variant-${i}-sku`} label="SKU da variação" autoComplete="off" value={v.sku} error={errors[`variant-${i}-sku`]} onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
              <Input name={`variant-${i}-stock`} label="Estoque da variação" inputMode="numeric" value={v.stock} error={errors[`variant-${i}-stock`]} onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
              <Input
                name={`variant-${i}-price`}
                label="Preço da variação (opcional)"
                inputMode="decimal"
                hint="Deixe vazio para usar o preço do produto"
                value={v.price}
                error={errors[`variant-${i}-price`]}
                onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
              />
              <button type="button" className={ghost} onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}>
                Remover variação {i + 1}
              </button>
            </div>
          ))}
          {axes.map((a) => (
            <datalist key={a.key} id={`${formId}-list-${a.key}`}>
              {valuesFor(a.key).map((val) => (
                <option key={val} value={val} />
              ))}
            </datalist>
          ))}
          {errors.variants && <p className="text-sm font-medium text-danger">{errors.variants}</p>}
          <button
            type="button"
            className={ghost}
            data-testid="add-variant"
            onClick={() => set("variants", [...form.variants, { uid: newUid(), values: Object.fromEntries(axes.map((a) => [a.key, ""])), sku: "", stock: "0", price: "" }])}
          >
            Adicionar variação
          </button>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-md">
        <button type="submit" className={primary} data-testid="save-product">
          Salvar produto
        </button>
        {saved === "ok" && (
          <p role="status" className="text-sm font-medium text-success" data-testid="saved-ok">
            Produto salvo.
          </p>
        )}
        {saved === "full" && (
          <p role="alert" className="text-sm font-medium text-danger" data-testid="saved-full">
            O armazenamento do navegador está cheio: o produto aparece agora, mas some ao recarregar. Remova imagens enviadas ou use as do preset.
          </p>
        )}
      </div>
    </form>
  );
}
