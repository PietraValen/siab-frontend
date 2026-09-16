/**
 * Guarda o token JWT do painel administrativo em localStorage.
 *
 * Limitação conhecida (ver CLAUDE.md): o ideal seria um cookie httpOnly,
 * inacessível a JavaScript no cliente. localStorage foi usado pelo prazo do
 * projeto e fica exposto a XSS — aceitável para o escopo acadêmico do SIAB,
 * mas não deve ser reaproveitado assim em um sistema de produção real.
 */
const TOKEN_STORAGE_KEY = "siab.admin.token";

export function salvarToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function removerToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Checagem de validade só para UX (evitar mostrar o painel com um token
 * visivelmente expirado antes de qualquer chamada à API). Não substitui a
 * validação real, que é sempre feita pelo back-end a cada requisição.
 */
export function tokenValido(token: string | null): boolean {
  if (!token) return false;

  const payloadBase64 = token.split(".")[1];
  if (!payloadBase64) return false;

  try {
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
