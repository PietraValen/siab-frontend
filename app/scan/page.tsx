"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CameraCapture, type CameraCaptureHandle } from "@/components/CameraCapture";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useRelogio } from "@/hooks/useRelogio";
import { api, ApiError } from "@/lib/api";
import { assinarScan, desparear, obterPareamento, parear, type Pareamento } from "@/lib/terminal";
import type { Desafio, ScanResult } from "@/lib/types";

type Estado = "aguardando" | "pin" | "capturando" | "analisando" | "resultado";

/**
 * Sequência capturada por tentativa: o liveness do back-end procura uma
 * piscada (olhos abertos -> fechados -> abertos) ao longo dos frames, e
 * aceita de 3 a 12. ~8 frames em ~2 s cobrem uma piscada lenta.
 */
const TOTAL_FRAMES = 8;
const INTERVALO_FRAMES_MS = 250;

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mensagem de erro para a tela do quiosque (429 e 401 têm texto próprio). */
function mensagemDeErro(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return err.retryAfter
      ? `Muitas tentativas. Aguarde ${err.retryAfter} s e tente novamente.`
      : "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }
  return err instanceof Error ? err.message : "Erro ao processar reconhecimento.";
}

const reticuloFacial = (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <svg className="h-[70%] w-[70%] text-accent-default" viewBox="0 0 320 320">
      <rect x="90" y="70" width="140" height="175" rx="8" fill="none" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" opacity="0.8" />
      <path d="M 85 85 L 85 70 L 100 70" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 235 85 L 235 70 L 220 70" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 85 230 L 85 245 L 100 245" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 235 230 L 235 245 L 220 245" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  </div>
);

/**
 * Tela de pareamento: o admin cadastra a porta em /admin/terminais e cola
 * aqui o id + chave mostrados uma única vez (ver lib/terminal.ts).
 */
function TelaPareamento({ onPareado }: { onPareado: (p: Pareamento) => void }) {
  const [terminalId, setTerminalId] = useState("");
  const [chave, setChave] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      onPareado(await parear(terminalId, chave));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível parear o terminal.");
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary p-lg">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-lg rounded-lg bg-bg-panel p-xl">
        <div className="flex flex-col gap-xs">
          <span className="font-mono text-xs uppercase tracking-widest text-accent-default">
            SIAB Terminal Kiosk // Pareamento
          </span>
          <h1 className="text-2xl font-bold text-text-primary">Parear este terminal</h1>
          <p className="text-sm text-text-secondary">
            Cadastre a porta em <span className="font-mono text-text-primary">Painel Admin → Terminais</span>{" "}
            e cole aqui o ID e a chave exibidos no cadastro.
          </p>
        </div>

        <Input
          label="ID do terminal"
          mono
          inputMode="numeric"
          required
          value={terminalId}
          onChange={(e) => setTerminalId(e.target.value)}
          placeholder="Ex.: 7"
        />
        <Input
          label="Chave do terminal"
          mono
          type="password"
          autoComplete="off"
          required
          value={chave}
          onChange={(e) => setChave(e.target.value)}
          placeholder="Chave em base64"
        />

        <Button type="submit" disabled={enviando}>
          {enviando ? "Pareando..." : "Parear terminal"}
        </Button>

        {erro && (
          <p role="alert" className="text-center text-sm text-status-danger">
            {erro}
          </p>
        )}

        <div className="flex items-center gap-xs rounded-sm bg-bg-primary px-md py-sm">
          <Icon name="lock" className="text-[18px] text-accent-default" />
          <span className="font-mono text-xs text-text-muted">
            A chave fica guardada como não extraível neste navegador.
          </span>
        </div>
      </form>
    </main>
  );
}

/**
 * Tela /scan — reconhecimento facial em tempo real (RF02/RF03/RF04).
 * Fica ligada o dia inteiro ao lado de uma porta do cofre. Fluxo:
 * 1. Pareamento (uma vez): id + chave do terminal cadastrado no painel.
 *    O nível exigido pela porta vem desse cadastro, não do quiosque.
 * 2. A cada tentativa (manual, pelo botão — ver TODO abaixo): pede o PIN
 *    se a porta exigir, captura uma sequência de frames enquanto pede uma
 *    piscada, busca um desafio novo (GET /api/recognition/desafio, nonce
 *    de uso único) e envia tudo assinado com HMAC para
 *    POST /api/recognition/scan
 * 3. Mostra o resultado por alguns segundos e volta a aguardar
 *
 * TODO (UX de produção): hoje a captura é manual (botão "Capturar e
 * Verificar"). Para o uso real (alguém chega e o sistema já reconhece
 * sozinho), o ideal é disparar `verificar()` automaticamente a cada X
 * segundos. Não fiz isso automático para o grupo poder testar manualmente
 * tentativa a tentativa primeiro.
 */
