import type { NivelAcessoNome } from "@/lib/types";

const styles: Record<NivelAcessoNome, string> = {
  "Acesso Geral": "text-accent-default bg-accent-subtle",
  Diretoria: "text-status-warning bg-status-warning-bg",
  Ministro: "text-status-danger bg-status-danger-bg",
};

/** Espelha o componente "Badge" do Figma (variantes Nivel=Geral/Diretoria/Ministro). */
export function Badge({ nivel }: { nivel: NivelAcessoNome }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[nivel]}`}
    >
      {nivel === "Acesso Geral" ? "Geral" : nivel}
    </span>
  );
}
