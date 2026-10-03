import { api, limparTokenCsrf } from "./api";
import type { Sessao } from "./types";

/**
 * Sessão do painel administrativo.
 *
 * O token JWT vive só no cookie HttpOnly SIAB_TOKEN gravado pelo back-end
 * no login (Path=/api, SameSite=Strict) — o JavaScript da página não
 * consegue lê-lo, então um XSS não tem como roubá-lo (era a limitação do
 * antigo token em localStorage). Por isso o front também não tem como
 * "olhar" o token para saber se está logado: pergunta ao back-end via
 * GET /api/admin/sessao.
 */
export async function obterSessao(): Promise<Sessao | null> {
  try {
    return await api.sessao();
  } catch {
    // 401/403 (sem sessão ou expirada) ou back-end fora do ar: em ambos os
    // casos o painel não pode ser mostrado.
    return null;
  }
}

/** Revoga o token no back-end (que também apaga o cookie). */
export async function sair(): Promise<void> {
  try {
    await api.logout();
  } catch {
    // Mesmo se o back-end falhar, quem chama redireciona para /login; o
    // token expira sozinho.
  } finally {
    limparTokenCsrf();
  }
}
