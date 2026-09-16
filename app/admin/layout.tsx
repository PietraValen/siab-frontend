"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavItem } from "@/components/ui/NavItem";
import { obterToken, tokenValido } from "@/lib/auth";

/**
 * Layout compartilhado por /admin, /admin/logs e /admin/reports.
 *
 * Guard de autenticação: redireciona para /login se não houver um token
 * válido em localStorage (ver lib/auth.ts). A checagem só pode rodar no
 * cliente (localStorage não existe durante SSR), por isso o estado
 * "verificando" evita piscar o conteúdo do painel antes do redirect.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    if (tokenValido(obterToken())) {
      setAutorizado(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!autorizado) return null;

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <aside className="flex w-[260px] flex-col gap-2 border-r border-border-default bg-bg-surface p-lg">
        <span className="mb-lg text-xl font-bold text-accent-default">SIAB</span>
        <NavItem href="/admin" label="Usuários" active={pathname === "/admin"} />
        <NavItem href="/admin/logs" label="Logs de Acesso" active={pathname === "/admin/logs"} />
        <NavItem href="/admin/reports" label="Relatórios" active={pathname === "/admin/reports"} />
      </aside>
      <main className="flex-1 p-2xl">{children}</main>
    </div>
  );
}
