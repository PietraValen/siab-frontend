"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import type { AccessSummary, Usuario } from "@/lib/types";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

// Classes estáticas (ver StatusPill): mesmo formato retangular dos badges
// de nível, sem cor de nível — o PIN é só um indicador de segundo fator.
const estiloPin = {
  comPin: "text-accent-default bg-accent-default/10 border-accent-default/40",
  semPin: "text-outline bg-bg-chip border-border-default",
} as const;

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listarUsuarios(), api.resumoDeAcessos()])
      .then(([usuariosRes, resumoRes]) => {
        setUsuarios(usuariosRes);
        setResumo(resumoRes);
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="flex flex-col gap-lg sm:gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Sistema Integrado de Autenticação Biométrica
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Usuários Cadastrados</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Censo biométrico das pessoas com rosto cadastrado no SIAB, distribuídas nos três
          níveis de acesso configurados para o cofre.
        </p>
      </div>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      <div className="flex flex-col gap-md sm:flex-row">
        <Card titulo="Usuários Ativos" valor={usuarios.length} />
        <Card titulo="Acessos Concedidos" valor={resumo?.acessosConcedidos ?? "—"} />
        <Card titulo="Tentativas Negadas" valor={resumo?.acessosNegados ?? "—"} />
      </div>

      <div className="overflow-hidden rounded-lg bg-bg-panel">
        <div className="flex items-center gap-sm border-b border-border-default bg-bg-chip px-md py-sm sm:px-lg">
          <Icon name="fingerprint" className="text-[20px] text-accent-default" />
          <span className="text-sm font-semibold text-text-primary">Usuários com biometria cadastrada</span>
        </div>
        {carregando ? (
          <p className="p-lg text-sm text-text-secondary">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-lg text-sm text-text-secondary">
            Nenhum usuário cadastrado ainda. Use{" "}
            <a href="/admin/enroll" className="font-semibold text-accent-default hover:underline">
              Cadastrar Biometria
            </a>{" "}
            para adicionar o primeiro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-bg-chip font-mono text-xs uppercase tracking-wide text-outline">
                <tr>
                  <th className="px-md py-sm sm:px-lg font-medium">Identificação</th>
                  <th className="px-md py-sm sm:px-lg font-medium">Cargo</th>
                  <th className="px-md py-sm sm:px-lg font-medium">Nível</th>
                  <th className="px-md py-sm sm:px-lg font-medium">PIN</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-t border-border-default hover:bg-bg-chip">
                    <td className="px-md py-sm sm:px-lg">
                      <div className="flex items-center gap-sm">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-bg-chip-strong font-mono text-xs text-accent-default">
                          {iniciais(usuario.nome)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-text-primary">{usuario.nome}</span>
                          <span className="font-mono text-xs text-outline">ID: SIAB-{usuario.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-sm sm:px-lg text-text-secondary">{usuario.cargo ?? "—"}</td>
                    <td className="px-md py-sm sm:px-lg">
                      <Badge nivel={usuario.nivelAcesso} />
                    </td>
                    <td className="px-md py-sm sm:px-lg">
                      <span
                        className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${
                          usuario.possuiPin ? estiloPin.comPin : estiloPin.semPin
                        }`}
                      >
                        <Icon name={usuario.possuiPin ? "pin" : "remove"} className="text-[14px]" />
                        {usuario.possuiPin ? "Cadastrado" : "Sem PIN"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
