"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";

/**
 * Tela /cadastro — criação da PRIMEIRA conta administrativa do sistema
 * (bootstrap). Fluxo:
 * 1. GET /api/auth/existe-administrador: se já existe algum administrador,
 *    o formulário fica bloqueado (o back-end também recusaria a criação
 *    sem um JWT válido a partir do segundo admin — ver
 *    AdministradorController no back-end).
 * 2. Caso contrário, mostra o formulário e cadastra via
 *    POST /api/admin/administradores (público só neste cenário de
 *    bootstrap).
 * 3. Ao cadastrar com sucesso, redireciona para /login.
 */
type VerificacaoInicial = "verificando" | "liberado" | "encerrado" | "erro";

const REQUISITOS_SENHA = [
  { chave: "tamanho", label: "Mínimo de 12 caracteres", teste: (s: string) => s.length >= 12 },
  { chave: "maiuscula", label: "Letra maiúscula (A-Z)", teste: (s: string) => /[A-Z]/.test(s) },
  { chave: "numero", label: "Ao menos 1 número (0-9)", teste: (s: string) => /[0-9]/.test(s) },
  { chave: "especial", label: "Caractere especial (@$!%*#?&)", teste: (s: string) => /[@$!%*#?&]/.test(s) },
] as const;

function TelaCentralizada({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-md sm:p-lg">
      <div className="w-full max-w-md rounded-lg bg-bg-panel p-lg text-center sm:p-2xl">{children}</div>
    </main>
  );
}

export default function CadastroPage() {
  const router = useRouter();
  const [verificacao, setVerificacao] = useState<VerificacaoInicial>("verificando");

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const senhasConferem = confirmarSenha.length === 0 || senha === confirmarSenha;

  useEffect(() => {
    api
      .existeAdministrador()
      .then(({ existe }) => setVerificacao(existe ? "encerrado" : "liberado"))
      .catch(() => setVerificacao("erro"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    setStatus("enviando");
    setMensagem(null);

    try {
      // O back-end ainda não persiste "nome" para administradores (só
      // username/senha) — mantido no formulário porque identifica a
      // pessoa responsável pela conta, mesmo sem ser salvo hoje.
      await api.criarAdministrador({ username: usuario, senha });
      router.push("/login");
    } catch (err) {
      setStatus("erro");
      setMensagem(err instanceof Error ? err.message : "Erro ao cadastrar administrador.");
    }
  }

  if (verificacao === "verificando") {
    return (
      <TelaCentralizada>
        <p className="text-sm text-text-secondary">Verificando...</p>
      </TelaCentralizada>
    );
  }

  if (verificacao === "erro") {
    return (
      <TelaCentralizada>
        <p className="text-sm text-status-danger">
          Não foi possível verificar o estado do cadastro. Tente novamente mais tarde.
        </p>
      </TelaCentralizada>
    );
  }

  if (verificacao === "encerrado") {
    return (
      <TelaCentralizada>
        <h1 className="text-xl font-bold text-text-primary">Cadastro encerrado</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Peça a um administrador existente para criar sua conta.
        </p>
        <Link href="/login" className="mt-lg inline-block font-semibold text-accent-default hover:underline">
          Ir para o login
        </Link>
      </TelaCentralizada>
    );
  }

  const enviando = status === "enviando";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-md sm:p-lg md:p-2xl">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-lg lg:grid-cols-12">
        {/* Formulário principal de credenciamento */}
        <section className="flex flex-col gap-lg rounded-lg bg-bg-panel p-lg sm:p-xl lg:col-span-7">
          <div>
            <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-accent-default">
              Protocolo de Ingresso · Módulo 03
            </span>
            <h1 className="text-2xl font-bold text-text-primary">Criar Conta Administrativa</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Esta conta dá acesso ao painel administrativo do SIAB (gestão de usuários e
              consulta de logs) — não confere permissão de acesso físico, que depende só da
              biometria facial.
            </p>
          </div>

          <div className="flex items-start gap-sm rounded-lg bg-bg-chip p-sm sm:gap-md sm:p-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-bg-chip-strong text-status-warning">
              <Icon name="gavel" className="text-[22px]" />
            </div>
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-status-warning">
                Delimitação de Competência
              </span>
              <p className="mt-1 text-sm text-text-muted">
                <strong className="font-semibold text-text-primary">Atenção:</strong> esta conta
                confere privilégios de gestão cadastral e auditoria de eventos no SIAB. Ela{" "}
                <span className="font-semibold text-status-danger underline underline-offset-2">
                  NÃO autoriza
                </span>{" "}
                abertura física do cofre, cuja liberação depende unicamente de biometria facial
                presencial no terminal.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="cadastro-nome"
                className="font-mono text-xs uppercase tracking-wide text-text-primary"
              >
                Nome completo
              </label>
              <input
                id="cadastro-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full rounded-md bg-bg-elevated px-md py-sm text-sm text-text-primary placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-accent-default"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="cadastro-usuario"
                className="font-mono text-xs uppercase tracking-wide text-text-primary"
              >
                Usuário
              </label>
              <div className="relative">
                <Icon
                  name="account_circle"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                />
                <input
                  id="cadastro-usuario"
                  type="text"
                  autoComplete="username"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Escolha um nome de usuário"
                  className="w-full rounded-md bg-bg-elevated py-sm pl-10 pr-md font-mono text-sm tracking-wide text-text-primary placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-accent-default"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor="cadastro-senha"
                  className="font-mono text-xs uppercase tracking-wide text-text-primary"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="cadastro-senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-md bg-bg-elevated px-md py-sm font-mono text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-default"
                  />
                  <button
                    type="button"
                    aria-label="Alternar visibilidade da senha"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-text-primary"
                  >
                    <Icon name={mostrarSenha ? "visibility_off" : "visibility"} className="text-[18px]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label
                  htmlFor="cadastro-confirma-senha"
                  className="font-mono text-xs uppercase tracking-wide text-text-primary"
                >
                  Confirmar senha
                </label>
                <input
                  id="cadastro-confirma-senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full rounded-md bg-bg-elevated px-md py-sm font-mono text-sm text-text-primary focus:outline-none focus:ring-1 ${
                    senhasConferem ? "focus:ring-accent-default" : "ring-1 ring-status-danger"
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs rounded-lg bg-bg-chip p-md">
              <span className="mb-1 font-mono text-xs uppercase tracking-wide text-outline">
                Indicador de Requisitos de Segurança
              </span>
              <div className="grid grid-cols-1 gap-xs sm:grid-cols-2">
                {REQUISITOS_SENHA.map((req) => {
                  const atendido = req.teste(senha);
                  return (
                    <div
                      key={req.chave}
                      className={`flex items-center gap-xs font-mono text-xs ${
                        atendido ? "text-status-success" : "text-text-secondary"
                      }`}
                    >
                      <Icon name={atendido ? "check_circle" : "radio_button_unchecked"} className="text-[16px]" />
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-accent-default py-md text-base font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? "Cadastrando..." : "Solicitar Credenciamento"}
            </button>

            {mensagem && (
              <p role="alert" className="text-center text-sm text-status-danger">
                {mensagem}
              </p>
            )}

            <p className="text-center text-sm text-text-secondary">
              Já possui credencial?{" "}
              <Link href="/login" className="font-semibold text-accent-default hover:underline">
                Acessar o sistema
              </Link>
            </p>
          </form>
        </section>

        {/* Painel lateral: políticas de segurança */}
        <aside className="flex flex-col gap-lg lg:col-span-5">
          <div className="flex flex-col gap-md rounded-lg bg-bg-panel p-md sm:p-lg">
            <div className="flex items-center gap-sm">
              <Icon name="verified_user" className="text-[20px] text-accent-default" />
              <span className="text-base font-semibold text-text-primary">
                Painel de Políticas de Segurança
              </span>
            </div>

            <div className="flex items-start gap-sm rounded-lg bg-bg-chip p-sm sm:gap-md sm:p-md">
              <Icon name="key" className="mt-0.5 shrink-0 text-[20px] text-accent-default" />
              <div>
                <span className="text-sm font-semibold text-text-primary">CRITÉRIOS DE SENHA FORTE</span>
                <p className="mt-0.5 text-sm text-text-muted">
                  Exigência de entropia mínima. Senhas repetidas de outras contas não são
                  admitidas pelo validador.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-sm rounded-lg bg-bg-chip p-sm sm:gap-md sm:p-md">
              <Icon name="timer_off" className="mt-0.5 shrink-0 text-[20px] text-status-warning" />
              <div>
                <span className="text-sm font-semibold text-text-primary">
                  BLOQUEIO AUTOMÁTICO POR INATIVIDADE
                </span>
                <p className="mt-0.5 text-sm text-text-muted">
                  Sessão suspensa após período sem interação. Reautenticação exigida.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-sm rounded-lg bg-bg-chip p-sm sm:gap-md sm:p-md">
              <Icon name="enhanced_encryption" className="mt-0.5 shrink-0 text-[20px] text-status-success" />
              <div>
                <span className="text-sm font-semibold text-text-primary">
                  REGISTRO DE AUDITORIA
                </span>
                <p className="mt-0.5 text-sm text-text-muted">
                  Cada solicitação de credenciamento gera um registro assinado no livro de
                  auditoria do SIAB.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
