import { type InputHTMLAttributes, useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Fonte monoespaçada — obrigatória pelo design system para identificadores
   * (usuário/matrícula, chaves, códigos), mas não para texto livre. */
  mono?: boolean;
};

/** Espelha o componente "Input" do design system (página Components). */
export function Input({ label, id, className = "", mono = false, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-md border border-border-default bg-bg-elevated px-md py-sm text-sm text-text-primary placeholder:text-outline focus:border-accent-default focus:outline-none ${mono ? "font-mono" : ""} ${className}`}
        {...props}
      />
    </div>
  );
}
