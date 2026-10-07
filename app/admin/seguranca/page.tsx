"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import type { ConfiguracaoMfa, Sessao } from "@/lib/types";

/** "JBSWY3DPEHPK3PXP" -> "JBSW Y3DP EHPK 3PXP" (mais fácil de digitar no app). */
function agruparSegredo(segredo: string) {
  return segredo.match(/.{1,4}/g)?.join(" ") ?? segredo;
}

function CampoCodigo({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Input
      label="Código de 6 dígitos"
      mono
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      required
      value={valor}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      placeholder="000000"
      className="tracking-[0.3em]"
    />
  );
}

/**
 * Tela /admin/seguranca — autenticação em dois fatores (TOTP) da conta do
 * admin logado. Fluxo de ativação:
 * 1. POST /api/admin/mfa/configurar gera um segredo (ainda inativo)
 * 2. O admin cadastra o segredo (ou a URI otpauth://) no app autenticador
 * 3. POST /api/admin/mfa/ativar com um código do app confirma e liga o MFA
 * Desativar também exige um código válido, para que uma sessão roubada
 * não consiga desligar o segundo fator.
 */
export default function AdminSegurancaPage() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoMfa | null>(null);
  const [desativando, setDesativando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    api
      .sessao()
      .then(setSessao)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar a sessão."));
  }, []);

  async function executar(acao: () => Promise<void>) {
    setEnviando(true);
    setErro(null);
    setSucesso(null);
    try {
      await acao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao alterar o MFA.");
    } finally {
      setEnviando(false);
    }
  }

  const iniciarAtivacao = () =>
    executar(async () => {
      setConfiguracao(await api.configurarMfa());
      setCodigo("");
    });

  const confirmarAtivacao = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      setSessao(await api.ativarMfa(codigo));
      setConfiguracao(null);
      setCodigo("");
      setSucesso("MFA ativado. O próximo login vai pedir o código do app.");
    });
  };

  const confirmarDesativacao = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      setSessao(await api.desativarMfa(codigo));
      setDesativando(false);
      setCodigo("");
      setSucesso("MFA desativado.");
    });
  };

  function cancelar() {
    setConfiguracao(null);
    setDesativando(false);
    setCodigo("");
    setErro(null);
  }

  return (
    <div className="flex flex-col gap-lg sm:gap-xl">
      <div className="flex flex-col gap-xs rounded-lg bg-bg-panel/50 p-md">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
          Credencial do Operador
        </span>
        <h1 className="text-[26px] font-bold text-text-primary">Segurança da Conta</h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Autenticação em dois fatores (TOTP) para o login no painel administrativo, com qualquer
          app autenticador (Google Authenticator, Microsoft Authenticator, Aegis etc.).
        </p>
      </div>

      <div className="flex max-w-2xl flex-col gap-lg rounded-lg bg-bg-panel p-md sm:p-lg">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <div className="flex min-w-0 items-center gap-sm">
            <Icon name="phonelink_lock" className="shrink-0 text-[22px] text-accent-default" />
            <div className="flex min-w-0 flex-col">
              <span className="text-base font-semibold text-text-primary">Autenticação em dois fatores</span>
              <span className="break-all font-mono text-xs text-outline">{sessao?.username ?? "—"}</span>
            </div>
          </div>
          {sessao && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${
                sessao.mfaAtivo
                  ? "border-status-success/40 bg-status-success/10 text-status-success"
                  : "border-status-warning/40 bg-status-warning/10 text-status-warning"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {sessao.mfaAtivo ? "Ativo" : "Desativado"}
            </span>
          )}
        </div>

        {sessao && !sessao.mfaAtivo && !configuracao && (
          <div>
            <Button onClick={iniciarAtivacao} disabled={enviando}>
              {enviando ? "Gerando segredo..." : "Ativar MFA"}
            </Button>
          </div>
        )}

        {configuracao && (
          <form onSubmit={confirmarAtivacao} className="flex flex-col gap-md">
            <p className="text-sm text-text-muted">
              1. No app autenticador, adicione uma conta manualmente com o segredo abaixo (ou
              importe a URI). 2. Digite o código de 6 dígitos que o app mostrar.
            </p>
            <div className="flex flex-col gap-sm rounded-sm bg-bg-primary p-md">
              <div className="flex items-center justify-between gap-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Segredo</span>
                  <span className="break-all font-mono text-base tracking-wider text-text-primary">
                    {agruparSegredo(configuracao.segredo)}
                  </span>
                </div>
                <CopyButton valor={configuracao.segredo} rotulo="Copiar segredo" />
              </div>
              <div className="flex items-center justify-between gap-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-outline">URI otpauth://</span>
                  <span className="break-all font-mono text-xs text-text-muted">{configuracao.uri}</span>
                </div>
                <CopyButton valor={configuracao.uri} rotulo="Copiar URI" />
              </div>
            </div>
            <CampoCodigo valor={codigo} onChange={setCodigo} />
            <div className="flex gap-sm">
              <Button type="button" variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando || codigo.length !== 6}>
                {enviando ? "Confirmando..." : "Confirmar e ativar"}
              </Button>
            </div>
          </form>
        )}

        {sessao?.mfaAtivo && !desativando && (
          <div>
            <Button variant="secondary" onClick={() => setDesativando(true)}>
              Desativar MFA
            </Button>
          </div>
        )}

        {desativando && (
          <form onSubmit={confirmarDesativacao} className="flex flex-col gap-md">
            <p className="text-sm text-text-muted">
              Para desativar, confirme com um código atual do app autenticador.
            </p>
            <CampoCodigo valor={codigo} onChange={setCodigo} />
            <div className="flex gap-sm">
              <Button type="button" variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando || codigo.length !== 6}>
                {enviando ? "Desativando..." : "Confirmar desativação"}
              </Button>
            </div>
          </form>
        )}

        {erro && (
          <p role="alert" className="text-sm text-status-danger">
            {erro}
          </p>
        )}
        {sucesso && <p className="text-sm text-status-success">{sucesso}</p>}
      </div>
    </div>
  );
}
