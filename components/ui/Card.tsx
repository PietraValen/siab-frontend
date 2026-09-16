type CardProps = {
  titulo: string;
  valor: string | number;
};

/** Espelha o componente "Card" do Figma (usado nos KPIs do painel admin). */
export function Card({ titulo, valor }: CardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-lg">
      <span className="text-[13px] font-medium text-text-secondary">{titulo}</span>
      <span className="text-[28px] font-semibold text-text-primary">{valor}</span>
    </div>
  );
}
