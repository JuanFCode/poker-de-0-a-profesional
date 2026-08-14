import type { Metadata } from "next";
import { RangeTrainer } from "./range-trainer";

export const metadata: Metadata = {
  title: "Entrenador de rangos",
  description:
    "Las 169 manos preflop por posición, con modo test para memorizar qué abrir desde cada silla.",
};

export default function RangosPage() {
  return <RangeTrainer />;
}
