"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessLog } from "@/lib/types";

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
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
      <h1 className="text-[26px] font-bold text-text-primary">Logs de Acesso</h1>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      <div className="flex flex-col gap-px overflow-hidden rounded-lg bg-border-default">
        {carregando ? (
          <p className="bg-bg-surface p-lg text-sm text-text-secondary">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="bg-bg-surface p-lg text-sm text-text-secondary">
            Nenhuma tentativa de acesso registrada ainda.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-md bg-bg-surface px-lg py-sm"
            >
              <span className="w-[220px] shrink-0 text-sm font-medium text-text-primary">
                {log.nomeUsuario}
              </span>
              <StatusPill tipo={log.resultado === "CONCEDIDO" ? "concedido" : "negado"} />
              <span className="ml-auto shrink-0 text-xs text-text-secondary">
                {formatarData(log.dataHora)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
