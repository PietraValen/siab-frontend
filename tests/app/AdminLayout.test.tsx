import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import { api, ApiError } from "@/lib/api";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { sessao: vi.fn(), logout: vi.fn() },
}));

describe("AdminLayout (guard de autenticação)", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(api.sessao).mockReset();
    vi.mocked(api.logout).mockReset().mockResolvedValue(undefined);
  });

  it("redireciona para /login quando não há sessão (401)", async () => {
    vi.mocked(api.sessao).mockRejectedValue(new ApiError(401, "Não autenticado.", null, null));

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("renderiza o conteúdo e o usuário quando a sessão é válida", async () => {
    vi.mocked(api.sessao).mockResolvedValue({ username: "admin", mfaAtivo: true });

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    expect(await screen.findByText("Conteúdo protegido")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("MFA ativo")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("'Sair' revoga a sessão no back-end e volta para /login", async () => {
    vi.mocked(api.sessao).mockResolvedValue({ username: "admin", mfaAtivo: false });

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Sair/ }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(api.logout).toHaveBeenCalled();
  });

  it("não guarda nada de sessão em localStorage", async () => {
    window.localStorage.clear();
    vi.mocked(api.sessao).mockResolvedValue({ username: "admin", mfaAtivo: false });

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    await screen.findByText("Conteúdo protegido");
    expect(window.localStorage.length).toBe(0);
  });

  it("abre e fecha o menu lateral (gaveta) pelo botão do cabeçalho", async () => {
    vi.mocked(api.sessao).mockResolvedValue({ username: "admin", mfaAtivo: true });

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    const abrir = await screen.findByRole("button", { name: "Abrir menu" });
    expect(abrir).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(abrir);
    expect(abrir).toHaveAttribute("aria-expanded", "true");

    // Navegar por um link fecha a gaveta.
    fireEvent.click(screen.getByRole("link", { name: /Logs de Acesso/ }));
    expect(abrir).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(abrir);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(abrir).toHaveAttribute("aria-expanded", "false");
  });
});
