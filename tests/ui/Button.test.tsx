import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renderiza o texto passado como children", () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });

  it("chama onClick quando clicado", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Confirmar</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("não chama onClick quando desabilitado", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Confirmar
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