export default function ScanPage() {
  const camRef = useRef<CameraCaptureHandle>(null);
  const [pareamento, setPareamento] = useState<Pareamento | null | undefined>(undefined);
  const [porta, setPorta] = useState<Desafio | null>(null);
  const [terminalRecusado, setTerminalRecusado] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("aguardando");
  const [resultado, setResultado] = useState<ScanResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [frameAtual, setFrameAtual] = useState(0);
  const [confirmandoDesparear, setConfirmandoDesparear] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const agora = useRelogio();

  useEffect(() => {
    obterPareamento().then(setPareamento);
  }, []);

  // 401 no desafio/scan = terminal desconhecido, revogado ou assinatura
  // recusada: o quiosque não tem como se recuperar sozinho.
  const tratarErro = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      setTerminalRecusado(
        "Terminal não autorizado: ele pode ter sido revogado no painel. Peça a um administrador para parear novamente.",
      );
    } else {
      setErro(mensagemDeErro(err));
    }
  }, []);

  // Desafio inicial só para mostrar a porta e o nível exigido; cada
  // tentativa busca outro, porque o nonce é de uso único (60 s).
  useEffect(() => {
    if (!pareamento) return;
    api.obterDesafio(pareamento.terminalId).then(setPorta).catch(tratarErro);
  }, [pareamento, tratarErro]);

  async function handleDesparear() {
    await desparear().catch(() => undefined);
    setPareamento(null);
    setPorta(null);
    setTerminalRecusado(null);
    setConfirmandoDesparear(false);
    setErro(null);
  }

  async function capturarSequencia(): Promise<Blob[]> {
    const frames: Blob[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (i > 0) await esperar(INTERVALO_FRAMES_MS);
      setFrameAtual(i + 1);
      const frame = await camRef.current?.capturarBlob();
      if (frame) frames.push(frame);
    }
    return frames;
  }

  async function verificar(pinDigitado?: string) {
    if (!pareamento) return;
    setErro(null);
    setEstado("capturando");

    try {
      const frames = await capturarSequencia();
      if (frames.length < 3) {
        throw new Error("A câmera não entregou frames suficientes. Verifique a câmera e tente novamente.");
      }

      setEstado("analisando");
      const desafio = await api.obterDesafio(pareamento.terminalId);
      setPorta(desafio);
      const { timestamp, assinatura } = await assinarScan(pareamento, {
        nonce: desafio.nonce,
        frames,
        pin: pinDigitado,
      });
      const res = await api.reconhecerRosto({
        terminalId: pareamento.terminalId,
        nonce: desafio.nonce,
        timestamp,
        assinatura,
        frames,
        pin: pinDigitado,
      });

      setResultado(res);
      setEstado("resultado");

      // Volta ao estado de espera depois de alguns segundos, pronto para
      // a próxima pessoa.
      setTimeout(() => {
        setEstado("aguardando");
        setResultado(null);
      }, 4000);
    } catch (err) {
      tratarErro(err);
      setEstado("aguardando");
    } finally {
      setPin("");
    }
  }

  function iniciarTentativa() {
    if (porta?.exigePin) {
      setErro(null);
      setEstado("pin");
    } else {
      verificar();
    }
  }

  function confirmarPin(e: React.FormEvent) {
    e.preventDefault();
    verificar(pin);
  }

  if (pareamento === undefined) {
    return <main className="min-h-screen bg-bg-primary" />;
  }

  if (pareamento === null) {
    return <TelaPareamento onPareado={setPareamento} />;
  }

  const concedido = resultado?.acessoConcedido ?? false;
  const ocupado = estado === "capturando" || estado === "analisando";

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-default bg-bg-panel/95 px-lg backdrop-blur md:px-2xl">
        <div className="flex items-center gap-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-default text-sm font-bold text-bg-primary">
            S
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-tight text-text-primary">
              {porta?.terminal ?? "Terminal Cofre Central"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent-default">
              Terminal #{pareamento.terminalId}
              {" // SIAB Biometric Safe"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <Link href="/admin" className="hidden text-sm text-text-secondary hover:text-text-primary sm:block">
            Painel Admin
          </Link>
          {confirmandoDesparear ? (
            <div className="flex items-center gap-xs font-mono text-xs">
              <button
                type="button"
                onClick={handleDesparear}
                className="rounded-sm bg-status-danger/10 px-sm py-xs text-status-danger hover:bg-status-danger/20"
              >
                Confirmar desparear
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoDesparear(false)}
                className="px-xs py-xs text-text-muted hover:text-text-primary"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoDesparear(true)}
              disabled={ocupado}
              title="Desparear este terminal"
              className="flex items-center gap-xs font-mono text-xs text-outline transition-colors hover:text-status-danger disabled:opacity-40"
            >
              <Icon name="link_off" className="text-[16px]" />
              <span className="hidden sm:inline">Desparear</span>
            </button>
          )}
          <div className="hidden items-center gap-xs rounded-sm bg-bg-chip px-sm py-xs sm:flex">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                estado === "aguardando" ? "animate-pulse bg-status-success" : "bg-accent-default"
              }`}
            />
            <span className="font-mono text-xs font-medium uppercase text-status-success">
              {estado === "aguardando" ? "Hardware Armed" : "Processando"}
            </span>
          </div>
        </div>
      </header>

      {/* Sub-cabeçalho de status do kiosk */}
      <div className="flex flex-wrap items-center justify-between gap-sm bg-bg-primary px-lg py-sm md:px-2xl">
        <div className="flex items-center gap-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-default" />
          <span className="font-mono text-xs uppercase tracking-wide text-text-primary">
            SIAB Terminal Kiosk // Cofre Central
          </span>
        </div>
        <div className="flex items-center gap-lg font-mono text-xs">
          <div className="flex items-center gap-xs text-text-muted">
            <Icon name="schedule" className="text-[15px]" />
            <span>
              {agora
                ? `${agora.toLocaleTimeString("pt-BR", { hour12: false })} UTC-3`
                : "--:--:-- UTC-3"}
            </span>
          </div>
          <div
            className={`flex items-center gap-xs rounded-sm bg-bg-chip px-sm py-0.5 font-medium ${
              estado === "resultado" && concedido ? "text-status-success" : "text-status-danger"
            }`}
          >
            <Icon name="lock" className="text-[15px]" />
            <span>
              {estado === "resultado" && concedido ? "Destravamento Autorizado" : "Bloqueio Mecânico Ativo"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-lg px-lg py-xl md:px-2xl">
        {terminalRecusado && (
          <div className="flex w-full flex-col items-start gap-sm rounded-lg bg-status-danger/10 p-md md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-sm">
              <Icon name="gpp_bad" className="mt-0.5 shrink-0 text-[20px] text-status-danger" />
              <p className="text-sm text-status-danger">{terminalRecusado}</p>
            </div>
            <Button variant="secondary" onClick={handleDesparear} className="shrink-0">
              Parear novamente
            </Button>
          </div>
        )}

        {/* Porta protegida por este terminal (definida no cadastro do terminal) */}
        <div className="flex w-full items-center justify-between gap-sm rounded-lg bg-bg-panel p-sm">
          <div className="flex flex-col gap-xs">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">
              Porta Protegida // Nível Exigido
            </span>
            <span className="text-sm font-semibold text-text-primary">{porta?.terminal ?? "—"}</span>
          </div>
          <div className="flex items-center gap-sm">
            {porta?.exigePin && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-status-warning/40 bg-status-warning/10 px-2 py-0.5 font-mono text-xs font-medium uppercase text-status-warning">
                <Icon name="pin" className="text-[14px]" />
                Rosto + PIN
              </span>
            )}
            {porta && <Badge nivel={porta.nivelExigido} />}
          </div>
        </div>

        {/* Tira de telemetria */}
        <div className="grid w-full grid-cols-2 gap-md md:grid-cols-3">
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Sensor de Captura</span>
            <span className="font-mono text-sm font-medium text-accent-default">Webcam (navegador)</span>
          </div>
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Canal do Terminal</span>
            <span className="font-mono text-sm font-medium text-text-primary">HMAC-SHA256</span>
          </div>
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Detecção de Vivacidade</span>
            <span className="font-mono text-sm font-medium text-text-primary">Piscada + textura</span>
          </div>
        </div>

        {/* Viewport circular da câmera */}
        <div className="relative flex flex-col items-center">
          <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
            <div className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full opacity-40">
              <svg className="h-full w-full text-accent-default" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r="195" fill="none" stroke="currentColor" strokeDasharray="3 7" strokeWidth="1.5" />
                <circle cx="200" cy="200" r="186" fill="none" stroke="currentColor" strokeDasharray="1 15" strokeWidth="1" />
              </svg>
            </div>
            <div
              className={`absolute inset-3 rounded-full transition-colors duration-700 ${
                estado === "resultado" ? (concedido ? "bg-status-success/10" : "bg-status-danger/10") : "bg-accent-default/5"
              }`}
            />
            <div className="relative h-64 w-64 overflow-hidden rounded-full bg-bg-primary shadow-2xl sm:h-72 sm:w-72">
              <CameraCapture
                ref={camRef}
                showCaptureButton={false}
                overlay={ocupado ? reticuloFacial : undefined}
                containerClassName="relative h-64 w-64 sm:h-72 sm:w-72"
                videoClassName="h-full w-full object-cover"
                onProntoChange={setCameraPronta}
              />
              {ocupado && (
                <div className="absolute left-0 right-0 top-1/2 h-1 animate-[bounce_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent-default to-transparent opacity-80" />
              )}
            </div>
          </div>

          <div className="mt-md flex flex-col items-center gap-sm text-center">
            {estado === "aguardando" && (
              <>
                <span className="font-mono text-sm font-medium text-accent-default">
                  Aguardando aproximação facial
                </span>
                <button
                  type="button"
                  onClick={iniciarTentativa}
                  disabled={!porta || !!terminalRecusado || !cameraPronta}
                  className="rounded-md bg-accent-default px-lg py-sm text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Capturar e Verificar
                </button>
              </>
            )}
            {estado === "pin" && (
              <form onSubmit={confirmarPin} className="flex w-64 flex-col gap-sm">
                <Input
                  label="PIN de acesso"
                  mono
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="\d{4,8}"
                  minLength={4}
                  maxLength={8}
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                />
                <span className="font-mono text-xs text-text-muted">
                  Esta porta exige rosto + PIN. Digite o PIN e olhe para a câmera.
                </span>
                <div className="flex gap-sm">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setPin("");
                      setEstado("aguardando");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!/^\d{4,8}$/.test(pin)}>
                    Confirmar
                  </Button>
                </div>
              </form>
            )}
            {estado === "capturando" && (
              <div className="flex flex-col items-center gap-xs">
                <span className="flex items-center gap-sm text-lg font-bold uppercase tracking-tight text-accent-default">
                  <Icon name="visibility" className="text-[22px]" />
                  Pisque devagar
                </span>
                <span className="font-mono text-xs text-text-muted">
                  Capturando frame {frameAtual}/{TOTAL_FRAMES}
                  {" // prova de vivacidade"}
                </span>
              </div>
            )}
            {estado === "analisando" && (
              <div className="flex items-center gap-sm font-mono text-sm font-medium text-accent-default">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent-default" />
                <span>Analisando rosto // comparação biométrica ativa</span>
              </div>
            )}
          </div>
        </div>

        {/* Painel de resultado */}
        {estado === "resultado" && resultado && (
          <div className="w-full rounded-lg bg-bg-panel p-md">
            <div
              className={`flex flex-col items-center gap-sm rounded-lg px-lg py-md text-center md:flex-row md:justify-between md:text-left ${
                concedido ? "bg-status-success/15" : "bg-status-danger/15"
              }`}
            >
              <div className="flex items-center gap-md">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    concedido ? "bg-status-success text-bg-primary" : "bg-status-danger text-bg-primary"
                  }`}
                >
                  <Icon name={concedido ? "lock_open" : "block"} filled className="text-2xl" />
                </div>
                <div>
                  <div
                    className={`text-lg font-bold uppercase tracking-tight ${
                      concedido ? "text-status-success" : "text-status-danger"
                    }`}
                  >
                    {concedido ? "Acesso Concedido" : "Acesso Negado"}
                  </div>
                  <div className="font-mono text-xs text-text-muted">
                    {concedido
                      ? "Destravamento eletromagnético liberado"
                      : "Tentativa registrada na auditoria do SIAB"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-md grid grid-cols-1 gap-md rounded-lg bg-bg-chip p-md md:grid-cols-3">
              <div className="flex flex-col gap-xs">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Identidade</span>
                <div className="text-sm font-semibold text-text-primary">
                  {resultado.usuario?.nome ?? "Não reconhecido"}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Nível de Acesso</span>
                <div className="text-sm font-semibold text-text-primary">
                  {resultado.usuario?.nivelAcesso ?? "—"}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Nível Exigido</span>
                <div className="text-sm font-semibold text-text-primary">
                  {porta ? `${porta.nivelExigido} (N${porta.nivelExigidoId})` : "—"}
                </div>
              </div>
            </div>

            <p className="mt-sm text-center text-sm text-text-secondary">{resultado.mensagem}</p>
          </div>
        )}

        {erro && (
          <p role="alert" className="text-sm text-status-danger">
            {erro}
          </p>
        )}
      </div>

      <footer className="border-t border-border-default bg-bg-panel px-lg py-sm md:px-2xl">
        <div className="flex flex-col items-center justify-between gap-xs font-mono text-xs text-text-muted md:flex-row">
          <span>SIAB — Terminal de Reconhecimento Facial · APS — PIVC — UNIP</span>
          <span>Câmera: acesso via getUserMedia do navegador</span>
        </div>
      </footer>
    </main>
  );
}
