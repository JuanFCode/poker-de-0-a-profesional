import type { Metadata } from "next";
import { PushFoldTool } from "./push-fold-tool";

export const metadata: Metadata = {
  title: "Push o fold: torneo con stack corto",
  description:
    "Con qué manos entras all-in, con cuáles pagas y con cuáles resubes all-in según las ciegas que te quedan, tu silla y la del rival. Con los ajustes por bounty y por ICM.",
};

export default function TorneoPage() {
  return <PushFoldTool />;
}
