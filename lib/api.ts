import type {
  AccessLog,
  AccessSummary,
  Administrador,
  ConfiguracaoMfa,
  Desafio,
  ScanResult,
  Sessao,
  Terminal,
  TerminalCriado,
  Usuario,
  VerificacaoAuditoria,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Erro de uma chamada à API. `message` já vem pronto para mostrar na tela:
 * é o campo `mensagem` do corpo de erro do back-end quando ele existe
 * (ex.: "Usuário ou senha inválidos."), e só cai no texto técnico
 * "Erro 401 em ..." quando o corpo não traz nada legível.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Corpo JSON do erro (ex.: { mensagem, mfaNecessario }), se houver. */
    readonly corpo: Record<string, unknown> | null,
    /** Segundos do header Retry-After (respostas 429), se houver. */
    readonly retryAfter: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function erroDaResposta(path: string, response: Response): Promise<ApiError> {
  const texto = await response.text().catch(() => "");
  let corpo: Record<string, unknown> | null = null;
  try {
    const json = JSON.parse(texto);
    if (json && typeof json === "object") corpo = json;
  } catch {
    // corpo não é JSON — fica só o texto cru na mensagem técnica
  }

  const retry = Number(response.headers.get("Retry-After"));
  const mensagem =
    typeof corpo?.mensagem === "string" && corpo.mensagem
      ? corpo.mensagem
      : `Erro ${response.status} em ${path}: ${texto || response.statusText}`;

  return new ApiError(response.status, mensagem, corpo, Number.isFinite(retry) && retry > 0 ? retry : null);
}

/**
 * Token anti-CSRF do back-end (GET /api/auth/csrf), guardado só em memória.
 * O cookie de sessão SIAB_TOKEN é HttpOnly e o navegador o anexa sozinho,
 * então toda requisição que altera dados precisa provar que saiu desta
 * página mandando também o header X-XSRF-TOKEN.
 */
let tokenCsrf: { headerName: string; token: string } | null = null;

async function obterTokenCsrf(renovar = false) {
  if (!tokenCsrf || renovar) {
    // credentials: "include" porque o token fica amarrado ao cookie
    // XSRF-TOKEN que esta mesma resposta grava.
    const response = await fetch(`${API_URL}/api/auth/csrf`, { credentials: "include" });
    if (!response.ok) throw await erroDaResposta("/api/auth/csrf", response);
    tokenCsrf = (await response.json()) as { headerName: string; token: string };
  }
  return tokenCsrf;
}

/** Esquece o token CSRF em memória (ex.: depois do logout). */
export function limparTokenCsrf() {
  tokenCsrf = null;
}

const METODOS_SEGUROS = new Set(["GET", "HEAD"]);

type RequestOptions = RequestInit & {
  /**
   * "cookie" (padrão): chamada do painel, autenticada pelo cookie HttpOnly
   * do admin — vai com credentials: "include" e, se alterar dados, com o
   * header anti-CSRF. "nenhuma": chamada do quiosque /scan, que se
   * autentica pela assinatura HMAC do terminal e não deve levar o cookie
   * do admin junto (credentials: "omit").
   */
  autenticacao?: "cookie" | "nenhuma";
};

/**
 * Wrapper fino sobre fetch. Centraliza a URL base, o envio do cookie de
 * sessão + token CSRF e o tratamento de erro, pra não repetir isso em
 * cada componente.
 */
async function enviar(path: string, options: RequestOptions = {}): Promise<Response> {
  const { autenticacao = "cookie", headers, ...rest } = options;
  const metodo = (rest.method ?? "GET").toUpperCase();
  const precisaCsrf = autenticacao === "cookie" && !METODOS_SEGUROS.has(metodo);

  async function tentar(renovarCsrf: boolean) {
    const csrf = precisaCsrf ? await obterTokenCsrf(renovarCsrf) : null;
    return fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: autenticacao === "cookie" ? "include" : "omit",
      headers: {
        ...(rest.body === undefined || rest.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(csrf ? { [csrf.headerName]: csrf.token } : {}),
        ...headers,
      },
    });
  }

  let response = await tentar(false);
  // 403 numa requisição com CSRF: o token em memória pode ter ficado velho
  // (ex.: o back-end reiniciou ou o cookie XSRF-TOKEN expirou). Renova uma
  // vez e tenta de novo antes de desistir.
  if (response.status === 403 && precisaCsrf) {
    response = await tentar(true);
  }

  if (!response.ok) throw await erroDaResposta(path, response);
  return response;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await enviar(path, options);
  // 204 No Content não tem corpo para parsear
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type DadosUsuario = {
  nome: string;
  cargo: string;
  nivelAcessoId: number;
  /** 4 a 8 dígitos; exigido nas portas de nível Ministro (segundo fator). */
  pin?: string;
};

export type DadosScan = {
  terminalId: string;
  nonce: string;
  timestamp: string;
  assinatura: string;
  frames: Blob[];
  pin?: string;
};

export const api = {
  /**
   * O back-end devolve o token no corpo também (para Swagger/Postman), mas
   * o painel ignora: a sessão do navegador vive só no cookie HttpOnly
   * SIAB_TOKEN, inacessível a JavaScript.
   */
  login: async (username: string, password: string, codigoMfa?: string): Promise<void> => {
    await enviar("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, ...(codigoMfa ? { codigoMfa } : {}) }),
    });
  },

  logout: () => request<void>("/api/auth/logout", { method: "POST" }),

  sessao: () => request<Sessao>("/api/admin/sessao"),

  existeAdministrador: () =>
    request<{ existe: boolean }>("/api/auth/existe-administrador"),

  // Só é aceita sem sessão enquanto não existir nenhum administrador
  // cadastrado (bootstrap do primeiro admin) — ver
  // AdministradorController no back-end.
  criarAdministrador: (dados: { username: string; senha: string }) =>
    request<Administrador>("/api/admin/administradores", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  configurarMfa: () => request<ConfiguracaoMfa>("/api/admin/mfa/configurar", { method: "POST" }),

  ativarMfa: (codigo: string) =>
    request<Sessao>("/api/admin/mfa/ativar", { method: "POST", body: JSON.stringify({ codigo }) }),

  desativarMfa: (codigo: string) =>
    request<Sessao>("/api/admin/mfa", { method: "DELETE", body: JSON.stringify({ codigo }) }),

  listarUsuarios: () => request<Usuario[]>("/api/admin/usuarios"),

  criarUsuario: (dados: DadosUsuario) =>
    request<Usuario>("/api/admin/usuarios", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  // Exige a sessão do admin logado: sem isso, qualquer pessoa poderia
  // associar o próprio rosto a um usuário existente e passar pelo /scan
  // com o nível de acesso dele.
  cadastrarRosto: (usuarioId: number, imagem: Blob) => {
    const form = new FormData();
    form.set("usuarioId", String(usuarioId));
    form.set("imagem", imagem, "captura.jpg");
    return request<{ embeddingId: number; algoritmo: string; mensagem: string }>(
      "/api/enrollment",
      { method: "POST", body: form },
    );
  },

  listarTerminais: () => request<Terminal[]>("/api/admin/terminais"),

  criarTerminal: (dados: { nome: string; nivelExigidoId: number }) =>
    request<TerminalCriado>("/api/admin/terminais", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  revogarTerminal: (id: number) =>
    request<void>(`/api/admin/terminais/${id}`, { method: "DELETE" }),

  /** Desafio de uso único (60 s) para o próximo scan deste terminal. */
  obterDesafio: (terminalId: string) =>
    request<Desafio>("/api/recognition/desafio", {
      autenticacao: "nenhuma",
      headers: { "X-Terminal-Id": terminalId },
    }),

  /**
   * Envia a sequência de frames assinada pelo terminal (ver
   * lib/terminal.ts -> assinarScan). A ordem dos frames no multipart tem
   * que ser a mesma da lista de hashes da assinatura.
   */
  reconhecerRosto: ({ terminalId, nonce, timestamp, assinatura, frames, pin }: DadosScan) => {
    const form = new FormData();
    frames.forEach((frame, i) => form.append("imagens", frame, `f${i}.jpg`));
    if (pin) form.set("pin", pin);
    return request<ScanResult>("/api/recognition/scan", {
      method: "POST",
      body: form,
      autenticacao: "nenhuma",
      headers: {
        "X-Terminal-Id": terminalId,
        "X-Desafio": nonce,
        "X-Timestamp": timestamp,
        "X-Assinatura": assinatura,
      },
    });
  },

  listarLogs: () => request<AccessLog[]>("/api/admin/logs"),

  resumoDeAcessos: () => request<AccessSummary>("/api/admin/reports/access-summary"),

  verificarAuditoria: () => request<VerificacaoAuditoria>("/api/admin/auditoria/verificacao"),

  /** Sela (assina) o fim das cadeias e devolve a verificação atualizada. */
  selarAuditoria: () =>
    request<VerificacaoAuditoria>("/api/admin/auditoria/selar", { method: "POST" }),

  // Corpo binário (PDF): usa o `enviar` (cookie + erro padronizado) mas não
  // o `request`, que sempre parseia JSON.
  exportarRelatorioPdf: async (): Promise<Blob> => {
    const response = await enviar("/api/admin/reports/access-log.pdf");
    return response.blob();
  },
};
