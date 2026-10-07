# CLAUDE.md — Contexto do projeto SIAB (front-end)

Lido automaticamente pelo Claude Code ao abrir este diretório.

## O que é este projeto

Front-end do **SIAB — Sistema de Identificação e Autenticação Biométrica**
(APS — PIVC — UNIP). Consome a API Java (repositório irmão `siab-backend`,
que também tem seu próprio `CLAUDE.md`) e é responsável por:

- Capturar o rosto pela webcam (Fase 1 — Aquisição do pipeline, do lado do
  navegador)
- Telas de cadastro, reconhecimento e painel administrativo

**O visual já está definido e aprovado** — a base é o Figma ("SIAB —
Sistema de Identificação e Autenticação Biométrica", link no README),
refinada para um design system "tático" gerado no Stitch (tema escuro de
alto contraste, acento teal `#14b8ae`, tipografia Inter + JetBrains Mono
para dados/telemetria, badges retangulares em vez de pills). Os
componentes em `components/ui/` e os tokens em `app/globals.css` já
espelham exatamente essas variáveis — **não redesenhe do zero**; se faltar
algo, replique o padrão visual existente em vez de inventar um novo.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (config "CSS-first" em `app/globals.css`, sem
  `tailwind.config.js`)
- Vitest + React Testing Library para testes de componente

## Mapa de arquivos

| Caminho | O que é |
|---|---|
| `app/globals.css` | Tokens de design (`@theme`) — espelha as variáveis do Figma/Stitch |
| `app/scan/page.tsx` | Tela principal, roda o dia inteiro (reconhecimento) |
| `app/admin/enroll/page.tsx` | Cadastro biométrico — ação de admin logado (cria usuário + captura o rosto) |
| `app/admin/` | Painel administrativo (layout com sidebar + subpáginas: usuários, cadastro, logs, relatórios, terminais, segurança da conta) |
| `components/ui/` | Button, Input, Badge, StatusPill, Card, NavItem, Icon — espelham os componentes do design system 1:1 |
| `components/CameraCapture.tsx` | Wrapper de `getUserMedia` + captura de frame (`capturarBlob()` para sequências) |
| `components/CopyButton.tsx` | Botão "Copiar" (clipboard) — fora de `ui/` porque tem comportamento |
| `app/admin/terminais/page.tsx` | Cadastro/revogação dos terminais (portas) — mostra o id + chave HMAC uma única vez para parear o `/scan` |
| `app/admin/seguranca/page.tsx` | MFA (TOTP) da conta do admin logado |
| `lib/api.ts` | Toda chamada HTTP ao back-end passa por aqui (cookie de sessão + header anti-CSRF automáticos; `ApiError` com a `mensagem` do back-end) |
| `lib/auth.ts` | Sessão do painel via `GET /api/admin/sessao` + logout (o token fica só no cookie HttpOnly) |
| `lib/terminal.ts` | Pareamento do quiosque `/scan` (chave HMAC não extraível em IndexedDB) e assinatura de cada scan (mensagem canônica `SIAB-SCAN-v1`) |
| `lib/types.ts` | Tipos espelhando os DTOs Java — mantidos manualmente em sincronia |

## Estado atual — pendências mais importantes (nesta ordem)

1. **Captura automática em `/scan`**: hoje a captura é manual (botão
   "Capturar e Verificar"). Para uso real, trocar para captura automática
   em intervalo, usando o `ref` do `CameraCapture` (ver TODO detalhado
   dentro de `app/scan/page.tsx`). Deixado manual de propósito por
   enquanto, para o grupo poder testar frame a frame.

Resolvidas: login + guard do painel admin (`app/login/page.tsx`,
`lib/auth.ts`, guard em `app/admin/layout.tsx`), o cadastro biométrico
como ação de admin logado (`app/admin/enroll/page.tsx`, que cria o
usuário via `api.criarUsuario` e só depois associa o rosto capturado) e o
token do admin em cookie HttpOnly (`SIAB_TOKEN`, gravado pelo back-end;
nada de sessão em `localStorage`, ver `lib/auth.ts`). A exportação de PDF
em `/admin/reports` também já funciona (o back-end gera o PDF de verdade).

## Harness de testes

```bash
npm test          # roda a suíte uma vez
npm run test:watch  # modo watch
npm run lint       # ESLint
```

Testes em `tests/ui/` cobrem os componentes puros (Button, Badge,
StatusPill) e já passam. Ao adicionar lógica nova (ex.: o guard de
autenticação), adicione testes no mesmo estilo — RTL (`render`, `screen`,
`fireEvent`), sem mockar excessivamente.

`tests/lib/terminal.test.ts` roda no ambiente `node` (não jsdom) porque
usa a WebCrypto do Node para conferir o HMAC contra `node:crypto`. A
persistência do pareamento em IndexedDB não tem teste automatizado (jsdom
não tem IndexedDB) — valide no navegador.

Não existe teste automatizado para `CameraCapture` (depende de
`getUserMedia`, que não existe em jsdom) — validação dessa parte é manual,
rodando `npm run dev` e testando no navegador de verdade.

## Rodando localmente

```bash
cp .env.example .env.local   # ajustar NEXT_PUBLIC_API_URL se necessário
npm install
npm run dev                   # http://localhost:3000
```

Precisa do back-end rodando em paralelo (ver `siab-backend/README.md`) —
sem ele, as chamadas em `lib/api.ts` vão falhar.

## Convenções

- Textos de interface em português (é o idioma do sistema para os
  usuários finais do "cofre").
- Nomes de variáveis/tipos ligados a domínio em português (`Usuario`,
  `NivelAcesso`), nomes técnicos genéricos em inglês — mesma convenção do
  back-end.
- Componentes de `components/ui/` devem continuar **sem lógica de
  negócio** (só apresentação) — a lógica de fetch/estado fica nas páginas
  (`app/**/page.tsx`) ou em hooks dedicados, se a complexidade justificar.
- Nunca construa classes do Tailwind por interpolação de string em
  runtime (ex.: `` `text-${variavel}` ``) — o compilador do Tailwind só
  reconhece classes que aparecem por extenso no código-fonte. Use um mapa
  de opções estáticas (ver `components/ui/StatusPill.tsx` como exemplo).
- Layout responsivo (320 px até telas largas): no painel admin a sidebar
  vira gaveta (botão de menu no cabeçalho) abaixo de `lg`, e tabelas
  largas ficam dentro de um `div.overflow-x-auto` com `min-w-[...]` na
  `<table>` — siga esse padrão em telas novas, com paddings menores no
  celular (`p-md sm:p-lg`).
- Ícones usam a fonte "Material Symbols Outlined" (carregada via `<link>`
  em `app/layout.tsx`) através do wrapper `components/ui/Icon.tsx` — não
  adicione outra biblioteca de ícones (lucide, heroicons etc.) sem
  necessidade.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
