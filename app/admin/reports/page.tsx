"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { obterToken } from "@/lib/auth";
import type { AccessSummary } from "@/lib/types";

export default function AdminReportsPage() {
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [erroExportacao, setErroExportacao] = useState<string | null>(null);

  useEffect(() => {
    api
      .resumoDeAcessos(obterToken() ?? "")
      .then(setResumo)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar relatório."));
  }, []);

  async function exportarPdf() {
    setExportando(true);
    setErroExportacao(null);
    try {
      const blob = await api.exportarRelatorioPdf(obterToken() ?? "");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "relatorio-acessos.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErroExportacao(err instanceof Error ? err.message : "Erro ao exportar PDF.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Auditoria Consolidada
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Relatórios</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Resumo agregado das tentativas de acesso registradas pelo terminal de reconhecimento.
        </p>
      </div>

      {erro && <p className="text-sm text-status-danger">{erro}</p>}

      {resumo && (
        <div className="flex flex-col gap-md sm:flex-row">
          <Card titulo="Total de Tentativas" valor={resumo.totalTentativas} />
          <Card titulo="Acessos Concedidos" valor={resumo.acessosConcedidos} />
          <Card titulo="Acessos Negados" valor={resumo.acessosNegados} />
        </div>
      )}

      <div className="flex flex-col gap-sm rounded-lg bg-bg-panel p-md">
        <div className="flex items-center gap-sm">
          <Icon name="picture_as_pdf" className="text-[20px] text-outline" />
          <p className="text-sm text-text-secondary">
            Exporta o histórico completo de tentativas de acesso em PDF.
          </p>
        </div>
        <div>
          <Button onClick={exportarPdf} disabled={exportando}>
            {exportando ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
        </div>
        {erroExportacao && <p className="text-sm text-status-danger">{erroExportacao}</p>}
      </div>
    </div>
  );
}
