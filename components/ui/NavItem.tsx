import Link from "next/link";

type NavItemProps = {
  href: string;
  label: string;
  active?: boolean;
};

/** Espelha o componente "NavItem" do Figma (State=Default/Active). */
export function NavItem({ href, label, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-md py-2.5 text-sm transition-colors ${
        active
          ? "bg-accent-subtle font-semibold text-accent-default"
          : "font-medium text-text-secondary hover:text-text-primary"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-default" : "bg-text-secondary"}`}
        aria-hidden
      />
      {label}
    </Link>
  );
}
