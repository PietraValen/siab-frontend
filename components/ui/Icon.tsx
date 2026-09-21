type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

/** Ícone "Material Symbols Outlined" (carregado em app/layout.tsx) — usado
 * nos painéis administrativos e no terminal de reconhecimento para replicar
 * a linguagem visual tática do design system (sensores, cadeados, badges). */
export function Icon({ name, className = "", filled = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
