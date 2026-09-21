import { type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/**
 * Espelha o componente "Button" do Figma (página Components), variantes
 * Style=Primary/Secondary x State=Default/Disabled.
 */
export function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-lg py-md text-[15px] font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    // Primário: fundo teal com texto escuro (#0a0d11) para contraste — regra
    // do design system para botões de execução primária (Autenticar/Cadastrar).
    primary: "bg-accent-default text-bg-primary hover:opacity-90",
    secondary:
      "bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-surface",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
