"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CameraCaptureHandle = {
  capturarFrame: () => void;
};

type CameraCaptureProps = {
  /** Chamado com o frame capturado (JPEG) quando um frame é tirado. */
  onCapture: (imagem: Blob) => void;
  /** Se true, mostra o botão de captura; se false, é controlado via ref (ver CameraCaptureHandle). */
  showCaptureButton?: boolean;
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
 * TODO (liveness no front-end): se o grupo decidir implementar a técnica
 * de "piscar de olhos" (ver LivenessService no back-end), quem chama este
 * componente precisará acumular uma SEQUÊNCIA de frames (chamando
 * capturarFrame() várias vezes em intervalo curto), não um único Blob.
 */
export const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  function CameraCapture({ onCapture, showCaptureButton = true }, ref) {
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
            setPronto(true);
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

    function capturarFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) onCapture(blob);
        },
        "image/jpeg",
        0.9,
      );
    }

    useImperativeHandle(ref, () => ({ capturarFrame }));

    if (erro) {
      return (
        <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-status-danger bg-bg-elevated p-md text-center text-sm text-status-danger">
          {erro}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-md">
        <div className="relative w-full overflow-hidden rounded-lg border border-dashed border-accent-default bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full object-cover"
          />
          {!pronto && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
              Iniciando câmera...
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {showCaptureButton && (
          <button
            type="button"
            onClick={capturarFrame}
            disabled={!pronto}
            className="rounded-md bg-accent-default px-lg py-md text-sm font-semibold text-text-primary disabled:opacity-40"
          >
            Capturar
          </button>
        )}
      </div>
    );
  },
);
