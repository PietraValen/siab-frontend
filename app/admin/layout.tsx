"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavItem } from "@/components/ui/NavItem";
import { Icon } from "@/components/ui/Icon";
import { useRelogio } from "@/hooks/useRelogio";
import { obterSessao, sair } from "@/lib/auth";
import type { Sessao } from "@/lib/types";

function RelogioAoVivo() {
  const agora = useRelogio();

  if (!agora) return null;

  return (
    <div className="hidden flex-col text-right md:flex">
      <span className="font-mono text-xs text-text-primary">
        {agora.toLocaleTimeString("pt-BR", { hour12: false })} BRT
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-outline">
        UTC-3 sincronizado
      </span>
    </div>
  );
}

/**
 * Layout compartilhado por todas as páginas de /admin.
 *
 * Guard de autenticação: pergunta ao back-end se há uma sessão válida
 * (GET /api/admin/sessao, autenticado pelo cookie HttpOnly — ver
 * lib/auth.ts) e redireciona para /login se não houver. Enquanto a
 * resposta não chega, nada do painel é renderizado, para não piscar o
 * conteúdo antes do redirect. Isso é só UX: cada chamada do painel é
 * validada de novo pelo back-end.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    let ativo = true;
    obterSessao().then((s) => {
      if (!ativo) return;
      if (s) {
        setSessao(s);
      } else {
        router.replace("/login");
      }
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  async function handleSair() {
    await sair();
    router.replace("/login");
  }

  if (!sessao) return null;

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <aside className="fixed left-0 top-0 flex h-full w-64 flex-col justify-between gap-lg bg-bg-panel p-md">
        <div className="flex flex-col gap-lg">
          <div className="flex items-center gap-sm pb-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-default text-sm font-bold text-bg-primary">
              S
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-bold tracking-tight text-text-primary">
                SIAB ADMIN
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-wider text-outline">
                APS — PIVC — UNIP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-xs rounded-sm bg-bg-chip px-sm py-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-status-success" />
            <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
              Sessão ativa
            </span>
          </div>

          <nav className="flex flex-col gap-xs">
            <NavItem
              href="/admin"
              label="Usuários"
              active={pathname === "/admin"}
              icon={<Icon name="badge" className="text-[20px]" />}
            />
            <NavItem
              href="/admin/enroll"
              label="Cadastrar Biometria"
              active={pathname === "/admin/enroll"}
              icon={<Icon name="face" className="text-[20px]" />}
            />
            <NavItem
              href="/admin/logs"
              label="Logs de Acesso"
              active={pathname === "/admin/logs"}
              icon={<Icon name="history_toggle_off" className="text-[20px]" />}
            />
            <NavItem
              href="/admin/reports"
              label="Relatórios"
              active={pathname === "/admin/reports"}
              icon={<Icon name="analytics" className="text-[20px]" />}
            />
            <NavItem
              href="/admin/terminais"
              label="Terminais"
              active={pathname === "/admin/terminais"}
              icon={<Icon name="sensor_door" className="text-[20px]" />}
            />
            <NavItem
              href="/admin/seguranca"
              label="Segurança da Conta"
              active={pathname === "/admin/seguranca"}
              icon={<Icon name="shield_lock" className="text-[20px]" />}
            />
          </nav>
        </div>

        <div className="flex flex-col gap-sm rounded-sm bg-bg-chip p-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">
              Credencial Operador
            </span>
            <span className="rounded-sm bg-bg-primary px-xs py-0.5 font-mono text-[10px] text-status-success">
              TLS 1.3
            </span>
          </div>
          <span className="truncate font-mono text-xs text-text-primary">{sessao.username}</span>
          <div className="flex items-center justify-between pt-xs">
            <span
              className={`font-mono text-[10px] uppercase tracking-wide ${
                sessao.mfaAtivo ? "text-status-success" : "text-status-warning"
              }`}
            >
              {sessao.mfaAtivo ? "MFA ativo" : "MFA desativado"}
            </span>
            <button
              type="button"
              onClick={handleSair}
              className="flex items-center gap-xs font-mono text-xs text-status-danger transition-colors hover:text-text-primary"
            >
              <Icon name="logout" className="text-[16px]" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-default bg-bg-primary/90 px-2xl backdrop-blur">
          <div className="flex items-center gap-sm">
            <div className="flex items-center gap-xs rounded-sm bg-bg-panel px-sm py-xs">
              <Icon name="dns" className="text-[18px] text-accent-default" />
              <span className="font-mono text-xs uppercase font-medium text-accent-default">
                Nó SRV-04 Ativo
              </span>
            </div>
            <div className="hidden items-center gap-xs rounded-sm bg-bg-panel px-sm py-xs sm:flex">
              <Icon name="lock" className="text-[18px] text-outline" />
              <span className="font-mono text-xs text-text-muted">AES-256-GCM</span>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <RelogioAoVivo />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-default">
              <Icon name="person" className="text-[18px] text-bg-primary" />
            </div>
          </div>
        </header>
        <main className="p-2xl">{children}</main>
      </div>
    </div>
  );
}
