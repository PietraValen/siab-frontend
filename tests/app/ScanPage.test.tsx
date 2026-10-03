import { fireEvent, render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScanPage from "@/app/scan/page";
import { api } from "@/lib/api";

// getUserMedia não existe em jsdom: troca a câmera por um botão que
// entrega um frame falso direto para o onCapture da página.
vi.mock("@/components/CameraCapture", () => ({
  CameraCapture: forwardRef(function CameraFalsa(props: { onCapture: (b: Blob) => void }, _ref) {
    return (
      <button type="button" onClick={() => props.onCapture(new Blob(["frame"]))}>
        frame falso
      </button>
    );
  }),
}));

vi.mock("@/lib/api", () => ({
  api: { reconhecerRosto: vi.fn() },
}));

describe("ScanPage (área protegida pelo terminal)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.reconhecerRosto).mockReset();
  });

  it("envia a área selecionada junto com o frame capturado", async () => {
    vi.mocked(api.reconhecerRosto).mockResolvedValue({
      acessoConcedido: true,
      usuario: { id: 1, nome: "Ana", nivelAcesso: "Diretoria" },
      similaridade: 0.2,
      motivo: "Acesso concedido.",
      area: "DIRETORIA",
      nivelExigido: 2,
    });

    render(<ScanPage />);
    fireEvent.click(screen.getByRole("radio", { name: /Diretoria/ }));
    fireEvent.click(screen.getByText("frame falso"));

    expect(await screen.findByText("Acesso Concedido")).toBeInTheDocument();
    expect(api.reconhecerRosto).toHaveBeenCalledWith(expect.any(Blob), "DIRETORIA");
    expect(window.localStorage.getItem("siab.scan.area")).toBe("DIRETORIA");
  });

  it("mostra o motivo quando o usuário é reconhecido mas o nível é insuficiente", async () => {
    vi.mocked(api.reconhecerRosto).mockResolvedValue({
      acessoConcedido: false,
      usuario: { id: 2, nome: "Bruno", nivelAcesso: "Acesso Geral" },
      similaridade: 0.2,
      motivo: "Nível de acesso insuficiente.",
      area: "MINISTRO",
      nivelExigido: 3,
    });

    render(<ScanPage />);
    fireEvent.click(screen.getByRole("radio", { name: /Ministro/ }));
    fireEvent.click(screen.getByText("frame falso"));

    expect(await screen.findByText("Acesso Negado")).toBeInTheDocument();
    expect(screen.getByText("Nível de acesso insuficiente.")).toBeInTheDocument();
    expect(screen.getByText("Ministro (N3)")).toBeInTheDocument();
  });

  it("usa a área salva no navegador ao recarregar o terminal", () => {
    window.localStorage.setItem("siab.scan.area", "MINISTRO");

    render(<ScanPage />);

    expect(screen.getByRole("radio", { name: /Ministro/ })).toHaveAttribute("aria-checked", "true");
  });
});
