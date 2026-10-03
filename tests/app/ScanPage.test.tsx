import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScanPage from "@/app/scan/page";
import { api, ApiError } from "@/lib/api";
import { assinarScan, desparear, obterPareamento, parear } from "@/lib/terminal";
import type { Desafio } from "@/lib/types";

// getUserMedia não existe em jsdom: troca a câmera por um componente que
// entrega um frame falso a cada capturarBlob() chamado pela página.
vi.mock("@/components/CameraCapture", () => ({
  CameraCapture: forwardRef(function CameraFalsa(_props, ref) {
    useImperativeHandle(ref, () => ({
      capturarFrame: () => undefined,
      capturarBlob: async () => new Blob(["frame"], { type: "image/jpeg" }),
    }));
    return <div>câmera falsa</div>;
  }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { obterDesafio: vi.fn(), reconhecerRosto: vi.fn() },
}));

vi.mock("@/lib/terminal", () => ({
  obterPareamento: vi.fn(),
  parear: vi.fn(),
  desparear: vi.fn(),
  assinarScan: vi.fn(),
}));

const pareamento = { terminalId: "7", chave: {} as CryptoKey };

function desafio(parcial: Partial<Desafio> = {}): Desafio {
  return {
    nonce: "nonce-1",
    expiraEm: "2026-10-03T12:00:00Z",
    terminal: "Núcleo do Cofre",
    nivelExigidoId: 2,
    nivelExigido: "Diretoria",
    exigePin: false,
    ...parcial,
  };
}

/** O botão só fica habilitado depois que o desafio inicial mostra a porta. */
async function clicarCapturar() {
  const botao = await screen.findByRole("button", { name: "Capturar e Verificar" });
  await waitFor(() => expect(botao).toBeEnabled());
  fireEvent.click(botao);
}

// A captura real leva ~2 s (8 frames com intervalo de 250 ms).
const ESPERA_CAPTURA = { timeout: 5000 };

describe("ScanPage (quiosque pareado com terminal)", () => {
  beforeEach(() => {
    vi.mocked(obterPareamento).mockReset().mockResolvedValue(pareamento);
    vi.mocked(parear).mockReset();
    vi.mocked(desparear).mockReset().mockResolvedValue(undefined);
    vi.mocked(assinarScan).mockReset().mockResolvedValue({ timestamp: "1700000000000", assinatura: "c2ln" });
    vi.mocked(api.obterDesafio).mockReset().mockResolvedValue(desafio());
    vi.mocked(api.reconhecerRosto).mockReset();
  });

  it("mostra a tela de pareamento quando o quiosque ainda não foi pareado", async () => {
    vi.mocked(obterPareamento).mockResolvedValue(null);
    vi.mocked(parear).mockResolvedValue(pareamento);

    render(<ScanPage />);

    fireEvent.change(await screen.findByLabelText("ID do terminal"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Chave do terminal"), { target: { value: "Y2hhdmU=" } });
    fireEvent.click(screen.getByRole("button", { name: "Parear terminal" }));

    expect(parear).toHaveBeenCalledWith("7", "Y2hhdmU=");
    expect(await screen.findByText("Porta Protegida // Nível Exigido")).toBeInTheDocument();
    expect(api.obterDesafio).toHaveBeenCalledWith("7");
  });

  it("mostra a porta e o nível exigido que vêm do cadastro do terminal", async () => {
    render(<ScanPage />);

    expect((await screen.findAllByText("Núcleo do Cofre")).length).toBeGreaterThan(0);
    expect(screen.getByText("Diretoria")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("captura uma sequência de frames, assina com um desafio novo e mostra a mensagem", async () => {
    vi.mocked(api.obterDesafio)
      .mockResolvedValueOnce(desafio())
      .mockResolvedValueOnce(desafio({ nonce: "nonce-2" }));
    vi.mocked(api.reconhecerRosto).mockResolvedValue({
      acessoConcedido: true,
      usuario: { nome: "Ana", nivelAcesso: "Diretoria" },
      mensagem: "Bem-vinda, Ana.",
    });

    render(<ScanPage />);
    await clicarCapturar();

    expect(await screen.findByText("Pisque devagar")).toBeInTheDocument();
    expect(await screen.findByText("Acesso Concedido", {}, ESPERA_CAPTURA)).toBeInTheDocument();
    expect(screen.getByText("Bem-vinda, Ana.")).toBeInTheDocument();
    expect(screen.queryByText("Confiança")).not.toBeInTheDocument();

    const [, dadosAssinatura] = vi.mocked(assinarScan).mock.calls[0]!;
    expect(dadosAssinatura.nonce).toBe("nonce-2");
    expect(dadosAssinatura.frames).toHaveLength(8);
    expect(dadosAssinatura.pin).toBeUndefined();

    expect(api.reconhecerRosto).toHaveBeenCalledWith({
      terminalId: "7",
      nonce: "nonce-2",
      timestamp: "1700000000000",
      assinatura: "c2ln",
      frames: dadosAssinatura.frames,
      pin: undefined,
    });
  });

  it("pede o PIN antes de capturar quando a porta exige", async () => {
    vi.mocked(api.obterDesafio).mockResolvedValue(
      desafio({ nivelExigidoId: 3, nivelExigido: "Ministro", exigePin: true }),
    );
    vi.mocked(api.reconhecerRosto).mockResolvedValue({
      acessoConcedido: false,
      usuario: null,
      mensagem: "Acesso negado.",
    });

    render(<ScanPage />);
    await clicarCapturar();

    const campoPin = screen.getByLabelText("PIN de acesso");
    expect(campoPin).toHaveAttribute("type", "password");
    fireEvent.change(campoPin, { target: { value: "12a34" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("Acesso Negado", {}, ESPERA_CAPTURA)).toBeInTheDocument();
    expect(screen.getByText("Acesso negado.")).toBeInTheDocument();
    expect(vi.mocked(assinarScan).mock.calls[0]![1].pin).toBe("1234");
    expect(vi.mocked(api.reconhecerRosto).mock.calls[0]![0].pin).toBe("1234");
  });

  it("avisa e oferece novo pareamento quando o terminal foi revogado (401)", async () => {
    vi.mocked(api.obterDesafio).mockRejectedValue(
      new ApiError(401, "Terminal não autorizado.", { mensagem: "Terminal não autorizado." }, null),
    );

    render(<ScanPage />);

    expect(await screen.findByText(/Terminal não autorizado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Parear novamente" }));

    await waitFor(() => expect(desparear).toHaveBeenCalled());
    expect(await screen.findByLabelText("ID do terminal")).toBeInTheDocument();
  });

  it("mostra 'muitas tentativas' quando o back-end responde 429", async () => {
    vi.mocked(api.reconhecerRosto).mockRejectedValue(
      new ApiError(429, "Limite excedido.", { mensagem: "Limite excedido." }, 30),
    );

    render(<ScanPage />);
    await clicarCapturar();

    expect(
      await screen.findByText("Muitas tentativas. Aguarde 30 s e tente novamente.", {}, ESPERA_CAPTURA),
    ).toBeInTheDocument();
  });
});
