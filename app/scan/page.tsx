"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CameraCapture, type CameraCaptureHandle } from "@/components/CameraCapture";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import type { AreaCofre, ScanResult } from "@/lib/types";

type Estado = "aguardando" | "analisando" | "resultado";

/** Áreas do cofre, na ordem dos níveis exigidos (ver AreaCofre no back-end). */
const AREAS: { valor: AreaCofre; rotulo: string; nivel: number }[] = [
  { valor: "GERAL", rotulo: "Acesso Geral", nivel: 1 },
  { valor: "DIRETORIA", rotulo: "Diretoria", nivel: 2 },
  { valor: "MINISTRO", rotulo: "Ministro", nivel: 3 },
];

const CHAVE_AREA = "siab.scan.area";

/**
 * Área em que este terminal está instalado. Fica salva no navegador para o
 * kiosk continuar na mesma área depois de recarregar a página.
 */
function useAreaDoTerminal() {
  const [area, setArea] = useState<AreaCofre>("GERAL");

  useEffect(() => {
    const salva = window.localStorage.getItem(CHAVE_AREA);
    if (AREAS.some((a) => a.valor === salva)) {
      setArea(salva as AreaCofre);
    }
  }, []);

  function trocarArea(nova: AreaCofre) {
    setArea(nova);
    window.localStorage.setItem(CHAVE_AREA, nova);
  }

  return [area, trocarArea] as const;
}

function useRelogio() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
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
 * Tela /scan — reconhecimento facial em tempo real (RF02/RF03/RF04).
 * Fica ligada o dia inteiro ao lado do "cofre". Fluxo:
 * 1. Captura um frame (manual, pelo botão — ver TODO abaixo)
 * 2. Envia para POST /api/recognition/scan junto com a área do cofre em
 *    que o terminal está (back-end roda as 5 fases e compara o nível do
 *    usuário com o nível exigido pela área)
 * 3. Mostra o resultado por alguns segundos e volta a aguardar
 *
 * TODO (UX de produção): hoje a captura é manual (botão "Capturar" do
 * CameraCapture). Para o uso real (alguém chega e o sistema já reconhece
 * sozinho), o ideal é capturar automaticamente a cada X segundos usando o
 * ref (CameraCaptureHandle) em vez do botão — troque
 * showCaptureButton={true} abaixo e implemente um setInterval chamando
 * camRef.current?.capturarFrame(). Não fiz isso automático no esqueleto
 * para o grupo poder testar manualmente frame a frame primeiro.
 */
export default function ScanPage() {
  const camRef = useRef<CameraCaptureHandle>(null);
  const [estado, setEstado] = useState<Estado>("aguardando");
  const [resultado, setResultado] = useState<ScanResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const agora = useRelogio();
  const [area, setArea] = useAreaDoTerminal();

  async function handleCapture(imagem: Blob) {
    setEstado("analisando");
    setErro(null);

    try {
      const res = await api.reconhecerRosto(imagem, area);
      setResultado(res);
      setEstado("resultado");

      // Volta ao estado de espera depois de alguns segundos, pronto para
      // a próxima pessoa.
      setTimeout(() => {
        setEstado("aguardando");
        setResultado(null);
      }, 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao processar reconhecimento.");
      setEstado("aguardando");
    }
  }

  const concedido = resultado?.acessoConcedido ?? false;
  const areaDoResultado = AREAS.find((a) => a.valor === resultado?.area);

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-default bg-bg-panel/95 px-lg backdrop-blur md:px-2xl">
        <div className="flex items-center gap-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-default text-sm font-bold text-bg-primary">
            S
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-tight text-text-primary">
              Terminal Cofre Central
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent-default">
              Zona Ômega // SIAB Biometric Safe
            </span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <Link href="/admin" className="hidden text-sm text-text-secondary hover:text-text-primary sm:block">
            Painel Admin
          </Link>
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
        {/* Área protegida por este terminal */}
        <div className="flex w-full flex-col gap-xs rounded-lg bg-bg-panel p-sm">
          <span id="rotulo-area" className="font-mono text-[10px] uppercase tracking-wide text-outline">
            Área Protegida // Nível Exigido
          </span>
          <div role="radiogroup" aria-labelledby="rotulo-area" className="grid grid-cols-3 gap-xs">
            {AREAS.map((opcao) => {
              const selecionada = opcao.valor === area;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  disabled={estado === "analisando"}
                  onClick={() => setArea(opcao.valor)}
                  className={`flex items-center justify-between gap-xs rounded-sm px-sm py-xs font-mono text-xs font-medium uppercase transition-colors disabled:opacity-50 ${
                    selecionada
                      ? "bg-accent-default text-bg-primary"
                      : "bg-bg-chip text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span>{opcao.rotulo}</span>
                  <span className={selecionada ? "text-bg-primary" : "text-text-muted"}>N{opcao.nivel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tira de telemetria */}
        <div className="grid w-full grid-cols-2 gap-md md:grid-cols-3">
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Sensor de Captura</span>
            <span className="font-mono text-sm font-medium text-accent-default">Webcam (navegador)</span>
          </div>
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Vetor de Embeddings</span>
            <span className="font-mono text-sm font-medium text-text-primary">128-DIM</span>
          </div>
          <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-sm">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Detecção de Vivacidade</span>
            <span className="font-mono text-sm font-medium text-text-muted">Pendente (back-end)</span>
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
                onCapture={handleCapture}
                showCaptureButton={false}
                overlay={estado === "analisando" ? reticuloFacial : undefined}
                containerClassName="relative h-64 w-64 sm:h-72 sm:w-72"
                videoClassName="h-full w-full object-cover"
              />
              {estado === "analisando" && (
                <div className="absolute left-0 right-0 top-1/2 h-1 animate-[bounce_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent-default to-transparent opacity-80" />
              )}
            </div>
          </div>

          <div className="mt-md flex flex-col items-center gap-sm text-center">
            {estado === "aguardando" && (
              <span className="font-mono text-sm font-medium text-accent-default">
                Aguardando aproximação facial
              </span>
            )}
            {estado === "analisando" && (
              <div className="flex items-center gap-sm font-mono text-sm font-medium text-accent-default">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent-default" />
                <span>Analisando rosto // comparação biométrica ativa</span>
              </div>
            )}
            {estado === "aguardando" && (
              <button
                type="button"
                onClick={() => camRef.current?.capturarFrame()}
                className="rounded-md bg-accent-default px-lg py-sm text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90"
              >
                Capturar e Verificar
              </button>
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

            <div className="mt-md grid grid-cols-1 gap-md rounded-lg bg-bg-chip p-md md:grid-cols-4">
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
                  {areaDoResultado ? `${areaDoResultado.rotulo} (N${resultado.nivelExigido})` : "—"}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Confiança</span>
                <div className="font-mono text-sm font-semibold text-text-primary">
                  {(resultado.similaridade * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {!concedido && (
              <p className="mt-sm text-center text-sm text-text-secondary">{resultado.motivo}</p>
            )}
          </div>
        )}

        {erro && <p className="text-sm text-status-danger">{erro}</p>}
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
