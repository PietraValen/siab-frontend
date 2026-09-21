type CardProps = {
  titulo: string;
  valor: string | number;
};

/** Espelha o componente "Card" de KPI do design system (painel admin). */
export function Card({ titulo, valor }: CardProps) {
  return (
    <div className="flex min-h-30 flex-1 flex-col justify-between gap-md rounded-lg bg-bg-panel p-lg">
      <span className="font-mono text-xs font-medium uppercase tracking-wide text-outline">
        {titulo}
      </span>
      <span className="font-mono text-[28px] font-semibold tracking-tight text-text-primary">
        {valor}
      </span>
    </div>
  );
}
