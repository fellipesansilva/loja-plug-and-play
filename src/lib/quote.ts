import { QUOTE_NOTE_MAX, type QuoteContact, type QuoteListItem, type QuoteRequestItem } from "@/domain/types";
import { isValidEmail, isValidPhone } from "./validation";

export const QUOTE_MAX_QTY = 9999;
export const QUOTE_MESSAGE_MAX = 1000;

/** Quantidade entre 1 e o máximo (inteiro). */
export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(QUOTE_MAX_QTY, Math.floor(qty)));
}

/** Observação do item: no máximo 500 caracteres. */
export function clampNote(note: string): string {
  return note.slice(0, QUOTE_NOTE_MAX);
}

/** Adiciona o produto à lista (soma a quantidade se já estiver) ou devolve a mesma lista se a quantidade for inválida. Itens configurados não entram na soma. */
export function addToList(list: QuoteListItem[], productId: string, qty = 1): QuoteListItem[] {
  const n = clampQty(qty);
  const existing = list.find((i) => i.id === productId && !i.configurado);
  if (existing) return list.map((i) => (i === existing ? { ...i, qty: clampQty(i.qty + n) } : i));
  return [...list, { id: productId, productId, qty: n, note: "", configurado: false }];
}

/** Protocolo simulado: ORC-AAAAMMDD-XXXXX (data do envio + 5 caracteres; não repete um protocolo já usado). */
export function makeProtocol(now: Date, used: ReadonlySet<string>): string {
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  let seed = now.getTime();
  for (;;) {
    const code = seed.toString(36).toUpperCase().slice(-5).padStart(5, "0");
    const id = `ORC-${ymd}-${code}`;
    if (!used.has(id)) return id;
    seed += 1;
  }
}

export type ContactForm = { name: string; company: string; email: string; whatsapp: string; city: string; state: string; application: string; message: string };
export const EMPTY_CONTACT: ContactForm = { name: "", company: "", email: "", whatsapp: "", city: "", state: "", application: "", message: "" };

/** Valida o formulário de envio. Chaves de erro = nomes dos campos. */
export function validateContact(f: ContactForm, applications: readonly string[]): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.name.trim().length < 2) e.name = "Informe seu nome";
  if (!isValidEmail(f.email)) e.email = "E-mail inválido";
  if (!isValidPhone(f.whatsapp)) e.whatsapp = "WhatsApp inválido";
  if (f.city.trim().length < 2) e.city = "Informe a cidade de entrega";
  if (!/^[A-Za-zÀ-ÿ]{2}$/.test(f.state.trim())) e.state = "UF inválida";
  if (!applications.includes(f.application)) e.application = "Escolha a aplicação";
  if (f.message.length > QUOTE_MESSAGE_MAX) e.message = `A mensagem pode ter até ${QUOTE_MESSAGE_MAX} caracteres`;
  return e;
}

export function toContact(f: ContactForm): QuoteContact {
  return {
    name: f.name.trim(),
    ...(f.company.trim() ? { company: f.company.trim() } : {}),
    email: f.email.trim(),
    whatsapp: f.whatsapp,
    city: f.city.trim(),
    state: f.state.trim().toUpperCase(),
    application: f.application,
    message: f.message.trim(),
  };
}

/** Mensagem pronta para o WhatsApp: itens, quantidades e observações (e o nome, se já digitado). */
export function whatsappMessage(storeName: string, items: readonly Pick<QuoteRequestItem, "name" | "sku" | "qty" | "note">[], contactName?: string): string {
  const lines = [`Olá! Gostaria de um orçamento na ${storeName}:`, ""];
  items.forEach((i, n) => {
    lines.push(`${n + 1}. ${i.name} (${i.sku}) — ${i.qty} ${i.qty === 1 ? "unidade" : "unidades"}`);
    if (i.note.trim()) lines.push(`   Observações: ${i.note.trim()}`);
  });
  if (contactName?.trim()) lines.push("", `Nome: ${contactName.trim()}`);
  return lines.join("\n");
}

/** Endereço do WhatsApp com a mensagem (só usado quando o número é real). */
export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
