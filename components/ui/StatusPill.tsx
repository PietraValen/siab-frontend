type StatusPillProps = {
  tipo: "concedido" | "negado";
  texto?: string;
};

// Classes completas e estáticas (não construídas em runtime) — o Tailwind
// só reconhece classes que aparecem por extenso no código-fonte.
const styles = {
  concedido: {
    wrapper: "text-status-success bg-status-success-bg",
    dot: "bg-status-success",
  },
  negado: {
    wrapper: "text-status-danger bg-status-danger-bg",
    dot: "bg-status-danger",
  },
} as const;

/** Espelha o componente "StatusPill" do Figma (Tipo=Concedido/Negado). */
export function StatusPill({ tipo, texto }: StatusPillProps) {
  const isConcedido = tipo === "concedido";
  const s = styles[tipo];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-md py-sm text-sm font-semibold ${s.wrapper}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {texto ?? (isConcedido ? "Acesso Concedido" : "Acesso Negado")}
    </span>
  );
}
