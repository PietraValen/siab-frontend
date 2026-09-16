"use client";

import { useRef, useState } from "react";
import { CameraCapture, type CameraCaptureHandle } from "@/components/CameraCapture";
import { StatusPill } from "@/components/ui/StatusPill";
import { api } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

type Estado = "aguardando" | "analisando" | "resultado";

/**
 * Tela /scan — reconhecimento facial em tempo real (RF02/RF03/RF04).
 * Fica ligada o dia inteiro ao lado do "cofre". Fluxo:
 * 1. Captura um frame (manual, pelo botão — ver TODO abaixo)
 * 2. Envia para POST /api/recognition/scan (back-end roda as 5 fases)
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

  async function handleCapture(imagem: Blob) {
    setEstado("analisando");
    setErro(null);

    try {
      const res = await api.reconhecerRosto(imagem);
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-xl bg-bg-primary p-lg">
      <h1 className="text-2xl font-bold text-text-primary">Verificação de Identidade</h1>

      <div className="w-full max-w-md">
        <CameraCapture ref={camRef} onCapture={handleCapture} />
      </div>

      {estado === "analisando" && (
        <p className="text-sm font-semibold text-accent-default">Analisando rosto...</p>
      )}

      {estado === "resultado" && resultado && (
        <div className="flex flex-col items-center gap-2">
          <StatusPill tipo={resultado.acessoConcedido ? "concedido" : "negado"} />
          {resultado.usuario ? (
            <p className="text-sm text-text-secondary">
              {resultado.usuario.nome} — Nível: {resultado.usuario.nivelAcesso}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">{resultado.motivo}</p>
          )}
        </div>
      )}

      {erro && <p className="text-sm text-status-danger">{erro}</p>}
    </main>
  );
}
