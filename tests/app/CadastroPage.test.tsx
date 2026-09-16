import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroPage from "@/app/cadastro/page";
import { api } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    existeAdministrador: vi.fn(),
    criarAdministrador: vi.fn(),
  },
}));

describe("CadastroPage (bootstrap do primeiro administrador)", () => {
  beforeEach(() => {
    vi.mocked(api.existeAdministrador).mockReset();
  });

  it("mostra 'Cadastro encerrado' em vez do formulário quando já existe um administrador", async () => {
    vi.mocked(api.existeAdministrador).mockResolvedValue({ existe: true });

    render(<CadastroPage />);

    expect(await screen.findByText("Cadastro encerrado")).toBeInTheDocument();
    expect(
      screen.getByText("Peça a um administrador existente para criar sua conta."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Usuário")).not.toBeInTheDocument();
  });

  it("mostra o formulário de cadastro quando ainda não existe administrador", async () => {
    vi.mocked(api.existeAdministrador).mockResolvedValue({ existe: false });

    render(<CadastroPage />);

    expect(
      await screen.findByRole("button", { name: "Solicitar Credenciamento" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.queryByText("Cadastro encerrado")).not.toBeInTheDocument();
  });
});
