import type { Metadata } from "next";
import { QuizTool } from "./quiz-tool";

export const metadata: Metadata = {
  title: "Quiz de reglas",
  description:
    "Preguntas de reglas, ranking de manos, posición, matemáticas y bankroll con repetición espaciada: te repite justo lo que fallas.",
};

export default function QuizPage() {
  return <QuizTool />;
}
