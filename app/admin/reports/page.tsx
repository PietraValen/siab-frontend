"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessSummary } from "@/lib/types";

/**
 * TODO: o back-end (ReportController) hoje só expõe um resumo em JSON.
 * Quando o módulo "reporting" ganhar geração de PDF real (ver CLAUDE.md
 * do back-end), adicionar aqui um botão "Exportar PDF" que baixa o
 * relatório (window.open ou um <a download> apontando para o endpoint
 * novo).
 */
export default function AdminReportsPage() {
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .resumoDeAcessos(obterToken() ?? "")
      .then(setResumo)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar relatório."));
  }, []);

  return (
    <div className="flex flex-col gap-xl">
      <h1 className="text-[26px] font-bold text-text-primary">Relatórios</h1>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      {resumo && (
        <div className="flex gap-md">
          <Card titulo="Total de tentativas" valor={resumo.totalTentativas} />
          <Card titulo="Acessos concedidos" valor={resumo.acessosConcedidos} />
          <Card titulo="Acessos negados" valor={resumo.acessosNegados} />
        </div>
      )}

      <p className="text-sm text-text-secondary">
        Exportação em PDF ainda não disponível — aguardando implementação do
        módulo &quot;reporting&quot; no back-end.
      </p>
    </div>
  );
}
