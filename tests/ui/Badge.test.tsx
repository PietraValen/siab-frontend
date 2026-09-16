import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("mostra 'Geral' para o nível Acesso Geral", () => {
    render(<Badge nivel="Acesso Geral" />);
    expect(screen.getByText("Geral")).toBeInTheDocument();
  });

  it("mostra 'Diretoria' e 'Ministro' sem abreviar", () => {
    render(<Badge nivel="Diretoria" />);
    expect(screen.getByText("Diretoria")).toBeInTheDocument();
  });
});
