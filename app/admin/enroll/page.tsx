"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { NivelAcessoNome } from "@/lib/types";

const NIVEIS: {
  id: number;
  nome: NivelAcessoNome;
  tag: string;
  corTexto: string;
  corFundo: string;
  descricao: string;
}[] = [
  {
    id: 1,
    nome: "Acesso Geral",
    tag: "Nível 01",
    corTexto: "text-accent-default",
    corFundo: "bg-accent-default/10",
    descricao: "Acesso à antecâmara e corredores técnicos perimetrais do cofre.",
  },
  {
    id: 2,
    nome: "Diretoria",
    tag: "Nível 02",
    corTexto: "text-status-warning",
    corFundo: "bg-status-warning/10",
    descricao: "Acesso aos compartimentos de amostras e custódia probatória restrita.",
  },
  {
    id: 3,
    nome: "Ministro",
    tag: "Nível 03",
    corTexto: "text-status-danger",
    corFundo: "bg-status-danger/10",
    descricao: "Acesso total ao núcleo do cofre central (segurança máxima).",
  },
];

const guiaOval = (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <svg className="h-[85%] text-accent-default opacity-80" fill="none" viewBox="0 0 320 384">
      <ellipse cx="160" cy="192" rx="120" ry="160" stroke="currentColor" strokeDasharray="8 6" strokeWidth="2" />
      <line x1="60" x2="260" y1="160" y2="160" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.4" />
    </svg>
  </div>
);

/**
 * Tela /admin/enroll — cadastro biométrico (RF01), restrito a administradores
 * logados (ver CLAUDE.md — pendência resolvida: o cadastro de usuário +
 * rosto agora é uma ação só do admin, dentro do painel protegido). Fluxo:
 * 1. Preencher nome/cargo/nível e criar o usuário via POST /api/admin/usuarios
 * 2. Capturar o rosto pela webcam
 * 3. Enviar para POST /api/enrollment, associado ao usuário recém-criado
 */
export default function AdminEnrollPage() {
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
      const token = obterToken() ?? "";
      const usuario = await api.criarUsuario(token, { nome, cargo, nivelAcessoId: nivelId });
      const resultado = await api.cadastrarRosto(token, usuario.id, capturedImage);
      setStatus("sucesso");
      setMensagem(resultado.mensagem);
      setNome("");
      setCargo("");
      setNivelId(1);
      setCapturedImage(null);
    } catch (err) {
      setStatus("erro");
      setMensagem(err instanceof Error ? err.message : "Erro ao cadastrar rosto.");
    }
  }

  const enviando = status === "enviando";

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Módulo de Admissão
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Cadastrar Nova Biometria Facial</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Registro do usuário e da referência facial usada pelo terminal de reconhecimento no
          cofre.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-lg lg:grid-cols-12">
        {/* Viewport da câmera */}
        <div className="flex flex-col gap-md lg:col-span-7">
          <div className="overflow-hidden rounded-lg bg-bg-primary">
            <div className="flex items-center justify-between bg-bg-panel px-md py-sm">
              <div className="flex items-center gap-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-success" />
                </span>
                <span className="font-mono text-xs font-medium uppercase tracking-wide text-text-primary">
                  Feed ao vivo
                </span>
              </div>
              <span className="font-mono text-xs text-accent-default">CAM_ID: SIAB-01</span>
            </div>
            <div className="p-lg">
              <CameraCapture
                onCapture={setCapturedImage}
                overlay={guiaOval}
                containerClassName="relative mx-auto h-96 w-80 overflow-hidden rounded-lg bg-black"
                videoClassName="h-full w-full object-cover block"
              />
            </div>
            <div className="bg-bg-panel px-md py-sm text-center">
              <p className="font-mono text-xs text-text-muted">
                Posicione o rosto dentro da linha oval, com expressão neutra.
              </p>
            </div>
          </div>
          {capturedImage && (
            <p className="text-center text-xs text-status-success">Rosto capturado ✓</p>
          )}
        </div>

        {/* Ficha de credenciamento */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-lg rounded-lg bg-bg-panel p-lg">
            <div className="flex items-center gap-xs">
              <Icon name="badge" className="text-[20px] text-accent-default" />
              <span className="text-base font-semibold text-text-primary">Ficha de Credenciamento</span>
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="enroll-nome" className="text-sm font-medium text-text-secondary">
                Nome completo
              </label>
              <input
                id="enroll-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome completo"
                className="w-full rounded-md bg-bg-elevated px-md py-sm text-sm text-text-primary placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-accent-default"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="enroll-cargo" className="text-sm font-medium text-text-secondary">
                Cargo
              </label>
              <input
                id="enroll-cargo"
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Digite o cargo"
                className="w-full rounded-md bg-bg-elevated px-md py-sm text-sm text-text-primary placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-accent-default"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <span className="text-sm font-medium text-text-secondary">Nível de acesso</span>
              <div className="flex flex-col gap-xs">
                {NIVEIS.map((nivel) => (
                  <label
                    key={nivel.id}
                    className="flex cursor-pointer items-start gap-sm rounded-lg bg-bg-elevated p-sm transition-colors hover:bg-bg-chip-strong"
                  >
                    <input
                      type="radio"
                      name="nivel"
                      className="mt-1 h-4 w-4 accent-accent-default"
                      checked={nivelId === nivel.id}
                      onChange={() => setNivelId(nivel.id)}
                    />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary">
                          {nivel.nome === "Acesso Geral" ? "Geral" : nivel.nome}
                        </span>
                        <span
                          className={`rounded-sm px-2 py-0.5 font-mono text-xs font-medium uppercase ${nivel.corFundo} ${nivel.corTexto}`}
                        >
                          {nivel.tag}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{nivel.descricao}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-sm rounded-md bg-accent-default py-md text-sm font-semibold uppercase tracking-wide text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="how_to_reg" className="text-[20px]" />
              <span>{enviando ? "Cadastrando..." : "Cadastrar Rosto"}</span>
            </button>

            {mensagem && (
              <p
                className={`text-center text-sm ${
                  status === "erro" ? "text-status-danger" : "text-status-success"
                }`}
              >
                {mensagem}
              </p>
            )}

            <div className="flex items-center justify-between gap-sm rounded-sm bg-bg-primary px-md py-sm">
              <div className="flex items-center gap-xs">
                <Icon name="lock" className="text-[18px] text-accent-default" />
                <span className="font-mono text-xs text-text-muted">
                  Vetor facial associado ao usuário recém-criado
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
