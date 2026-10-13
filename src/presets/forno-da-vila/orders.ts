import type { Order, Product } from "@/domain/types";
import { order, orderItem } from "../helpers";
import { products } from "./products";

function p(id: string): Product {
  const found = products.find((x) => x.id === id);
  if (!found) throw new Error(`Produto inexistente no preset: ${id}`);
  return found;
}
function v(productId: string, sku: string) {
  const found = p(productId).variants.find((x) => x.sku === sku);
  if (!found) throw new Error(`Variante inexistente no preset: ${sku}`);
  return found;
}

const customers = {
  marta: { name: "Marta Alves (demo)", email: "marta@example.com", phone: "(11) 90000-0011" },
  paulo: { name: "Paulo Nunes (demo)", email: "paulo@example.com", phone: "(11) 90000-0012" },
  lia: { name: "Lia Prado (demo)", email: "lia@example.com", phone: "(11) 90000-0013" },
  rui: { name: "Rui Castro (demo)", email: "rui@example.com", phone: "(11) 90000-0014" },
};

export const orders: Order[] = [
  order({
    id: "FV-2001", status: "aguardando_pagamento", createdAt: "2026-03-12T11:20:00-03:00",
    items: [orderItem(p("fv-001"), 1, v("fv-001", "FV-LAS-800"))],
    customer: customers.marta,
    delivery: { type: "entrega", address: "Rua das Palmeiras, 80 — São Paulo/SP", shipping: 990 },
    payment: { method: "pix" },
  }),
  order({
    id: "FV-2002", status: "pago", createdAt: "2026-03-12T12:05:00-03:00",
    items: [orderItem(p("fv-008"), 1, v("fv-008", "FV-BRI-12")), orderItem(p("fv-014"), 2, v("fv-014", "FV-SLA-300"))],
    customer: customers.paulo,
    delivery: { type: "retirada" },
    payment: { method: "pix" },
  }),
  order({
    id: "FV-2003", status: "em_separacao", createdAt: "2026-03-12T09:40:00-03:00",
    items: [orderItem(p("fv-002"), 2, v("fv-002", "FV-FEI-1500")), orderItem(p("fv-009"), 1, v("fv-009", "FV-BCC-1000"))],
    customer: customers.lia,
    delivery: { type: "entrega", address: "Av. Brasil, 1200 — São Paulo/SP", shipping: 0 },
    payment: { method: "cartao", installments: 1 },
  }),
  order({
    id: "FV-2004", status: "enviado", createdAt: "2026-03-12T10:15:00-03:00",
    items: [orderItem(p("fv-004"), 1), orderItem(p("fv-011"), 2)],
    customer: customers.rui,
    delivery: { type: "entrega", address: "Rua do Mercado, 15 — São José dos Pinhais/PR", shipping: 1290 },
    payment: { method: "pix" },
  }),
  order({
    id: "FV-2005", status: "entregue", createdAt: "2026-03-09T18:30:00-03:00",
    items: [orderItem(p("fv-003"), 2)],
    customer: customers.marta,
    delivery: { type: "entrega", address: "Rua das Palmeiras, 80 — São Paulo/SP", shipping: 0 },
    payment: { method: "cartao", installments: 1 },
  }),
  order({
    id: "FV-2006", status: "cancelado", createdAt: "2026-03-10T13:00:00-03:00",
    items: [orderItem(p("fv-007"), 1)],
    customer: customers.paulo,
    delivery: { type: "retirada" },
    payment: { method: "pix" },
  }),
  order({
    id: "FV-2007", status: "entregue", createdAt: "2026-03-07T19:10:00-03:00",
    items: [orderItem(p("fv-005"), 1), orderItem(p("fv-013"), 4), orderItem(p("fv-016"), 2)],
    customer: customers.lia,
    delivery: { type: "retirada" },
    payment: { method: "pix" },
  }),
  order({
    id: "FV-2008", status: "pago", createdAt: "2026-03-12T14:00:00-03:00",
    items: [orderItem(p("fv-006"), 1), orderItem(p("fv-012"), 3)],
    customer: customers.rui,
    delivery: { type: "entrega", address: "Rua do Mercado, 15 — São José dos Pinhais/PR", shipping: 1290 },
    payment: { method: "cartao", installments: 1 },
  }),
];
