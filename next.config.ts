import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Origem da API Java (só esquema + host + porta), liberada no connect-src. */
function origemDaApi(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:8080";
  }
}

/**
 * Content-Security-Policy sem nonce (ver "Without Nonces" no guia
 * content-security-policy da documentação do Next 16): as páginas são
 * estáticas/client-side, então 'unsafe-inline' em script-src é o preço de
 * não precisar de proxy/middleware gerando nonce por requisição. Mesmo
 * assim, a política bloqueia scripts de qualquer outra origem, iframes da
 * página em outros sites, <object>/<embed> e envio de formulários ou
 * fetch para hosts que não sejam o próprio front e a API.
 *
 * - 'unsafe-eval' só em desenvolvimento: o React usa eval para reconstruir
 *   stacks de erro no dev; em produção não é necessário.
 * - fonts.googleapis.com / fonts.gstatic.com: folha de estilo + arquivos da
 *   fonte de ícones Material Symbols (<link> em app/layout.tsx). Inter e
 *   JetBrains Mono vêm de next/font, que as hospeda no próprio front.
 * - blob: em img/media: preview da câmera (getUserMedia) e frames capturados.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  `connect-src 'self' ${origemDaApi()}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // A API Java roda em outro host/porta (ver NEXT_PUBLIC_API_URL) — sem
  // necessidade de rewrites aqui, o cliente chama a URL absoluta direto
  // (lib/api.ts). Se decidirem esconder a URL do backend atrás de um proxy
  // do próprio Next.js mais pra frente, é aqui que entra um bloco `rewrites`.
  output: "standalone", // gera build otimizado para rodar em container (Podman)

  // Cabeçalhos de segurança em todas as rotas. A câmera fica liberada só
  // para a própria origem (tela /scan e cadastro biométrico); microfone e
  // geolocalização, que o SIAB não usa, ficam bloqueados.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
