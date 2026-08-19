import type { Metadata } from "next";
import { MesaTool } from "./mesa-tool";

export const metadata: Metadata = {
  title: "La mesa y tu silla",
  description:
    "Mesa de poker interactiva de 2 a 9 jugadores: dónde estás sentado, quién habla antes y después que tú, y cómo sacar información y farolear desde cada posición.",
};

export default function MesaPage() {
  return <MesaTool />;
}
