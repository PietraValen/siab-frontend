"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";

export type CameraCaptureHandle = {
  /** Captura um frame e entrega via onCapture. */
  capturarFrame: () => void;
  /** Captura um frame e devolve o JPEG direto (null se a câmera não estiver pronta). */
  capturarBlob: () => Promise<Blob | null>;
};

type CameraCaptureProps = {
  /** Chamado com o frame capturado (JPEG) quando um frame é tirado. */
  onCapture?: (imagem: Blob) => void;
  /** Se true, mostra o botão de captura; se false, é controlado via ref (ver CameraCaptureHandle). */
  showCaptureButton?: boolean;
  /** Sobrepõe guias/retículos decorativos por cima do vídeo (posicionamento absoluto). */
  overlay?: ReactNode;
  /** Sobrescreve as classes do contêiner relativo que envolve o vídeo (formato/borda). */
  containerClassName?: string;
  /** Sobrescreve as classes do próprio <video> (ex.: aspect-ratio, object-fit). */
  videoClassName?: string;
  /**
   * Avisa quando o vídeo passa a ter dimensões (primeiro frame decodificado).
   * Antes disso capturarBlob() devolve null, então quem dispara a captura
   * pelo ref deve esperar este sinal.
   */
  onProntoChange?: (pronto: boolean) => void;
};

/**
 * Fase 1 (Aquisição) do lado do front-end: abre a webcam via getUserMedia
 * e permite capturar um frame como Blob JPEG, pronto para enviar ao
 * back-end (ver lib/api.ts -> cadastrarRosto / reconhecerRosto).
 *
 * Componentes-pai que precisam disparar a captura programaticamente (ex.:
 * a tela /scan capturando a cada N segundos) usam um ref:
 *
 *   const camRef = useRef<CameraCaptureHandle>(null);
 *   <CameraCapture ref={camRef} onCapture={...} showCaptureButton={false} />
 *   camRef.current?.capturarFrame();
 *
 * Para o liveness por piscada (ver LivenessService no back-end), a tela
 * /scan acumula uma SEQUÊNCIA de frames chamando capturarBlob() várias
 * vezes em intervalo curto.
 */
export const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  function CameraCapture(
    { onCapture, showCaptureButton = true, overlay, containerClassName, videoClassName, onProntoChange },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [pronto, setPronto] = useState(false);

    useEffect(() => {
      let stream: MediaStream | null = null;

      async function iniciarCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 640, height: 480 },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch {
          setErro(
            "Não foi possível acessar a câmera. Verifique as permissões do navegador.",
          );
        }
      }

      iniciarCamera();

      return () => {
        stream?.getTracks().forEach((track) => track.stop());
      };
    }, []);

    function capturarBlob(): Promise<Blob | null> {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return Promise.resolve(null);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return Promise.resolve(null);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    }

    function capturarFrame() {
      capturarBlob().then((blob) => {
        if (blob) onCapture?.(blob);
      });
    }

    useImperativeHandle(ref, () => ({ capturarFrame, capturarBlob }));

    // Só "pronto" quando o vídeo já tem dimensões: com o stream atribuído
    // mas sem metadados, videoWidth ainda é 0 e a captura sairia vazia.
    function aoCarregarMetadados() {
      setPronto(true);
      onProntoChange?.(true);
    }

    if (erro) {
      return (
        <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-status-danger bg-bg-elevated p-md text-center text-sm text-status-danger">
          {erro}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-md">
        <div
          className={
            containerClassName ??
            "relative w-full overflow-hidden rounded-lg border border-dashed border-accent-default bg-black"
          }
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={aoCarregarMetadados}
            className={videoClassName ?? "aspect-video w-full object-cover"}
          />
          {!pronto && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
              Iniciando câmera...
            </div>
          )}
          {pronto && overlay}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {showCaptureButton && (
          <button
            type="button"
            onClick={capturarFrame}
            disabled={!pronto}
            className="rounded-md bg-accent-default px-lg py-md text-sm font-semibold text-bg-primary disabled:opacity-40"
          >
            Capturar
          </button>
        )}
      </div>
    );
  },
);
