"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import type { Order } from "@/domain/types";
import { isCourse } from "@/lib/courses";
import { useDemoStore } from "@/store/demo-store";

/** Cursos do pedido (módulo cursos): com o pagamento aprovado, o botão "Acessar curso"; sem ele, o aviso de que o curso segue bloqueado. */
export function CourseAccess({ order }: { order: Order }) {
  const texts = useDemoStore((s) => s.config.cursos);
  const products = useDemoStore((s) => s.products);
  if (!texts) return null;
  const courses = order.items.flatMap((i) => products.find((p) => p.id === i.productId && isCourse(p)) ?? []);
  if (courses.length === 0) return null;
  const approved = order.status === "pago" || order.status === "entregue";
  if (!approved) {
    return (
      <p role="status" className="rounded-lg border border-warning bg-surface p-md text-sm font-medium" data-testid="order-course-locked">
        {order.status === "cancelado" ? texts.lockedCanceled : texts.lockedAwaiting}
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-success bg-surface p-md" data-testid="order-course-access">
      <ul className="flex flex-col gap-sm">
        {courses.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-sm">
            <span className="font-medium">{c.name}</span>
            <Link
              href={`/meus-cursos/${c.slug}`}
              className="inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background"
              data-testid="course-access"
            >
              {texts.accessLabel}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
