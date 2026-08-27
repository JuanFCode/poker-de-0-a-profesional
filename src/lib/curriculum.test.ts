import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_LESSONS, CURRICULUM, findLesson, lessonId, neighbours, TOTAL_LESSONS } from "./curriculum";
import { LESSON_CONTENT } from "@/content/registry";

const contentDir = path.resolve(import.meta.dirname, "../content");

describe("temario", () => {
  it("tiene siete fases numeradas en orden", () => {
    expect(CURRICULUM).toHaveLength(7);
    CURRICULUM.forEach((module, index) => expect(module.index).toBe(index));
  });

  it("no repite slugs de módulo ni de lección dentro del módulo", () => {
    const moduleSlugs = CURRICULUM.map((m) => m.slug);
    expect(new Set(moduleSlugs).size).toBe(moduleSlugs.length);
    for (const module of CURRICULUM) {
      const slugs = module.lessons.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("numera las lecciones de 1 a N sin huecos", () => {
    expect(ALL_LESSONS.map((ref) => ref.position)).toEqual(
      Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1),
    );
  });
});

describe("contenido", () => {
  it("cada lección del temario tiene su MDX registrado y en disco", () => {
    for (const { module, lesson } of ALL_LESSONS) {
      const id = lessonId(module.slug, lesson.slug);
      expect(LESSON_CONTENT[id], `falta el registro de ${id}`).toBeTypeOf("function");
      expect(
        existsSync(path.join(contentDir, `${id}.mdx`)),
        `falta el fichero ${id}.mdx`,
      ).toBe(true);
    }
  });

  it("no hay MDX registrados que el temario no incluya", () => {
    const known = new Set(ALL_LESSONS.map(({ module, lesson }) => lessonId(module.slug, lesson.slug)));
    for (const id of Object.keys(LESSON_CONTENT)) expect(known.has(id)).toBe(true);
  });
});

describe("navegación", () => {
  it("encuentra una lección por sus dos slugs", () => {
    expect(findLesson("reglas", "como-se-juega")?.lesson.title).toBe("Cómo se juega una mano");
    expect(findLesson("reglas", "no-existe")).toBeUndefined();
  });

  it("enlaza las lecciones en cadena, incluso entre módulos", () => {
    const first = ALL_LESSONS[0];
    expect(neighbours(first.module.slug, first.lesson.slug).previous).toBeNull();

    const last = ALL_LESSONS[TOTAL_LESSONS - 1];
    expect(neighbours(last.module.slug, last.lesson.slug).next).toBeNull();

    // La última de "reglas" enlaza con la primera de "preflop".
    const bridge = neighbours("reglas", "errores-de-principiante");
    expect(bridge.next?.module.slug).toBe("preflop");
  });
});
