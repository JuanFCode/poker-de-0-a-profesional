import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_LESSONS, findLesson, lessonId, neighbours } from "@/lib/curriculum";
import { LESSON_CONTENT } from "@/content/registry";
import { LessonComplete } from "@/components/lesson-complete";

type Params = { modulo: string; leccion: string };

export function generateStaticParams(): Params[] {
  return ALL_LESSONS.map(({ module, lesson }) => ({
    modulo: module.slug,
    leccion: lesson.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { modulo, leccion } = await params;
  const ref = findLesson(modulo, leccion);
  if (!ref) return {};
  return {
    title: ref.lesson.title,
    description: ref.lesson.summary,
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { modulo, leccion } = await params;
  const ref = findLesson(modulo, leccion);
  const id = lessonId(modulo, leccion);
  const load = LESSON_CONTENT[id];

  if (!ref || !load) notFound();

  const { default: Content } = await load();
  const { previous, next } = neighbours(modulo, leccion);
  const { module, lesson, position } = ref;

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <nav className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
        <Link href="/ruta" className="hover:text-brass-300">
          La ruta
        </Link>
        <span aria-hidden>/</span>
        <span className="text-brass-300">
          Fase {module.index} · {module.title}
        </span>
        <span aria-hidden>/</span>
        <span>
          Lección {position} de {ALL_LESSONS.length}
        </span>
      </nav>

      <header className="mt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.05] tracking-tight text-cream">
          {lesson.title}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-cream-dim">{lesson.summary}</p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-faint">
          {lesson.minutes} min de lectura
        </p>
      </header>

      <div className="rule-brass my-10" />

      <div className="prose prose-invert prose-poker max-w-none prose-headings:font-display prose-p:leading-[1.75] prose-li:leading-[1.7] prose-strong:font-semibold">
        <Content />
      </div>

      {lesson.practice && (
        <Link
          href={lesson.practice.href}
          className="surface surface-hover mt-12 flex items-center justify-between gap-4 rounded-xl p-6"
        >
          <span>
            <span className="eyebrow">Ahora practícalo</span>
            <span className="mt-2 block font-display text-xl text-cream">
              {lesson.practice.label}
            </span>
          </span>
          <span aria-hidden className="font-mono text-brass-400">
            →
          </span>
        </Link>
      )}

      <LessonComplete id={id} nextHref={next?.href ?? "/ruta"} />

      <nav className="mt-10 grid gap-3 border-t border-brass-500/15 pt-8 sm:grid-cols-2">
        {previous ? (
          <Link
            href={previous.href}
            className="group rounded-lg border border-brass-500/15 p-4 transition-colors hover:border-brass-500/40"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
              ← Anterior
            </span>
            <span className="mt-1.5 block text-[15px] text-cream group-hover:text-brass-200">
              {previous.lesson.title}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={next.href}
            className="group rounded-lg border border-brass-500/15 p-4 text-right transition-colors hover:border-brass-500/40 sm:col-start-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
              Siguiente →
            </span>
            <span className="mt-1.5 block text-[15px] text-cream group-hover:text-brass-200">
              {next.lesson.title}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
