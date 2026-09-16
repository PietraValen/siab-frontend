"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

export default function CadastroPage() {
  const router = useRouter();
  const [verificacao, setVerificacao] = useState<VerificacaoInicial>("verificando");

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);

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
      <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
        <p className="text-sm text-text-secondary">Verificando...</p>
      </main>
    );
  }

  if (verificacao === "erro") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
        <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-2xl text-center">
          <p className="text-sm text-status-danger">
            Não foi possível verificar o estado do cadastro. Tente novamente
            mais tarde.
          </p>
        </div>
      </main>
    );
  }

  if (verificacao === "encerrado") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
        <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-2xl text-center">
          <h1 className="text-xl font-bold text-text-primary">Cadastro encerrado</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Peça a um administrador existente para criar sua conta.
          </p>
          <Link
            href="/login"
            className="mt-lg inline-block font-semibold text-accent-default hover:underline"
          >
            Ir para o login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-lg rounded-lg border border-border-default bg-bg-surface p-2xl"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Criar Conta Administrativa</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Esta conta dá acesso ao painel administrativo do SIAB (gestão de
            usuários e consulta de logs) — não confere permissão de acesso
            físico, que depende só da biometria facial.
          </p>
        </div>

        <Input
          label="Nome completo"
          placeholder="Digite seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          label="Usuário"
          placeholder="Escolha um nome de usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo de 8 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Repita a senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <Button type="submit" disabled={status === "enviando"} className="w-full">
          {status === "enviando" ? "Cadastrando..." : "Solicitar Credenciamento"}
        </Button>

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
    </main>
  );
}
