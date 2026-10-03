"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Botão "Copiar" para valores mostrados uma única vez (chave de terminal,
 * segredo do MFA). Fica fora de components/ui porque usa a API de
 * clipboard do navegador (comportamento, não só apresentação).
 */
export function CopyButton({ valor, rotulo = "Copiar" }: { valor: string; rotulo?: string }) {
  const [estado, setEstado] = useState<"idle" | "copiado" | "erro">("idle");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setEstado("copiado");
    } catch {
      // Sem permissão de clipboard (ex.: página fora de HTTPS): o valor
      // continua visível na tela para copiar manualmente.
      setEstado("erro");
    }
    setTimeout(() => setEstado("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`${rotulo}: copiar para a área de transferência`}
      className="flex shrink-0 items-center gap-xs rounded-sm bg-bg-chip-strong px-sm py-xs font-mono text-xs text-text-primary transition-colors hover:text-accent-default"
    >
      <Icon name={estado === "copiado" ? "check" : "content_copy"} className="text-[16px]" />
      <span>{estado === "copiado" ? "Copiado" : estado === "erro" ? "Copie manualmente" : rotulo}</span>
    </button>
  );
}
