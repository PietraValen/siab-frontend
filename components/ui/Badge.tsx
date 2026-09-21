import type { NivelAcessoNome } from "@/lib/types";

// Classes completas e estáticas — pills totalmente arredondadas são
// proibidas para badges de status/identidade no design system; usamos
// rounded-sm (4px) com preenchimento e borda sutis na cor do nível.
const styles: Record<NivelAcessoNome, string> = {
  "Acesso Geral": "text-accent-default bg-accent-default/10 border-accent-default/40",
  Diretoria: "text-status-warning bg-status-warning/10 border-status-warning/40",
  Ministro: "text-status-danger bg-status-danger/10 border-status-danger/40",
};

/** Espelha o componente "Badge" do design system (variantes Nivel=Geral/Diretoria/Ministro). */
export function Badge({ nivel }: { nivel: NivelAcessoNome }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${styles[nivel]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {nivel === "Acesso Geral" ? "Geral" : nivel}
    </span>
  );
}
