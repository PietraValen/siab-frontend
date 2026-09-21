"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { salvarToken } from "@/lib/auth";

/**
 * Tela /login — acesso ao painel administrativo. Fluxo:
 * 1. Autentica via POST /api/auth/login
 * 2. Guarda o token (ver lib/auth.ts — limitação de usar localStorage
 *    documentada lá)
 * 3. Redireciona para /admin, onde o guard em app/admin/layout.tsx passa a
 *    deixar entrar
 */
export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    setMensagem(null);

    try {
      const { token } = await api.login(usuario, senha);
      salvarToken(token);
      router.push("/admin");
    } catch (err) {
      setStatus("erro");
      setMensagem(err instanceof Error ? err.message : "Erro ao autenticar.");
    }
  }

  const enviando = status === "enviando";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg md:p-2xl">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-lg lg:grid-cols-12">
        {/* Painel principal de autenticação */}
        <div className="flex flex-col justify-between rounded-lg bg-bg-panel p-xl lg:col-span-7">
          <div>
            <div className="mb-lg flex items-center justify-between rounded-sm bg-bg-primary px-md py-sm">
              <div className="flex items-center gap-sm">
                <Icon name="security" filled className="text-[20px] text-accent-default" />
                <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
                  SIAB // NÚCLEO ADMINISTRATIVO
                </span>
              </div>
              <div className="flex items-center gap-xs rounded-sm bg-bg-chip px-sm py-0.5">
                <span className="h-2 w-2 rounded-full bg-status-success" />
                <span className="font-mono text-xs text-text-muted">HOST: SIAB-SEC-NODE-04</span>
              </div>
            </div>

            <div className="mb-lg">
              <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-accent-default">
                Controle de Acesso Lógico Nível 4
              </span>
              <h1 className="mb-sm text-2xl font-semibold text-text-primary">
                Acesso Restrito ao Painel Administrativo
              </h1>
              <div className="mt-md rounded-sm bg-bg-chip p-md">
                <div className="flex items-start gap-sm">
                  <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-accent-default" />
                  <p className="text-sm leading-relaxed text-text-muted">
                    Esta área destina-se exclusivamente a administradores credenciados para
                    gestão de usuários, definição de níveis de permissão e consulta aos logs de
                    auditoria. Operadores e servidores que realizam acesso físico ao cofre são
                    validados diretamente via terminal biométrico local e não possuem
                    credenciais nesta interface web.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div>
                <label
                  htmlFor="login-usuario"
                  className="mb-xs block font-mono text-xs uppercase tracking-wide text-text-primary"
                >
                  Identificador / Usuário
                </label>
                <div className="relative rounded-sm bg-bg-primary">
                  <Icon
                    name="badge"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                  />
                  <input
                    id="login-usuario"
                    name="usuario"
                    type="text"
                    autoComplete="username"
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Digite seu usuário"
                    className="w-full rounded-sm bg-transparent py-sm pl-10 pr-md font-mono text-sm text-text-primary placeholder:text-outline focus:bg-bg-chip focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="mb-xs flex items-center justify-between">
                  <label
                    htmlFor="login-senha"
                    className="block font-mono text-xs uppercase tracking-wide text-text-primary"
                  >
                    Senha de segurança
                  </label>
                  <span className="font-mono text-xs text-outline">CRIPTO-TOKEN // SIAB-PKI</span>
                </div>
                <div className="relative rounded-sm bg-bg-primary">
                  <Icon
                    name="key"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                  />
                  <input
                    id="login-senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="w-full rounded-sm bg-transparent py-sm pl-10 pr-10 font-mono text-sm text-text-primary placeholder:text-outline focus:bg-bg-chip focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Alternar visibilidade da senha"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-text-primary focus:outline-none"
                  >
                    <Icon name={mostrarSenha ? "visibility_off" : "visibility"} className="text-[18px]" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="flex items-center justify-center gap-sm rounded-md bg-accent-default px-md py-sm text-base font-semibold text-bg-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="fingerprint" filled className="text-[20px]" />
                <span>{enviando ? "Autenticando..." : "Autenticar Administrador"}</span>
              </button>

              {enviando && (
                <div className="flex items-center gap-sm rounded-sm bg-bg-chip-strong p-sm">
                  <svg className="h-4 w-4 animate-spin text-accent-default" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="font-mono text-xs tracking-wide text-text-primary">
                    VALIDANDO MATRIZ DE AUTORIZAÇÃO...
                  </span>
                </div>
              )}

              {mensagem && (
                <p role="alert" className="text-center text-sm text-status-danger">
                  {mensagem}
                </p>
              )}
            </form>
          </div>

          <div className="mt-lg flex flex-col items-start justify-between gap-sm border-t border-border-default pt-lg sm:flex-row sm:items-center">
            <Link href="/cadastro" className="font-medium text-accent-default underline hover:text-text-primary">
              Não tem conta? Criar conta administrativa
            </Link>
            <div className="flex items-center gap-xs font-mono text-xs text-outline">
              <Icon name="lock" className="text-[14px]" />
              <span>TLS 1.3 • AES-256-GCM</span>
            </div>
          </div>
        </div>

        {/* Painel lateral: telemetria institucional & auditoria */}
        <div className="flex flex-col justify-between gap-md lg:col-span-5">
          <div className="flex flex-1 flex-col justify-between rounded-lg bg-bg-panel p-lg">
            <div>
              <div className="mb-md flex items-center gap-sm">
                <Icon name="gavel" filled className="text-[20px] text-status-warning" />
                <span className="font-mono text-xs uppercase tracking-widest text-status-warning">
                  Protocolo SIAB / Auditoria Contínua
                </span>
              </div>
              <div className="mb-md rounded-sm bg-bg-chip-strong p-md">
                <div className="flex items-start gap-sm">
                  <Icon name="warning" className="mt-0.5 shrink-0 text-[20px] text-status-warning" />
                  <div>
                    <span className="mb-1 block text-base font-semibold text-status-warning">
                      Aviso Mandatório de Rastreio
                    </span>
                    <p className="text-sm leading-relaxed text-text-muted">
                      Todas as sessões e tentativas de autenticação são registradas e auditadas
                      em conformidade com o protocolo de segurança do SIAB.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <div className="flex items-center justify-between rounded-sm bg-bg-primary p-sm font-mono text-xs">
                  <span className="text-outline">Tentativas Permitidas:</span>
                  <span className="text-text-primary">03 consecutivas</span>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-bg-primary p-sm font-mono text-xs">
                  <span className="text-outline">Bloqueio Preventivo:</span>
                  <span className="text-status-danger">Automático (NOC/SIAB)</span>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-bg-primary p-sm font-mono text-xs">
                  <span className="text-outline">Isolamento de Credencial:</span>
                  <span className="text-status-success">Ativo via HSM</span>
                </div>
              </div>
            </div>
            <div className="mt-lg rounded-sm bg-bg-primary p-sm">
              <div className="mb-1 flex items-center justify-between font-mono text-xs text-outline">
                <span>HASH SESSÃO ATUAL</span>
                <span className="text-accent-default">SHA-256</span>
              </div>
              <p className="truncate font-mono text-xs text-text-muted">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-bg-panel p-md">
            <div className="flex items-center gap-sm">
              <Icon name="help_center" className="text-[20px] text-outline" />
              <div>
                <span className="block text-sm text-text-primary">Dúvidas de Credenciamento?</span>
                <span className="font-mono text-xs text-outline">Suporte SIAB: ramal #4044</span>
              </div>
            </div>
            <div className="rounded-sm bg-bg-chip px-sm py-1">
              <span className="font-mono text-xs uppercase text-text-muted">v4.2.1-SEC</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
