"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AccessSummary, VerificacaoAuditoria } from "@/lib/types";

export default function AdminReportsPage() {
  const [resumo, setResumo] = useState<AccessSummary | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [erroExportacao, setErroExportacao] = useState<string | null>(null);
  const [verificacao, setVerificacao] = useState<VerificacaoAuditoria | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [erroVerificacao, setErroVerificacao] = useState<string | null>(null);

  useEffect(() => {
    api
      .resumoDeAcessos()
      .then(setResumo)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar relatório."));
  }, []);

  async function exportarPdf() {
    setExportando(true);
    setErroExportacao(null);
    try {
      const blob = await api.exportarRelatorioPdf();
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

  // Verificar só lê; selar assina o último registro de cada cadeia
  // (checkpoint) e devolve a verificação já atualizada — ver
  // CadeiaAuditoriaService no back-end. Ficam separados de propósito: selar
  // sem verificar antes "carimbaria" uma adulteração ainda não detectada.
  async function executarAuditoria(acao: () => Promise<VerificacaoAuditoria>) {
    setVerificando(true);
    setErroVerificacao(null);
    try {
      setVerificacao(await acao());
    } catch (err) {
      setErroVerificacao(err instanceof Error ? err.message : "Erro ao verificar a auditoria.");
    } finally {
      setVerificando(false);
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

      <div className="flex flex-col gap-sm rounded-lg bg-bg-panel p-md">
        <div className="flex items-center gap-sm">
          <Icon name="verified" className="text-[20px] text-outline" />
          <p className="text-sm text-text-secondary">
            Confere a cadeia de hashes e as assinaturas dos checkpoints do log de auditoria —
            qualquer registro alterado ou apagado no banco aparece aqui.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button onClick={() => executarAuditoria(api.verificarAuditoria)} disabled={verificando}>
            {verificando ? "Verificando..." : "Verificar integridade"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => executarAuditoria(api.selarAuditoria)}
            disabled={verificando || !verificacao?.integra}
            title="Disponível depois de uma verificação íntegra"
          >
            Selar agora
          </Button>
        </div>
        {erroVerificacao && <p className="text-sm text-status-danger">{erroVerificacao}</p>}
        {verificacao && (
          <div className="flex flex-col gap-sm rounded-lg bg-bg-chip p-md">
            <div
              className={`flex items-center gap-xs font-mono text-sm font-semibold uppercase ${
                verificacao.integra ? "text-status-success" : "text-status-danger"
              }`}
            >
              <Icon name={verificacao.integra ? "check_circle" : "error"} filled className="text-[18px]" />
              {verificacao.integra ? "Auditoria íntegra" : "Inconsistências encontradas"}
            </div>
            <div className="grid grid-cols-2 gap-sm font-mono text-xs md:grid-cols-4">
              <div className="flex flex-col">
                <span className="uppercase text-outline">Acessos</span>
                <span className="text-text-primary">{verificacao.acessosVerificados}</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase text-outline">Ações admin</span>
                <span className="text-text-primary">{verificacao.acoesVerificadas}</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase text-outline">Checkpoints</span>
                <span className="text-text-primary">{verificacao.checkpointsVerificados}</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase text-outline">Legados (sem cadeia)</span>
                <span className="text-text-primary">{verificacao.registrosLegados}</span>
              </div>
            </div>
            {verificacao.problemas.length > 0 && (
              <ul className="flex list-disc flex-col gap-xs pl-lg text-xs text-status-danger">
                {verificacao.problemas.map((problema) => (
                  <li key={problema}>{problema}</li>
                ))}
              </ul>
            )}
            <span className="break-all font-mono text-[10px] text-outline">
              Impressão digital das chaves: {verificacao.impressaoDigitalChaves}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
