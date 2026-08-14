/// <reference lib="webworker" />

/**
 * Monte Carlo fuera del hilo principal: con 50.000 manos la página seguiría
 * respondiendo, pero el worker evita cualquier tirón en la interfaz.
 */
import { calculateEquity, type EquityInput, type EquityResult } from "../../../lib/poker/equity";

self.onmessage = (event: MessageEvent<EquityInput>) => {
  const result: EquityResult = calculateEquity(event.data);
  self.postMessage(result);
};
