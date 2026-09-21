"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessLog } from "@/lib/types";

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .listarLogs(obterToken() ?? "")
      .then(setLogs)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar logs."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Auditoria de Acesso Físico
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Logs de Acesso</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Todas as tentativas de reconhecimento facial no terminal do cofre, concedidas ou
          negadas, na ordem em que ocorreram.
        </p>
      </div>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      <div className="overflow-hidden rounded-lg bg-bg-panel">
        <div className="flex items-center justify-between gap-sm border-b border-border-default bg-bg-chip px-lg py-sm">
          <div className="flex items-center gap-sm">
            <Icon name="fingerprint" className="text-[20px] text-accent-default" />
            <span className="text-sm font-semibold text-text-primary">
              Tentativas de Acesso Físico
            </span>
          </div>
          <span className="font-mono text-xs text-outline">{logs.length} registro(s)</span>
        </div>

        {carregando ? (
          <p className="p-lg text-sm text-text-secondary">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="p-lg text-sm text-text-secondary">
            Nenhuma tentativa de acesso registrada ainda.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-chip font-mono text-xs uppercase tracking-wide text-outline">
              <tr>
                <th className="px-lg py-sm font-medium">Horário</th>
                <th className="px-lg py-sm font-medium">Identificação</th>
                <th className="px-lg py-sm font-medium">Confiança</th>
                <th className="px-lg py-sm text-right font-medium">Decisão</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border-default hover:bg-bg-chip">
                  <td className="whitespace-nowrap px-lg py-sm font-mono text-xs text-text-secondary">
                    {formatarData(log.dataHora)}
                  </td>
                  <td className="px-lg py-sm">
                    <div className="flex items-center gap-sm">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-mono text-xs ${
                          log.resultado === "CONCEDIDO"
                            ? "bg-bg-chip-strong text-accent-default"
                            : "bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        {log.usuarioId ? iniciais(log.nomeUsuario) : <Icon name="no_accounts" className="text-[16px]" />}
                      </div>
                      <span className="font-medium text-text-primary">{log.nomeUsuario}</span>
                    </div>
                  </td>
                  <td className="px-lg py-sm font-mono text-text-secondary">
                    {log.similaridade != null ? `${(log.similaridade * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-lg py-sm text-right">
                    <StatusPill tipo={log.resultado === "CONCEDIDO" ? "concedido" : "negado"} />
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
