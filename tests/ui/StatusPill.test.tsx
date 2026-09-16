import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "@/components/ui/StatusPill";

describe("StatusPill", () => {
  it("mostra texto padrão de concedido", () => {
    render(<StatusPill tipo="concedido" />);
    expect(screen.getByText("Acesso Concedido")).toBeInTheDocument();
  });

  it("mostra texto padrão de negado", () => {
    render(<StatusPill tipo="negado" />);
    expect(screen.getByText("Acesso Negado")).toBeInTheDocument();
  });

  it("aceita texto customizado", () => {
    render(<StatusPill tipo="negado" texto="Nível insuficiente" />);
    expect(screen.getByText("Nível insuficiente")).toBeInTheDocument();
  });
});
