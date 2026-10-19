"use client";

import { StoreLink as Link } from "@/components/store/StoreLink";
import { useMemo } from "react";
import type { CursosConfig, Lesson } from "@/domain/types";
import {
  accessFor,
  completedLessons,
  formatWorkload,
  isCourse,
  lockedReason,
  nextLesson,
  progressPercent,
  purchasedCourses,
  totalMinutes,
  type CourseProduct,
} from "@/lib/courses";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/use-hydrated";
import { PageTitle } from "./PageTitle";
import { StoreImage } from "./StoreImage";

const linkButton = "inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-lg font-bold text-background hover:opacity-90";
const linkGhost = "inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-surface px-lg font-bold text-text hover:border-primary";

/** Barra de progresso do curso (porcentagem de aulas concluídas). */
function ProgressBar({ percent, label, done, total }: { percent: number; label: string; done: number; total: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-md text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">
          <strong className="text-text" data-testid="course-progress">
            {percent}%
          </strong>{" "}
          · {done} de {total} aulas
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-xs h-2 overflow-hidden rounded-button bg-border"
      >
        <div className="h-full rounded-button bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Loading({ title }: { title: string }) {
  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={title} />
      <h1 className="text-2xl">Carregando…</h1>
    </section>
  );
}

function NotFound({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={title} />
      <h1 className="text-2xl">{text}</h1>
      <Link href="/meus-cursos" className="mt-md inline-flex min-h-11 items-center text-primary underline">
        Voltar para Meus cursos
      </Link>
    </section>
  );
}

/** Curso bloqueado (pedido sem pagamento aprovado): mostra o motivo no lugar do conteúdo. */
function Locked({ product, reason, texts }: { product: CourseProduct; reason: string; texts: CursosConfig }) {
  return (
    <section className="mx-auto w-full max-w-page px-md py-lg" data-testid="course-locked">
      <PageTitle title={product.name} />
      <h1 className="text-3xl">{product.name}</h1>
      <p role="status" className="mt-md rounded-lg border border-warning bg-surface p-md font-medium" data-testid="course-locked-reason">
        {reason}
      </p>
      <Link href="/meus-cursos" className={`${linkGhost} mt-md`}>
        {texts.myCoursesLabel}
      </Link>
    </section>
  );
}

/** Dados comuns das telas do curso: texto da área do aluno, o curso pelo endereço e o acesso dele. */
function useCourse(slug: string) {
  const hydrated = useHydrated();
  const texts = useDemoStore((s) => s.config.cursos);
  const products = useDemoStore((s) => s.products);
  const orders = useDemoStore((s) => s.orders);
  const progress = useDemoStore((s) => s.progress);
  const product = useMemo(() => {
    const p = products.find((x) => x.slug === slug);
    return p && isCourse(p) ? p : undefined;
  }, [products, slug]);
  const access = useMemo(() => (product ? accessFor(orders, product.id) : null), [orders, product]);
  return { hydrated, texts, product, access, progress };
}

