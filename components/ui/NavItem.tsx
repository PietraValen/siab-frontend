import type { ReactNode } from "react";
import Link from "next/link";

type NavItemProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
};

/** Espelha o componente "NavItem" do design system (State=Default/Active). */
export function NavItem({ href, label, icon, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-sm rounded-md px-sm py-sm text-sm transition-colors ${
        active
          ? "bg-accent-default/15 font-semibold text-accent-default"
          : "font-medium text-text-secondary hover:bg-bg-chip hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
