"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessSummary, Usuario } from "@/lib/types";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = obterToken() ?? "";
    Promise.all([
      api.listarUsuarios(token),
      api.resumoDeAcessos(token),
    ])
      .then(([usuariosRes, resumoRes]) => {
        setUsuarios(usuariosRes);
        setResumo(resumoRes);
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar dados."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="flex flex-col gap-xl">
      <h1 className="text-[26px] font-bold text-text-primary">Usuários Cadastrados</h1>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      <div className="flex gap-md">
        <Card titulo="Usuários ativos" valor={usuarios.length} />
        <Card titulo="Acessos concedidos" valor={resumo?.acessosConcedidos ?? "—"} />
        <Card titulo="Tentativas negadas" valor={resumo?.acessosNegados ?? "—"} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border-default">
        {carregando ? (
          <p className="p-lg text-sm text-text-secondary">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="p-lg text-sm text-text-secondary">
            Nenhum usuário cadastrado ainda. Use a tela de cadastro (/enroll) para
            adicionar o primeiro.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-elevated text-text-secondary">
              <tr>
                <th className="px-lg py-sm font-medium">Nome</th>
                <th className="px-lg py-sm font-medium">Cargo</th>
                <th className="px-lg py-sm font-medium">Nível</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-border-default bg-bg-surface">
                  <td className="px-lg py-sm text-text-primary">{usuario.nome}</td>
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
