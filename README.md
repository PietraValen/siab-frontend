# SIAB — Front-end (Next.js)

Interface web do Sistema de Identificação e Autenticação Biométrica.
Consome a API do repositório `siab-backend`.

**Design:** [arquivo no Figma](https://www.figma.com/design/LZfsLXALKggxkc15lF0Jqj) — os componentes em `components/ui/` e os tokens em `app/globals.css` espelham 1:1 o que está lá.

## Stack

- Next.js 16.3 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Vitest + React Testing Library

## Rodando localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre em `http://localhost:3000`. Precisa do back-end (`siab-backend`)
rodando em paralelo — ver `NEXT_PUBLIC_API_URL` no `.env.local`.

## Rodando via Podman

```bash
podman build -t siab-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 .
podman run -d --name siab-frontend -p 3000:3000 siab-frontend
```

## Testes

```bash
npm test
```

## Estrutura de páginas

| Rota | Descrição |
|---|---|
| `/scan` | Tela principal — reconhecimento facial em tempo real (home redireciona pra cá) |
| `/enroll` | Cadastro biométrico |
| `/admin` | Painel — lista de usuários + KPIs |
| `/admin/logs` | Histórico de tentativas de acesso |
| `/admin/reports` | Relatórios |

## Trabalhando com o Claude Code

Este repositório tem um harness pronto, no mesmo espírito do
`siab-backend`:

- **`CLAUDE.md`** — mapa do projeto e pendências em ordem de prioridade (a mais importante: autenticação do painel admin, que hoje não existe)
- **`.vscode/`** — debug do Next.js já configurado (F5 sobe o dev server e abre o Chrome)
- **`.devcontainer/`** — ambiente Node 24 padronizado
- **`tests/ui/`** — testes dos componentes puros, já passam, servem de referência de estilo

Fluxo sugerido: abra a pasta no VS Code, rode `npm install` e `npm test`
pra ver a baseline passando, e peça ao Claude Code pra seguir a lista de
pendências do `CLAUDE.md` — pedindo pra rodar `npm test` e `npm run lint`
depois de cada mudança.
