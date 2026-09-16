"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CameraCapture } from "@/components/CameraCapture";
import { api } from "@/lib/api";
import type { NivelAcessoNome } from "@/lib/types";

const NIVEIS: { id: number; nome: NivelAcessoNome }[] = [
  { id: 1, nome: "Acesso Geral" },
  { id: 2, nome: "Diretoria" },
  { id: 3, nome: "Ministro" },
];

/**
 * Tela /enroll — cadastro biométrico (RF01). Fluxo:
 * 1. Preencher nome/cargo/nível
 * 2. Capturar o rosto pela webcam
 * 3. Enviar para POST /api/enrollment (back-end roda as fases 1-4)
 *
 * TODO: hoje assume que o usuário JÁ existe (usuarioId fixo em 0 seria
 * inválido). O fluxo real precisa primeiro criar o usuário via
 * api.criarUsuario (que exige um token de admin) e só depois cadastrar o
 * rosto dele. Decidir com o grupo: o cadastro de usuário + rosto deve ser
 * uma ação só do admin logado, ou existe um modo de "auto-cadastro"?
 * Isso muda a UI desta tela (hoje ela está montada assumindo que o admin
 * já está autenticado, mas não pede login nenhum ainda).
 */
export default function EnrollPage() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivelId, setNivelId] = useState<number>(1);
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "enviando" | "sucesso" | "erro">("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!capturedImage) {
      setMensagem("Capture o rosto antes de cadastrar.");
      return;
    }

    setStatus("enviando");
    setMensagem(null);

    try {
      // TODO: substituir "1" pelo id real do usuário recém-criado — ver
      // nota acima sobre o fluxo de criação de usuário + admin token.
      const usuarioId = 1;
      const resultado = await api.cadastrarRosto(usuarioId, capturedImage);
      setStatus("sucesso");
      setMensagem(resultado.mensagem);
    } catch (err) {
      setStatus("erro");
      setMensagem(err instanceof Error ? err.message : "Erro ao cadastrar rosto.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-lg rounded-lg border border-border-default bg-bg-surface p-2xl"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cadastro Biométrico</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Posicione o rosto na área indicada e preencha os dados abaixo.
          </p>
        </div>

        <CameraCapture onCapture={setCapturedImage} />
        {capturedImage && (
          <p className="text-center text-xs text-status-success">Rosto capturado ✓</p>
        )}

        <Input
          label="Nome completo"
          placeholder="Digite aqui..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          label="Cargo"
          placeholder="Digite aqui..."
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">
            Nível de acesso
          </span>
          <div className="flex gap-2">
            {NIVEIS.map((nivel) => (
              <button
                key={nivel.id}
                type="button"
                onClick={() => setNivelId(nivel.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  nivelId === nivel.id
                    ? "bg-accent-default text-bg-primary"
                    : "bg-bg-elevated text-text-secondary"
                }`}
              >
                {nivel.nome}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={status === "enviando"} className="w-full">
          {status === "enviando" ? "Cadastrando..." : "Cadastrar Rosto"}
        </Button>

        {mensagem && (
          <p
            className={`text-center text-sm ${
              status === "erro" ? "text-status-danger" : "text-status-success"
            }`}
          >
            {mensagem}
          </p>
        )}
      </form>
    </main>
  );
}
