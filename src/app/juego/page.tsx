import type { Metadata } from "next";
import { GameTool } from "./game-tool";

export const metadata: Metadata = {
  title: "Jugar una mano",
  description:
    "Mesa de Texas Hold'em contra rivales que juegan con los rangos del curso, con un entrenador que te explica cada decisión: rango, equity y pot odds.",
};

export default function JuegoPage() {
  return <GameTool />;
}
