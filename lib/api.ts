import type { AccessLog, AccessSummary, Administrador, ScanResult, Usuario } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Wrapper fino sobre fetch. Centraliza a URL base e o tratamento de erro,
 * pra não repetir isso em cada componente. O token JWT (quando existir,
 * ver TODO em auth) deve ser passado via `token` nas chamadas do painel
 * admin.
 */
async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Erro ${response.status} em ${path}: ${text || response.statusText}`);
  }

  // 204 No Content não tem corpo para parsear
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; tokenType: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  existeAdministrador: () =>
    request<{ existe: boolean }>("/api/auth/existe-administrador"),

  // Só é aceita sem `token` enquanto não existir nenhum administrador
  // cadastrado (bootstrap do primeiro admin) — ver
  // AdministradorController no back-end.
  criarAdministrador: (dados: { username: string; senha: string }) =>
    request<Administrador>("/api/admin/administradores", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  listarUsuarios: (token: string) =>
    request<Usuario[]>("/api/admin/usuarios", { token }),

  criarUsuario: (
    token: string,
    dados: { nome: string; cargo: string; nivelAcessoId: number },
  ) =>
    request<Usuario>("/api/admin/usuarios", {
      method: "POST",
      token,
      body: JSON.stringify(dados),
    }),

  cadastrarRosto: (usuarioId: number, imagem: Blob) => {
    const form = new FormData();
    form.set("usuarioId", String(usuarioId));
    form.set("imagem", imagem, "captura.jpg");
    return request<{ embeddingId: number; algoritmo: string; mensagem: string }>(
      "/api/enrollment",
      { method: "POST", body: form },
    );
  },

  reconhecerRosto: (imagem: Blob) => {
    const form = new FormData();
    form.set("imagem", imagem, "captura.jpg");
    return request<ScanResult>("/api/recognition/scan", { method: "POST", body: form });
  },

  listarLogs: (token: string) => request<AccessLog[]>("/api/admin/logs", { token }),

  resumoDeAcessos: (token: string) =>
    request<AccessSummary>("/api/admin/reports/access-summary", { token }),

  // Corpo binário (PDF), não passa pelo `request` genérico (que sempre
  // parseia JSON).
  exportarRelatorioPdf: async (token: string): Promise<Blob> => {
    const path = "/api/admin/reports/access-log.pdf";
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Erro ${response.status} em ${path}: ${text || response.statusText}`);
    }

    return response.blob();
  },
};
