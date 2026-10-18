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
  ana: { name: "Ana Souza (demo)", email: "ana@example.com", phone: "(11) 90000-0001" },
  bruno: { name: "Bruno Lima (demo)", email: "bruno@example.com", phone: "(11) 90000-0002" },
  carla: { name: "Carla Dias (demo)", email: "carla@example.com", phone: "(21) 90000-0003" },
  diego: { name: "Diego Ramos (demo)", email: "diego@example.com", phone: "(31) 90000-0004" },
};

export const orders: Order[] = [
  order({
    id: "OR-1001", status: "aguardando_pagamento", createdAt: "2026-03-10T14:20:00-03:00",
    items: [orderItem(p("orb-001"), 1, v("orb-001", "ORB-FST-Pro-PR"))],
    customer: customers.ana,
    delivery: { type: "entrega", address: "Rua das Flores, 10 — São Paulo/SP", shipping: 2490 },
    payment: { method: "boleto" },
  }),
  order({
    id: "OR-1002", status: "pago", createdAt: "2026-03-10T16:45:00-03:00",
    items: [orderItem(p("orb-011"), 2), orderItem(p("orb-012"), 1)],
    customer: customers.bruno,
    delivery: { type: "entrega", address: "Av. Central, 200 — Campinas/SP", shipping: 0 },
    payment: { method: "cartao", installments: 3 },
  }),
  order({
    id: "OR-1003", status: "em_separacao", createdAt: "2026-03-11T09:10:00-03:00",
    items: [orderItem(p("orb-007"), 1, v("orb-007", "ORB-SWS-41mm-GF"))],
    customer: customers.carla,
    delivery: { type: "entrega", address: "Rua do Sol, 55 — Rio de Janeiro/RJ", shipping: 2990 },
    payment: { method: "pix" },
  }),
  order({
    id: "OR-1004", status: "enviado", createdAt: "2026-03-08T11:00:00-03:00",
    items: [orderItem(p("orb-004"), 1)],
    customer: customers.diego,
    delivery: { type: "entrega", address: "Rua Verde, 7 — Belo Horizonte/MG", shipping: 0 },
    payment: { method: "cartao", installments: 6 },
  }),
  order({
    id: "OR-1005", status: "entregue", createdAt: "2026-03-01T10:30:00-03:00",
    items: [orderItem(p("orb-002"), 1, v("orb-002", "ORB-FAR-Padrão-BR"))],
    customer: customers.ana,
    delivery: { type: "entrega", address: "Rua das Flores, 10 — São Paulo/SP", shipping: 2490 },
    payment: { method: "pix" },
  }),
  order({
    id: "OR-1006", status: "cancelado", createdAt: "2026-03-05T18:05:00-03:00",
    items: [orderItem(p("orb-006"), 1)],
    customer: customers.bruno,
    delivery: { type: "entrega", address: "Av. Central, 200 — Campinas/SP", shipping: 2490 },
    payment: { method: "boleto" },
  }),
  order({
    id: "OR-1007", status: "entregue", createdAt: "2026-02-26T13:15:00-03:00",
    items: [orderItem(p("orb-009"), 1, v("orb-009", "ORB-SWP-45mm-PR")), orderItem(p("orb-010"), 1)],
    customer: customers.diego,
    delivery: { type: "entrega", address: "Rua Verde, 7 — Belo Horizonte/MG", shipping: 0 },
    payment: { method: "cartao", installments: 2 },
  }),
  order({
    id: "OR-1008", status: "pago", createdAt: "2026-03-11T08:00:00-03:00",
    items: [orderItem(p("orb-013"), 2), orderItem(p("orb-015"), 1)],
    customer: customers.carla,
    delivery: { type: "entrega", address: "Rua do Sol, 55 — Rio de Janeiro/RJ", shipping: 2990 },
    payment: { method: "pix" },
  }),
];
