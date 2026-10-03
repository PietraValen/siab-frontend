import { useSyncExternalStore } from "react";

const semAssinatura = () => () => {};

/**
 * true só depois que o componente roda no navegador (false durante o SSR e
 * a hidratação). Útil para ler APIs que só existem no cliente, como
 * localStorage, sem chamar setState dentro de um useEffect.
 */
export function useMontado(): boolean {
  return useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false,
  );
}
