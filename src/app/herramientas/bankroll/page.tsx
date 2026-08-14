import type { Metadata } from "next";
import { BankrollTool } from "./bankroll-tool";

export const metadata: Metadata = {
  title: "Tracker de bankroll",
  description:
    "Registra tus sesiones, mira tu curva de resultados, calcula tu win-rate en bb/100 y comprueba si estás jugando por encima de tu bankroll.",
};

export default function BankrollPage() {
  return <BankrollTool />;
}
