import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A API Java roda em outro host/porta (ver NEXT_PUBLIC_API_URL) — sem
  // necessidade de rewrites aqui, o cliente chama a URL absoluta direto
  // (lib/api.ts). Se decidirem esconder a URL do backend atrás de um proxy
  // do próprio Next.js mais pra frente, é aqui que entra um bloco `rewrites`.
  output: "standalone", // gera build otimizado para rodar em container (Podman)
};

export default nextConfig;
