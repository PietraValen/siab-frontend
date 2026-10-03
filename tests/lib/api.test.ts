import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, limparTokenCsrf } from "@/lib/api";

const json = (corpo: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(corpo), { status: 200, ...init });

const respostaCsrf = (token = "csrf-1") => json({ headerName: "X-XSRF-TOKEN", token });

function chamadas(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), init: init as RequestInit }));
}

describe("lib/api", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    limparTokenCsrf();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("CSRF + cookie de sessão", () => {
    it("um POST busca o token em /api/auth/csrf antes e manda X-XSRF-TOKEN", async () => {
      fetchMock
        .mockResolvedValueOnce(respostaCsrf())
        .mockResolvedValueOnce(json({ id: 1, nome: "Ana", cargo: null, nivelAcesso: "Ministro", possuiPin: true, criadoEm: "" }));

      await api.criarUsuario({ nome: "Ana", cargo: "", nivelAcessoId: 3, pin: "1234" });

      const [csrf, post] = chamadas(fetchMock);
      expect(csrf!.url).toMatch(/\/api\/auth\/csrf$/);
      expect(csrf!.init.credentials).toBe("include");
      expect(post!.url).toMatch(/\/api\/admin\/usuarios$/);
      expect(post!.init.method).toBe("POST");
      expect(post!.init.credentials).toBe("include");
      expect(post!.init.headers).toMatchObject({ "X-XSRF-TOKEN": "csrf-1" });
      expect(post!.init.headers).not.toHaveProperty("Authorization");
      expect(JSON.parse(post!.init.body as string)).toEqual({
        nome: "Ana",
        cargo: "",
        nivelAcessoId: 3,
        pin: "1234",
      });
    });

    it("um GET vai com o cookie, mas sem buscar nem mandar token CSRF", async () => {
      fetchMock.mockResolvedValueOnce(json([]));

      await api.listarUsuarios();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [get] = chamadas(fetchMock);
      expect(get!.url).toMatch(/\/api\/admin\/usuarios$/);
      expect(get!.init.credentials).toBe("include");
      expect(get!.init.headers).not.toHaveProperty("X-XSRF-TOKEN");
    });

    it("reaproveita o token em memória entre requisições", async () => {
      fetchMock
        .mockResolvedValueOnce(respostaCsrf())
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      await api.revogarTerminal(1);
      await api.revogarTerminal(2);

      const urls = chamadas(fetchMock).map((c) => c.url);
      expect(urls.filter((u) => u.endsWith("/api/auth/csrf"))).toHaveLength(1);
    });

    it("num 403, renova o token uma vez e repete a requisição", async () => {
      fetchMock
        .mockResolvedValueOnce(respostaCsrf("velho"))
        .mockResolvedValueOnce(new Response("", { status: 403 }))
        .mockResolvedValueOnce(respostaCsrf("novo"))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      await api.logout();

      const ultima = chamadas(fetchMock)[3]!;
      expect(ultima.url).toMatch(/\/api\/auth\/logout$/);
      expect(ultima.init.headers).toMatchObject({ "X-XSRF-TOKEN": "novo" });
    });

    it("o login também manda o token CSRF e ignora o token do corpo", async () => {
      fetchMock
        .mockResolvedValueOnce(respostaCsrf())
        .mockResolvedValueOnce(json({ token: "jwt", tokenType: "Bearer", expiraEm: "" }));

      await expect(api.login("admin", "senha", "123456")).resolves.toBeUndefined();

      const login = chamadas(fetchMock)[1]!;
      expect(login.init.headers).toMatchObject({ "X-XSRF-TOKEN": "csrf-1" });
      expect(JSON.parse(login.init.body as string)).toEqual({
        username: "admin",
        password: "senha",
        codigoMfa: "123456",
      });
      expect(window.localStorage.length).toBe(0);
    });
  });

  describe("erros", () => {
    it("usa o campo `mensagem` do corpo e expõe status, corpo e Retry-After", async () => {
      fetchMock.mockResolvedValueOnce(respostaCsrf()).mockResolvedValueOnce(
        json(
          { mensagem: "Muitas tentativas." },
          { status: 429, headers: { "Retry-After": "42" } },
        ),
      );

      const erro = await api.login("admin", "x").catch((e) => e);

      expect(erro).toBeInstanceOf(ApiError);
      expect(erro.message).toBe("Muitas tentativas.");
      expect(erro.status).toBe(429);
      expect(erro.retryAfter).toBe(42);
    });

    it("traz mfaNecessario no corpo do 401", async () => {
      fetchMock
        .mockResolvedValueOnce(respostaCsrf())
        .mockResolvedValueOnce(json({ mensagem: "Código MFA necessário.", mfaNecessario: true }, { status: 401 }));

      const erro = (await api.login("admin", "x").catch((e) => e)) as ApiError;

      expect(erro.corpo).toMatchObject({ mfaNecessario: true });
    });
  });

  describe("quiosque (/api/recognition)", () => {
    it("o desafio vai sem cookie e com X-Terminal-Id", async () => {
      fetchMock.mockResolvedValueOnce(json({ nonce: "n" }));

      await api.obterDesafio("7");

      const [desafio] = chamadas(fetchMock);
      expect(desafio!.url).toMatch(/\/api\/recognition\/desafio$/);
      expect(desafio!.init.credentials).toBe("omit");
      expect(desafio!.init.headers).toMatchObject({ "X-Terminal-Id": "7" });
    });

    it("o scan vai sem cookie nem CSRF, com os headers da assinatura e os frames em `imagens`", async () => {
      fetchMock.mockResolvedValueOnce(json({ acessoConcedido: false, usuario: null, mensagem: "Negado." }));

      await api.reconhecerRosto({
        terminalId: "7",
        nonce: "abc",
        timestamp: "1700000000000",
        assinatura: "c2ln",
        frames: [new Blob(["a"]), new Blob(["b"]), new Blob(["c"])],
        pin: "1234",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [scan] = chamadas(fetchMock);
      expect(scan!.url).toMatch(/\/api\/recognition\/scan$/);
      expect(scan!.init.credentials).toBe("omit");
      expect(scan!.init.headers).toEqual({
        "X-Terminal-Id": "7",
        "X-Desafio": "abc",
        "X-Timestamp": "1700000000000",
        "X-Assinatura": "c2ln",
      });
      const form = scan!.init.body as FormData;
      expect(form.getAll("imagens")).toHaveLength(3);
      expect((form.getAll("imagens")[0] as File).name).toBe("f0.jpg");
      expect(form.get("pin")).toBe("1234");
      expect(form.has("area")).toBe(false);
    });

    it("não manda o campo pin quando não há PIN", async () => {
      fetchMock.mockResolvedValueOnce(json({ acessoConcedido: false, usuario: null, mensagem: "" }));

      await api.reconhecerRosto({
        terminalId: "7",
        nonce: "abc",
        timestamp: "1",
        assinatura: "x",
        frames: [new Blob(["a"])],
      });

      expect((chamadas(fetchMock)[0]!.init.body as FormData).has("pin")).toBe(false);
    });
  });

  it("cadastrarRosto vai com o cookie (sem Authorization) e sem Content-Type fixo", async () => {
    fetchMock
      .mockResolvedValueOnce(respostaCsrf())
      .mockResolvedValueOnce(json({ embeddingId: 1, algoritmo: "LBPH", mensagem: "ok" }));

    await api.cadastrarRosto(7, new Blob(["x"], { type: "image/jpeg" }));

    const envio = chamadas(fetchMock)[1]!;
    expect(envio.url).toMatch(/\/api\/enrollment$/);
    expect(envio.init.credentials).toBe("include");
    expect(envio.init.headers).not.toHaveProperty("Authorization");
    // FormData: o navegador define o Content-Type com o boundary sozinho.
    expect(envio.init.headers).not.toHaveProperty("Content-Type");
    expect((envio.init.body as FormData).get("usuarioId")).toBe("7");
  });
});
