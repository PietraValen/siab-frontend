"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-lg rounded-lg border border-border-default bg-bg-surface p-2xl"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Acesso Administrativo</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Entre com suas credenciais para acessar o painel administrativo do
            SIAB. Esta área é restrita a administradores cadastrados.
          </p>
        </div>

        <Input
          label="Usuário"
          placeholder="Digite seu usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" disabled={status === "enviando"} className="w-full">
          {status === "enviando" ? "Autenticando..." : "Entrar"}
        </Button>

        {mensagem && (
          <p role="alert" className="text-center text-sm text-status-danger">
            {mensagem}
          </p>
        )}

        <p className="text-center text-sm text-text-secondary">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-accent-default hover:underline">
            Criar conta administrativa
          </Link>
        </p>
      </form>
    </main>
  );
}
