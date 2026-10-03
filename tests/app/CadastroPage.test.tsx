import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroPage from "@/app/cadastro/page";
import { api, ApiError } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: {
    existeAdministrador: vi.fn(),
    criarAdministrador: vi.fn(),
  },
}));

describe("CadastroPage (bootstrap do primeiro administrador)", () => {
  beforeEach(() => {
    vi.mocked(api.existeAdministrador).mockReset();
    vi.mocked(api.criarAdministrador).mockReset();
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

  it("mostra a mensagem do back-end (campo `mensagem`) quando o cadastro é recusado", async () => {
    vi.mocked(api.existeAdministrador).mockResolvedValue({ existe: false });
    vi.mocked(api.criarAdministrador).mockRejectedValue(
      new ApiError(400, "A senha não atende aos requisitos.", { mensagem: "A senha não atende aos requisitos." }, null),
    );

    render(<CadastroPage />);

    fireEvent.change(await screen.findByLabelText("Nome completo"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "ana" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "fraca" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "fraca" } });
    fireEvent.click(screen.getByRole("button", { name: "Solicitar Credenciamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A senha não atende aos requisitos.");
  });
});
