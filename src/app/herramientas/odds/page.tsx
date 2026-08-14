import type { Metadata } from "next";
import { OddsTool } from "./odds-tool";

export const metadata: Metadata = {
  title: "Odds y equity",
  description:
    "Pot odds, outs con la regla del 2 y el 4, y simulación de equity mano contra mano o contra un rango completo.",
};

export default function OddsPage() {
  return <OddsTool />;
}
