import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import { salvarToken } from "@/lib/auth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace, push: vi.fn() }),
}));

function criarTokenValido() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.assinatura`;
}

describe("AdminLayout (guard de autenticação)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    replace.mockClear();
  });

  it("redireciona para /login quando não há token", async () => {
    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("redireciona para /login quando o token está expirado", async () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
    salvarToken(`header.${payload}.assinatura`);

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("renderiza o conteúdo quando há um token válido", async () => {
    salvarToken(criarTokenValido());

    render(
      <AdminLayout>
        <p>Conteúdo protegido</p>
      </AdminLayout>,
    );

    expect(await screen.findByText("Conteúdo protegido")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
