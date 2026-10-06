# SIAB — Front-end (Next.js)

Interface web do Sistema de Identificação e Autenticação Biométrica.
Consome a API do repositório `siab-backend`.

**Cenário da APS:** no Ministério do Meio Ambiente há um cofre de segurança
máxima com relatórios ultrassecretos sobre toxinas de altíssimo risco. O
SIAB é a última linha de defesa desse cofre: identifica e autentica o rosto
de quem chega a uma porta e libera ou bloqueia a entrada conforme três
níveis de permissão (Geral, Diretoria e Ministro; no nível Ministro, rosto
e PIN).

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
| `/` | Landing page |
| `/scan` | Quiosque de reconhecimento facial de uma porta do cofre (precisa ser pareado com um terminal — ver abaixo) |
| `/login` | Login do painel (com segunda etapa de código MFA quando ativo) |
| `/cadastro` | Criação do primeiro administrador (bootstrap) |
| `/admin` | Painel — lista de usuários + KPIs |
| `/admin/enroll` | Cadastro biométrico (usuário + rosto + PIN opcional) |
| `/admin/logs` | Histórico de tentativas de acesso |
| `/admin/reports` | Relatórios, PDF e verificação de integridade da auditoria |
| `/admin/terminais` | Terminais (portas) e suas chaves de pareamento |
| `/admin/seguranca` | MFA (TOTP) da conta do admin |

## Sessão do painel e quiosque `/scan`

- **Painel admin:** o login grava a sessão num cookie HttpOnly
  (`SIAB_TOKEN`) definido pelo back-end — o front não guarda token
  nenhum. Toda requisição que altera dados manda o header `X-XSRF-TOKEN`
  (obtido em `GET /api/auth/csrf`; feito automaticamente em `lib/api.ts`).
- **Quiosque:** cada porta é um terminal cadastrado em
  `/admin/terminais`, que define o nível exigido e gera uma chave HMAC
  mostrada uma única vez. Abra `/scan` no computador da porta e cole o ID
  e a chave na tela de pareamento. A cada tentativa o quiosque pede uma
  piscada (sequência de ~8 frames), o PIN se a porta for de nível
  Ministro, e envia tudo assinado (ver `lib/terminal.ts`).

## Trabalhando com o Claude Code

Este repositório tem um harness pronto, no mesmo espírito do
`siab-backend`:

- **`CLAUDE.md`** — mapa do projeto e pendências em ordem de prioridade
- **`.vscode/`** — debug do Next.js já configurado (F5 sobe o dev server e abre o Chrome)
- **`.devcontainer/`** — ambiente Node 24 padronizado
- **`tests/ui/`** — testes dos componentes puros, já passam, servem de referência de estilo

Fluxo sugerido: abra a pasta no VS Code, rode `npm install` e `npm test`
pra ver a baseline passando, e peça ao Claude Code pra seguir a lista de
pendências do `CLAUDE.md` — pedindo pra rodar `npm test` e `npm run lint`
depois de cada mudança.
