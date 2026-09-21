"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessSummary, Usuario } from "@/lib/types";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = obterToken() ?? "";
    Promise.all([api.listarUsuarios(token), api.resumoDeAcessos(token)])
      .then(([usuariosRes, resumoRes]) => {
        setUsuarios(usuariosRes);
        setResumo(resumoRes);
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="flex flex-col gap-xl">
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
        <div className="flex items-center gap-sm border-b border-border-default bg-bg-chip px-lg py-sm">
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
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-chip font-mono text-xs uppercase tracking-wide text-outline">
              <tr>
                <th className="px-lg py-sm font-medium">Identificação</th>
                <th className="px-lg py-sm font-medium">Cargo</th>
                <th className="px-lg py-sm font-medium">Nível</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-border-default hover:bg-bg-chip">
                  <td className="px-lg py-sm">
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
                  <td className="px-lg py-sm text-text-secondary">{usuario.cargo ?? "—"}</td>
                  <td className="px-lg py-sm">
                    <Badge nivel={usuario.nivelAcesso} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
