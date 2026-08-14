import { describe, expect, it } from "vitest";
import { QUESTIONS, QUESTION_IDS, TOPICS, questionsByTopic } from "./quiz";

describe("banco de preguntas", () => {
  it("no repite identificadores", () => {
    expect(new Set(QUESTION_IDS).size).toBe(QUESTIONS.length);
  });

  it("cada pregunta tiene opciones válidas y una respuesta dentro de rango", () => {
    for (const question of QUESTIONS) {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(20);
      expect(question.question.endsWith("?")).toBe(true);
    }
  });

  it("cubre todos los temas con varias preguntas", () => {
    for (const topic of TOPICS) {
      expect(questionsByTopic(topic).length).toBeGreaterThanOrEqual(5);
    }
  });
});
