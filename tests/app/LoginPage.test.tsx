import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { api, ApiError } from "@/lib/api";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { login: vi.fn() },
}));

function preencherCredenciais() {
  fireEvent.change(screen.getByLabelText("Identificador / Usuário"), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Senha de segurança"), { target: { value: "Senha@Forte123" } });
  fireEvent.click(screen.getByRole("button", { name: "Autenticar Administrador" }));
}

const erroMfa = (mensagem: string) =>
  new ApiError(401, mensagem, { mensagem, mfaNecessario: true }, null);

describe("LoginPage", () => {
  beforeEach(() => {
    push.mockClear();
    vi.mocked(api.login).mockReset();
  });

  it("pede o código MFA numa segunda etapa e reenvia usuário + senha + código", async () => {
    vi.mocked(api.login)
      .mockRejectedValueOnce(erroMfa("Informe o código do app autenticador."))
      .mockResolvedValueOnce(undefined);

    render(<LoginPage />);
    preencherCredenciais();

    const campoCodigo = await screen.findByLabelText("Código de verificação");
    // Faltar o código na primeira tentativa não é erro para o usuário.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.change(campoCodigo, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Código" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
    expect(api.login).toHaveBeenNthCalledWith(1, "admin", "Senha@Forte123", undefined);
    expect(api.login).toHaveBeenNthCalledWith(2, "admin", "Senha@Forte123", "123456");
  });

  it("mostra a mensagem do back-end quando o código MFA está errado", async () => {
    vi.mocked(api.login)
      .mockRejectedValueOnce(erroMfa("Informe o código do app autenticador."))
      .mockRejectedValueOnce(erroMfa("Código MFA inválido."));

    render(<LoginPage />);
    preencherCredenciais();

    fireEvent.change(await screen.findByLabelText("Código de verificação"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Código" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Código MFA inválido.");
    expect(screen.getByLabelText("Código de verificação")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do back-end e o tempo de espera no bloqueio (429)", async () => {
    vi.mocked(api.login).mockRejectedValue(
      new ApiError(429, "Muitas tentativas de login.", { mensagem: "Muitas tentativas de login." }, 120),
    );

    render(<LoginPage />);
    preencherCredenciais();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Muitas tentativas de login. Tente novamente em 120 s.",
    );
  });
});
