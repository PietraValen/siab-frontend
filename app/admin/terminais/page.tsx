"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import type { NivelAcessoNome, Terminal, TerminalCriado } from "@/lib/types";

const NIVEIS: { id: number; nome: NivelAcessoNome; tag: string }[] = [
  { id: 1, nome: "Acesso Geral", tag: "N1" },
  { id: 2, nome: "Diretoria", tag: "N2" },
  { id: 3, nome: "Ministro", tag: "N3" },
];

function formatarData(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "—";
}

// Classes estáticas (ver StatusPill) para o estado do terminal.
const estiloSituacao = {
  ativo: "text-status-success bg-status-success/10 border-status-success/40",
  revogado: "text-outline bg-bg-chip border-border-default",
} as const;

/**
 * Tela /admin/terminais — cadastro das portas do cofre. Cada terminal tem o
 * nível exigido da porta e uma chave HMAC própria; a chave aparece uma
 * única vez, logo após o cadastro, para ser colada na tela de pareamento
 * do quiosque /scan (ver lib/terminal.ts). Revogar invalida a chave na
 * hora: o quiosque daquela porta passa a receber 401.
 */
export default function AdminTerminaisPage() {
  const [terminais, setTerminais] = useState<Terminal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [nivelId, setNivelId] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState<TerminalCriado | null>(null);
  const [revogando, setRevogando] = useState<number | null>(null);

  function carregar() {
    return api
      .listarTerminais()
      .then(setTerminais)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar terminais."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await api.criarTerminal({ nome, nivelExigidoId: nivelId });
      setCriado(resposta);
      setNome("");
      setNivelId(1);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao cadastrar terminal.");
    } finally {
      setEnviando(false);
    }
  }

  async function revogar(terminal: Terminal) {
    if (revogando !== terminal.id) {
      // Primeiro clique só pede confirmação (revogar não tem volta).
      setRevogando(terminal.id);
      return;
    }
    setErro(null);
    try {
      await api.revogarTerminal(terminal.id);
      if (criado?.terminal.id === terminal.id) setCriado(null);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao revogar terminal.");
    } finally {
      setRevogando(null);
    }
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Infraestrutura Física
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Terminais</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Portas do cofre com quiosque de reconhecimento. O nível exigido de cada porta é definido
          aqui — o quiosque não escolhe a própria área.
        </p>
      </div>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      {criado && (
        <div className="flex flex-col gap-md rounded-lg border border-status-warning/40 bg-status-warning/10 p-lg">
          <div className="flex items-start gap-sm">
            <Icon name="key" className="mt-0.5 shrink-0 text-[20px] text-status-warning" />
            <div className="flex flex-col gap-xs">
              <span className="text-sm font-semibold uppercase tracking-wide text-status-warning">
                Chave exibida uma única vez
              </span>
              <p className="text-sm text-text-muted">
                Abra <span className="font-mono text-text-primary">/scan</span> no quiosque da porta{" "}
                <strong className="text-text-primary">{criado.terminal.nome}</strong> e cole o ID e a
                chave abaixo. Depois de sair desta página não é possível ver a chave de novo — se ela
                se perder, revogue o terminal e cadastre outro.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-sm rounded-sm bg-bg-primary p-md">
            <div className="flex items-center justify-between gap-sm">
              <div className="flex min-w-0 flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">ID do terminal</span>
                <span className="font-mono text-sm text-text-primary">{criado.terminal.id}</span>
              </div>
              <CopyButton valor={String(criado.terminal.id)} rotulo="Copiar ID" />
            </div>
            <div className="flex items-center justify-between gap-sm">
              <div className="flex min-w-0 flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Chave</span>
                <span className="break-all font-mono text-sm text-text-primary">{criado.chave}</span>
              </div>
              <CopyButton valor={criado.chave} rotulo="Copiar chave" />
            </div>
          </div>
          <div>
            <Button variant="secondary" onClick={() => setCriado(null)}>
              Já copiei, ocultar chave
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-lg lg:grid-cols-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-lg rounded-lg bg-bg-panel p-lg lg:col-span-4">
          <div className="flex items-center gap-xs">
            <Icon name="add_circle" className="text-[20px] text-accent-default" />
            <span className="text-base font-semibold text-text-primary">Novo terminal</span>
          </div>
          <Input
            label="Nome da porta"
            required
            maxLength={100}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Antecâmara Externa"
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="terminal-nivel"
              className="font-mono text-xs font-medium uppercase tracking-wide text-text-secondary"
            >
              Nível exigido
            </label>
            <select
              id="terminal-nivel"
              value={nivelId}
              onChange={(e) => setNivelId(Number(e.target.value))}
              className="w-full rounded-md border border-border-default bg-bg-elevated px-md py-sm text-sm text-text-primary focus:border-accent-default focus:outline-none"
            >
              {NIVEIS.map((nivel) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.tag} — {nivel.nome}
                </option>
              ))}
            </select>
            {nivelId === 3 && (
              <span className="text-xs text-status-warning">
                Portas de nível Ministro exigem rosto + PIN.
              </span>
            )}
          </div>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Cadastrando..." : "Cadastrar terminal"}
          </Button>
        </form>

        <div className="overflow-hidden rounded-lg bg-bg-panel lg:col-span-8">
          <div className="flex items-center justify-between gap-sm border-b border-border-default bg-bg-chip px-lg py-sm">
            <div className="flex items-center gap-sm">
              <Icon name="sensor_door" className="text-[20px] text-accent-default" />
              <span className="text-sm font-semibold text-text-primary">Terminais cadastrados</span>
            </div>
            <span className="font-mono text-xs text-outline">{terminais.length} registro(s)</span>
          </div>

          {carregando ? (
            <p className="p-lg text-sm text-text-secondary">Carregando...</p>
          ) : terminais.length === 0 ? (
            <p className="p-lg text-sm text-text-secondary">
              Nenhum terminal cadastrado ainda. Sem um terminal pareado, o /scan não aceita
              tentativas.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-chip font-mono text-xs uppercase tracking-wide text-outline">
                <tr>
                  <th className="px-lg py-sm font-medium">Porta</th>
                  <th className="px-lg py-sm font-medium">Nível</th>
                  <th className="px-lg py-sm font-medium">Último uso</th>
                  <th className="px-lg py-sm text-right font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {terminais.map((terminal) => (
                  <tr key={terminal.id} className="border-t border-border-default hover:bg-bg-chip">
                    <td className="px-lg py-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">{terminal.nome}</span>
                        <span className="font-mono text-xs text-outline">ID: {terminal.id}</span>
                      </div>
                    </td>
                    <td className="px-lg py-sm">
                      <Badge nivel={terminal.nivelExigido} />
                    </td>
                    <td className="whitespace-nowrap px-lg py-sm font-mono text-xs text-text-secondary">
                      {formatarData(terminal.ultimoUsoEm)}
                    </td>
                    <td className="px-lg py-sm text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <span
                          className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase ${
                            terminal.ativo ? estiloSituacao.ativo : estiloSituacao.revogado
                          }`}
                        >
                          {terminal.ativo ? "Ativo" : "Revogado"}
                        </span>
                        {terminal.ativo && (
                          <button
                            type="button"
                            onClick={() => revogar(terminal)}
                            onBlur={() => setRevogando((atual) => (atual === terminal.id ? null : atual))}
                            className="flex items-center gap-xs font-mono text-xs text-status-danger transition-colors hover:text-text-primary"
                          >
                            <Icon name="block" className="text-[16px]" />
                            {revogando === terminal.id ? "Confirmar" : "Revogar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
