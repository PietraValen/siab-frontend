import { type InputHTMLAttributes, useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

/** Espelha o componente "Input" do Figma (página Components). */
export function Input({ label, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={inputId} className="text-[13px] font-medium text-text-secondary">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-md border border-border-default bg-bg-elevated px-md py-sm text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-default ${className}`}
        {...props}
      />
    </div>
  );
}
