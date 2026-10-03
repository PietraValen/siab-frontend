import { useSyncExternalStore } from "react";

/**
 * Relógio compartilhado (um único setInterval para todos os componentes que
 * mostram a hora). Implementado como "store externo" com
 * useSyncExternalStore em vez de setState dentro de useEffect, que a regra
 * react-hooks/set-state-in-effect rejeita. No servidor (SSR) a hora é
 * null, para o HTML gerado não divergir do primeiro render no navegador.
 */
let agoraAtual: Date | null = null;
let intervalo: ReturnType<typeof setInterval> | undefined;
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  if (intervalo === undefined) {
    agoraAtual = new Date();
    intervalo = setInterval(() => {
      agoraAtual = new Date();
      ouvintes.forEach((o) => o());
    }, 1000);
  }
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0) {
      clearInterval(intervalo);
      intervalo = undefined;
    }
  };
}

export function useRelogio(): Date | null {
  return useSyncExternalStore(
    inscrever,
    () => agoraAtual,
    () => null,
  );
}