/** /meus-cursos: os cursos comprados neste navegador, liberados ou bloqueados (com o motivo). */
export function MyCoursesView() {
  const hydrated = useHydrated();
  const texts = useDemoStore((s) => s.config.cursos);
  const products = useDemoStore((s) => s.products);
  const orders = useDemoStore((s) => s.orders);
  const progress = useDemoStore((s) => s.progress);
  const list = useMemo(() => purchasedCourses(orders, products), [orders, products]);
  if (!texts) return null;
  if (!hydrated) return <Loading title={texts.myCoursesLabel} />;

  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={texts.myCoursesLabel} />
      <h1 className="text-3xl">{texts.myCoursesLabel}</h1>
      <p className="mt-sm max-w-[40rem] text-muted">{texts.intro}</p>

      {list.length === 0 ? (
        <div className="mt-md rounded-lg border border-border bg-surface p-lg" data-testid="my-courses-empty">
          <p>{texts.empty}</p>
          <Link href="/" className={`${linkButton} mt-md`}>
            {texts.emptyCtaLabel}
          </Link>
        </div>
      ) : (
        <ul className="mt-md grid gap-md md:grid-cols-2" data-testid="my-courses">
          {list.map(({ product, access }) => {
            const open = access.status === "liberado";
            const percent = progressPercent(progress, product);
            const done = completedLessons(progress, product).length;
            return (
              <li
                key={product.id}
                data-testid="my-course"
                data-status={access.status}
                className="flex flex-col gap-sm rounded-lg border border-border bg-surface p-md"
              >
                <div className="relative aspect-product overflow-hidden rounded-md border border-border">
                  <StoreImage image={product.images[0]} sizes="(min-width: 768px) 40vw, 100vw" />
                </div>
                <h2 className="text-xl">{product.name}</h2>
                {open ? (
                  <>
                    <ProgressBar percent={percent} label={texts.progressLabel} done={done} total={product.course.lessons.length} />
                    <Link href={`/meus-cursos/${product.slug}`} className={linkButton} data-testid="course-access">
                      {texts.accessLabel}
                    </Link>
                  </>
                ) : (
                  <p role="status" className="rounded-md border border-warning p-sm text-sm font-medium" data-testid="course-locked-reason">
                    {lockedReason(access, texts)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** /meus-cursos/<curso>: lista de aulas e progresso. Sem acesso liberado, mostra o motivo do bloqueio. */
export function CourseAreaView({ slug }: { slug: string }) {
  const { hydrated, texts, product, access, progress } = useCourse(slug);
  if (!texts) return null;
  if (!product || !access) {
    return hydrated ? <NotFound title="Curso" text="Curso não encontrado entre os seus cursos" /> : <Loading title="Curso" />;
  }
  if (access.status !== "liberado") return <Locked product={product} reason={lockedReason(access, texts)} texts={texts} />;

  const total = product.course.lessons.length;
  const done = completedLessons(progress, product);
  const percent = progressPercent(progress, product);
  const next = nextLesson(progress, product);

  return (
    <article className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={product.name} />
      <Link href="/meus-cursos" className="inline-flex min-h-11 items-center text-sm text-primary underline">
        {texts.myCoursesLabel}
      </Link>
      <h1 className="mt-xs text-3xl">{product.name}</h1>
      <p className="mt-xs text-sm text-muted">
        {texts.instructorLabel}: {product.course.instructor} · {texts.workloadLabel}: {formatWorkload(totalMinutes(product.course))}
      </p>

      <div className="mt-md max-w-[40rem]">
        <ProgressBar percent={percent} label={texts.progressLabel} done={done.length} total={total} />
        {next ? (
          <Link href={`/meus-cursos/${product.slug}/aula/${next.id}`} className={`${linkButton} mt-md`} data-testid="course-continue">
            {done.length === 0 ? "Começar" : "Continuar"}: {next.title}
          </Link>
        ) : (
          <p className="mt-md font-bold text-success" data-testid="course-complete">
            Curso concluído
          </p>
        )}
      </div>

      <ol className="mt-lg divide-y divide-border rounded-lg border border-border bg-surface" data-testid="lesson-list">
        {product.course.lessons.map((l, i) => {
          const isDone = done.includes(l.id);
          return (
            <li key={l.id} data-testid="lesson-item" data-done={isDone}>
              <Link
                href={`/meus-cursos/${product.slug}/aula/${l.id}`}
                className="flex min-h-14 items-center justify-between gap-md px-md py-sm hover:bg-border/30"
              >
                <span>
                  <span className="mr-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {l.title}
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {isDone ? <span className="font-bold text-success">✓ {texts.completedLabel}</span> : `${l.minutes} min`}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/** Capa estática da aula: a marca "Aula de demonstração", o número e o título (não há vídeo). */
function LessonCover({ lesson, index, total, texts }: { lesson: Lesson; index: number; total: number; texts: CursosConfig }) {
  return (
    <div
      className="relative flex aspect-video flex-col justify-end overflow-hidden rounded-lg bg-primary p-lg text-background"
      data-testid="lesson-cover"
      role="img"
      aria-label={`${texts.demoLabel}: ${lesson.title}`}
    >
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute -right-6 -top-6 size-48 text-secondary opacity-90">
        <path d="M50 0 L61 39 L100 50 L61 61 L50 100 L39 61 L0 50 L39 39 Z" fill="currentColor" />
      </svg>
      <span className="absolute left-lg top-lg inline-flex rounded-button bg-highlight-bg px-3 py-1 text-xs font-bold uppercase tracking-wide text-highlight-text">
        {texts.demoLabel}
      </span>
      <p className="text-sm font-bold uppercase tracking-widest">
        Aula {index + 1} de {total} · {lesson.minutes} min
      </p>
      <p className="mt-xs max-w-[28rem] font-heading text-2xl leading-tight md:text-4xl">{lesson.title}</p>
    </div>
  );
}

/** /meus-cursos/<curso>/aula/<aula>: capa de demonstração, texto e o botão que marca a aula como concluída. */
export function LessonView({ slug, lessonId }: { slug: string; lessonId: string }) {
  const { hydrated, texts, product, access, progress } = useCourse(slug);
  const completeLesson = useDemoStore((s) => s.completeLesson);
  if (!texts) return null;
  if (!product || !access) {
    return hydrated ? <NotFound title="Aula" text="Curso não encontrado entre os seus cursos" /> : <Loading title="Aula" />;
  }
  if (access.status !== "liberado") return <Locked product={product} reason={lockedReason(access, texts)} texts={texts} />;

  const lessons = product.course.lessons;
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return <NotFound title={product.name} text="Aula não encontrada neste curso" />;
  const lesson = lessons[index];
  const done = completedLessons(progress, product);
  const isDone = done.includes(lesson.id);
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  return (
    <article className="mx-auto w-full max-w-3xl px-md py-lg">
      <PageTitle title={`${lesson.title} · ${product.name}`} />
      <Link href={`/meus-cursos/${product.slug}`} className="inline-flex min-h-11 items-center text-sm text-primary underline">
        {product.name}
      </Link>
      <h1 className="mt-xs text-3xl">{lesson.title}</h1>
      <div className="mt-md">
        <LessonCover lesson={lesson} index={index} total={lessons.length} texts={texts} />
      </div>
      <p className="mt-sm text-sm text-muted" data-testid="lesson-demo-note">
        {texts.demoNote}
      </p>

      <div className="mt-md flex flex-col gap-sm" data-testid="lesson-text">
        {lesson.text.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-lg rounded-lg border border-border bg-surface p-md">
        <ProgressBar percent={progressPercent(progress, product)} label={texts.progressLabel} done={done.length} total={lessons.length} />
        <button
          type="button"
          onClick={() => completeLesson(product.id, lesson.id)}
          disabled={isDone}
          aria-live="polite"
          className="mt-md inline-flex min-h-12 w-full items-center justify-center rounded-button bg-primary px-lg font-bold text-background disabled:cursor-default disabled:bg-success"
          data-testid="lesson-complete"
        >
          {isDone ? `✓ ${texts.completedLabel}` : texts.completeLabel}
        </button>
      </div>

      <nav aria-label="Aulas" className="mt-md flex flex-wrap justify-between gap-sm">
        {prev ? (
          <Link href={`/meus-cursos/${product.slug}/aula/${prev.id}`} className={linkGhost} data-testid="lesson-prev">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/meus-cursos/${product.slug}/aula/${next.id}`} className={linkGhost} data-testid="lesson-next">
            {next.title} →
          </Link>
        ) : (
          <Link href={`/meus-cursos/${product.slug}`} className={linkGhost}>
            {product.name}
          </Link>
        )}
      </nav>
    </article>
  );
}
