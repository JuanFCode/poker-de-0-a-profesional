import type { Metadata } from "next";
import { RutaContent } from "./ruta-content";

export const metadata: Metadata = {
  title: "La ruta completa",
  description:
    "Las seis fases del curso, lección a lección, con tu progreso guardado en el navegador.",
};

export default function RutaPage() {
  return <RutaContent />;
}
