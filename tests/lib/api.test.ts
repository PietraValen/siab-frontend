import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";

describe("api.cadastrarRosto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia o token do admin no header Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ embeddingId: 1, algoritmo: "LBPH", mensagem: "ok" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.cadastrarRosto("token-do-admin", 7, new Blob(["x"], { type: "image/jpeg" }));

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/enrollment$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-do-admin" });
    // FormData: o navegador define o Content-Type com o boundary sozinho.
    expect(init.headers).not.toHaveProperty("Content-Type");
    expect((init.body as FormData).get("usuarioId")).toBe("7");
  });
});
