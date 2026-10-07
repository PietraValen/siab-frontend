type StatusPillProps = {
  tipo: "concedido" | "negado";
  texto?: string;
};

// Classes completas e estáticas (não construídas em runtime) — o Tailwind
// só reconhece classes que aparecem por extenso no código-fonte. Pills
// totalmente arredondadas são proibidas para badges de status pelo design
// system — usamos rounded-sm (4px) com preenchimento e borda sutis.
const styles = {
  concedido: {
    wrapper: "text-status-success bg-status-success/10 border-status-success/40",
    dot: "bg-status-success",
  },
  negado: {
    wrapper: "text-status-danger bg-status-danger/10 border-status-danger/40",
    dot: "bg-status-danger",
  },
} as const;

/** Espelha o componente "StatusPill" do design system (Tipo=Concedido/Negado). */
export function StatusPill({ tipo, texto }: StatusPillProps) {
  const isConcedido = tipo === "concedido";
  const s = styles[tipo];

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-sm border px-md py-sm font-mono text-sm font-semibold uppercase tracking-wide ${s.wrapper}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {texto ?? (isConcedido ? "Acesso Concedido" : "Acesso Negado")}
    </span>
  );
}
