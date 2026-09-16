# CLAUDE.md — Contexto do projeto SIAB (front-end)

Lido automaticamente pelo Claude Code ao abrir este diretório.

## O que é este projeto

Front-end do **SIAB — Sistema de Identificação e Autenticação Biométrica**
(APS — PIVC — UNIP). Consome a API Java (repositório irmão `siab-backend`,
que também tem seu próprio `CLAUDE.md`) e é responsável por:

- Capturar o rosto pela webcam (Fase 1 — Aquisição do pipeline, do lado do
  navegador)
- Telas de cadastro, reconhecimento e painel administrativo

**O visual já está definido e aprovado no Figma** (arquivo "SIAB — Sistema
de Identificação e Autenticação Biométrica", link no README). Os
componentes em `components/ui/` e os tokens em `app/globals.css` já
espelham exatamente as variáveis e componentes de lá — **não redesenhe do
zero**; se faltar algo, replique o padrão visual existente (tema escuro,
acento teal, os mesmos raios/espaçamentos) em vez de inventar um novo.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (config "CSS-first" em `app/globals.css`, sem
  `tailwind.config.js`)
- Vitest + React Testing Library para testes de componente

## Mapa de arquivos

| Caminho | O que é |
|---|---|
| `app/globals.css` | Tokens de design (`@theme`) — espelha as variáveis do Figma |
| `app/scan/page.tsx` | Tela principal, roda o dia inteiro (reconhecimento) |
| `app/enroll/page.tsx` | Cadastro biométrico |
| `app/admin/` | Painel administrativo (layout com sidebar + 3 subpáginas) |
| `components/ui/` | Button, Input, Badge, StatusPill, Card, NavItem — espelham os componentes do Figma 1:1 |
| `components/CameraCapture.tsx` | Wrapper de `getUserMedia` + captura de frame |
| `lib/api.ts` | Toda chamada HTTP ao back-end passa por aqui |
| `lib/types.ts` | Tipos espelhando os DTOs Java — mantidos manualmente em sincronia |

## Estado atual — pendências mais importantes (nesta ordem)

1. **Autenticação do painel admin.** Hoje não existe tela de login nem
   guard nas rotas `/admin/**` — `TOKEN_TEMPORARIO = ""` está hardcoded
   nas páginas admin (procure por esse texto). Implementar:
   - Uma tela `/admin/login` que chama `api.login()`
   - Guardar o token (cookie httpOnly seria o ideal; se não der tempo,
     localStorage é aceitável para o escopo do projeto — mas documentar a
     limitação)
   - Um guard em `app/admin/layout.tsx` redirecionando pra login se não
     houver token válido
2. **Fluxo real de cadastro** (`app/enroll/page.tsx`): hoje assume
   `usuarioId = 1` fixo. Decidir com o grupo se o cadastro completo
   (criar usuário + capturar rosto) é uma ação só de admin logado, e
   ajustar a tela de acordo (provavelmente precisa virar uma rota dentro
   de `/admin`, protegida, em vez de pública).
3. **Captura automática em `/scan`**: hoje a captura é manual (clique no
   botão). Para uso real, trocar para captura automática em intervalo
   (ver TODO detalhado dentro de `app/scan/page.tsx`).
4. **Exportação de PDF em `/admin/reports`**: bloqueado até o back-end
   implementar isso de verdade (ver `CLAUDE.md` do back-end).

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
