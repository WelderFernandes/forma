"use client";

import * as React from "react";
import { markTipRead } from "@/server/actions/wellbeing";

/**
 * Marca a dica como lida assim que a página de detalhe é aberta.
 * O componente não renderiza nada: serve apenas como gatilho do registro.
 */
export function MarkTipRead({ tipId }: { tipId: string }) {
  React.useEffect(() => {
    void markTipRead(tipId);
  }, [tipId]);

  return null;
}
