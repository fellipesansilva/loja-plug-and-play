"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { useMemo } from "react";
import type { Product } from "@/domain/types";
import { accessFor, formatWorkload, isCourse, totalMinutes } from "@/lib/courses";
import { useDemoStore } from "@/store/demo-store";

/** Ementa do curso na página do produto (módulo `cursos`): instrutor, carga horária e a lista de aulas. Produto sem curso: nada. */
export function CourseSyllabus({ product }: { product: Product }) {
  const texts = useDemoStore((s) => s.config.cursos);
  const orders = useDemoStore((s) => s.orders);
  const access = useMemo(() => accessFor(orders, product.id), [orders, product.id]);
  if (!isCourse(product) || !texts) return null;
  const { course } = product;

  return (
    <section aria-labelledby="ementa" data-testid="course-syllabus">
      <h2 id="ementa" className="text-lg">
        {texts.syllabusTitle}
      </h2>
      <p className="mt-xs inline-flex rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">{texts.demoBadge}</p>
      <dl className="mt-sm divide-y divide-border">
        <div className="flex justify-between gap-md py-sm text-sm">
          <dt className="text-muted">{texts.instructorLabel}</dt>
          <dd className="text-right font-medium" data-testid="course-instructor">
            {course.instructor}
            <span className="block text-xs font-normal text-muted">{course.instructorNote}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-md py-sm text-sm">
          <dt className="text-muted">{texts.workloadLabel}</dt>
          <dd className="text-right font-medium" data-testid="course-workload">
            {formatWorkload(totalMinutes(course))} · {course.lessons.length} aulas
          </dd>
        </div>
      </dl>
      <ol className="mt-sm divide-y divide-border rounded-md border border-border bg-surface" data-testid="course-lessons">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="flex items-baseline justify-between gap-md px-md py-sm text-sm">
            <span>
              <span className="mr-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              {l.title}
            </span>
            <span className="shrink-0 text-muted">{l.minutes} min</span>
          </li>
        ))}
      </ol>
      {access?.status === "liberado" && (
        <Link
          href={`/meus-cursos/${product.slug}`}
          className="mt-md inline-flex min-h-11 items-center rounded-button bg-primary px-lg font-bold text-background"
          data-testid="course-access"
        >
          {texts.accessLabel}
        </Link>
      )}
    </section>
  );
}
