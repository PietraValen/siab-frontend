import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const NIVEIS_ACESSO = [
  {
    tag: "Nível 1",
    cor: "text-accent-default bg-accent-default/15",
    nome: "Geral",
    descricao: "Acesso à antecâmara e aos corredores técnicos perimetrais do cofre.",
  },
  {
    tag: "Nível 2",
    cor: "text-status-warning bg-status-warning/15",
    nome: "Diretoria",
    descricao: "Acesso aos compartimentos de amostras e aos relatórios restritos da Diretoria.",
  },
  {
    tag: "Nível 3",
    cor: "text-status-danger bg-status-danger/15",
    nome: "Ministro",
    destaque: true,
    descricao:
      "Acesso ao núcleo do cofre, onde ficam os relatórios ultrassecretos sobre toxinas. Exige rosto e PIN.",
  },
] as const;

const ETAPAS_PIPELINE = [
  {
    numero: "01",
    icone: "videocam",
    titulo: "Captura",
    descricao: "Aquisição de uma imagem do rosto pela webcam, na tela de reconhecimento.",
    tag: "getUserMedia",
  },
  {
    numero: "02",
    icone: "tune",
    titulo: "Pré-processamento",
    descricao: "Conversão para escala de cinza e equalização de histograma, reduzindo o efeito da iluminação.",
    tag: "Equalização",
  },
  {
    numero: "03",
    icone: "center_focus_strong",
    titulo: "Detecção facial",
    descricao: "Localização do rosto no quadro e prova de vida (textura da pele e piscada) contra fotos e telas.",
    tag: "Haar Cascade",
  },
  {
    numero: "04",
    icone: "hub",
    titulo: "Extração de características",
    descricao: "Histogramas de padrões binários locais (LBP) por região do rosto, formando o vetor usado na comparação.",
    tag: "LBPH",
  },
  {
    numero: "05",
    icone: "verified_user",
    titulo: "Reconhecimento e decisão",
    descricao: "Identifica quem é (busca 1:N na base), autentica pelo limiar de distância e libera ou bloqueia conforme o nível da porta.",
    tag: "Identificação + autenticação",
  },
] as const;

const MATRIZ_ZONAS = [
  {
    zona: "Antecâmara Externa (Zona Alpha)",
    perfil: "Operadores de TI, vigilância e suporte",
    nivel: "Geral",
    fatores: "Rosto + prova de vida",
    critico: false,
  },
  {
    zona: "Arquivo Restrito da Diretoria (Zona Beta)",
    perfil: "Diretores de divisões específicas",
    nivel: "Diretoria",
    fatores: "Rosto + prova de vida",
    critico: false,
  },
  {
    zona: "Núcleo do Cofre Central (Zona Ômega)",
    perfil: "Ministro do Meio Ambiente",
    nivel: "Ministro",
    fatores: "Rosto + prova de vida + PIN",
    critico: true,
  },
] as const;

const ctaPrimaria =
  "inline-flex items-center justify-center rounded-md bg-accent-default px-xl py-md text-base font-semibold text-bg-primary transition-opacity hover:opacity-90";
const ctaSecundaria =
  "inline-flex items-center justify-center rounded-md border border-border-default bg-bg-elevated px-xl py-md text-base font-semibold text-text-primary transition-colors hover:bg-bg-chip";

/**
 * Landing page do SIAB. Apresenta o sistema para quem chega pela primeira
 * vez e direciona para os dois fluxos administrativos (login e cadastro do
 * primeiro admin). A tela de reconhecimento (/scan) continua existindo
 * normalmente — só deixou de ser a rota raiz.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg-primary">
      <header className="sticky top-0 z-20 border-b border-border-default bg-bg-panel/95 backdrop-blur">
        <div className="flex h-20 items-center justify-between gap-lg px-lg md:px-2xl">
          <div className="flex min-w-0 items-center gap-md">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-default text-base font-bold text-bg-primary">
              S
            </span>
            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-sm">
                <span className="font-mono text-base tracking-wider text-accent-default">SIAB</span>
                <span className="rounded-sm bg-bg-chip-strong px-xs py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-muted">
                  SEC-VAULT
                </span>
              </div>
              <p className="truncate text-sm text-text-secondary">
                Simulação de controle de acesso biométrico · APS — PIVC — UNIP
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-sm rounded-lg bg-bg-primary p-xs lg:flex">
            <Link href="/login" className="rounded-md px-md py-xs text-sm text-text-secondary transition-colors hover:bg-bg-chip-strong hover:text-text-primary">
              Acesso Administrativo
            </Link>
            <Link href="/cadastro" className="rounded-md px-md py-xs text-sm text-text-secondary transition-colors hover:bg-bg-chip-strong hover:text-text-primary">
              Novo Administrador
            </Link>
          </nav>
          <div className="flex items-center gap-md">
            <div className="hidden items-center gap-sm rounded-sm bg-bg-primary px-md py-xs xl:flex">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-status-success" />
              <span className="font-mono text-xs text-text-primary">Sistema Operacional</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-lg py-2xl md:px-2xl">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-xl lg:grid-cols-12">
          <div className="flex flex-col gap-lg lg:col-span-7">
            <div className="flex flex-wrap items-center gap-sm">
              <span className="rounded-sm bg-bg-chip-strong px-xs py-0.5 font-mono text-xs uppercase tracking-wide text-text-muted">
                Projeto Acadêmico · APS — PIVC — UNIP
              </span>
              <span className="rounded-sm border border-status-success/30 bg-status-success/10 px-xs py-0.5 font-mono text-xs text-status-success">
                Ministério do Meio Ambiente
              </span>
            </div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-text-primary md:text-[40px]">
              Controle de Acesso Biométrico Facial para Ambientes de Segurança Máxima
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
              Simulação da última linha de defesa do cofre de segurança máxima do Ministério do
              Meio Ambiente, onde estão os relatórios ultrassecretos sobre toxinas de altíssimo
              risco. O terminal identifica e autentica o rosto de quem está diante dele, decide se
              libera ou bloqueia a entrada conforme três níveis de permissão e registra cada
              tentativa na auditoria.
            </p>
            <div className="flex flex-wrap items-center gap-md pt-sm">
              <Link href="/login" className={ctaPrimaria}>
                Entrar no Sistema Administrativo
              </Link>
              <Link href="/cadastro" className={ctaSecundaria}>
                Criar Conta Administrativa
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-md border-t border-border-default pt-lg sm:grid-cols-3">
              <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-md">
                <span className="font-mono text-xs text-text-secondary">Níveis de Permissão</span>
                <span className="font-mono text-xl font-semibold text-accent-default">3</span>
                <span className="text-xs text-outline">Geral · Diretoria · Ministro</span>
              </div>
              <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-md">
                <span className="font-mono text-xs text-text-secondary">Etapas do Pipeline</span>
                <span className="font-mono text-xl font-semibold text-status-success">5</span>
                <span className="text-xs text-outline">Captura até decisão</span>
              </div>
              <div className="flex flex-col gap-xs rounded-lg bg-bg-panel p-md">
                <span className="font-mono text-xs text-text-secondary">Auditoria</span>
                <span className="font-mono text-xl font-semibold text-text-primary">100%</span>
                <span className="text-xs text-outline">Toda tentativa é registrada</span>
              </div>
            </div>
          </div>

          {/* Console do terminal (preview) */}
          <div className="flex flex-col gap-md lg:col-span-5">
            <div className="flex flex-col overflow-hidden rounded-lg bg-bg-panel">
              <div className="flex items-center justify-between border-b border-border-default bg-bg-primary px-md py-sm">
                <div className="flex items-center gap-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-danger" />
                  <span className="font-mono text-xs font-medium text-text-primary">Terminal Vault SEC-01</span>
                </div>
                <span className="rounded-sm border border-status-danger/30 bg-status-danger/10 px-xs py-0.5 font-mono text-xs text-status-danger">
                  Bloqueio Ativo
                </span>
              </div>
              <div className="flex flex-col gap-md p-md">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-bg-elevated">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: "radial-gradient(#4fdbd0 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-sm text-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-accent-default/60">
                      <Icon name="face" className="text-[48px] text-accent-default opacity-70" />
                    </div>
                    <span className="font-mono text-xs text-accent-default">Aguardando aproximação facial</span>
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <span className="text-sm font-semibold text-text-primary">Níveis de Permissão Credenciada</span>
                  <p className="text-xs text-text-secondary">Zoneamento hierárquico do cofre.</p>
                </div>
                <div className="flex flex-col gap-sm">
                  {NIVEIS_ACESSO.map((nivel) => (
                    <div
                      key={nivel.nome}
                      className={`flex items-start gap-sm rounded-lg bg-bg-elevated p-sm ${
                        "destaque" in nivel && nivel.destaque ? "border border-status-danger/40" : ""
                      }`}
                    >
                      <span className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-xs font-semibold ${nivel.cor}`}>
                        {nivel.tag}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold text-text-primary">{nivel.nome}</span>
                        <span className="text-xs text-text-secondary">{nivel.descricao}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline de reconhecimento */}
      <section className="border-t border-border-default bg-bg-panel/40 px-lg py-2xl md:px-2xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-lg">
          <div className="flex flex-col gap-xs border-b border-border-default pb-md">
            <span className="font-mono text-xs uppercase tracking-wider text-accent-default">
              Pipeline de Reconhecimento
            </span>
            <h2 className="text-2xl font-bold text-text-primary">
              Como Funciona o Reconhecimento Facial
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">
            {ETAPAS_PIPELINE.map((etapa) => (
              <div
                key={etapa.numero}
                className="flex flex-col justify-between gap-md rounded-lg bg-bg-panel p-md transition-colors hover:bg-bg-chip"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border-default pb-sm">
                    <span className="font-mono text-2xl font-semibold text-accent-default">{etapa.numero}</span>
                    <Icon name={etapa.icone} className="text-[20px] text-accent-default" />
                  </div>
                  <div className="mt-md flex flex-col gap-xs">
                    <span className="text-sm font-semibold text-text-primary">{etapa.titulo}</span>
                    <p className="text-xs leading-relaxed text-text-secondary">{etapa.descricao}</p>
                  </div>
                </div>
                <div className="border-t border-border-default pt-xs font-mono text-[10px] uppercase tracking-wide text-outline">
                  {etapa.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Matriz de zonas de acesso */}
      <section className="px-lg py-2xl md:px-2xl">
        <div className="mx-auto max-w-6xl rounded-lg bg-bg-panel p-lg">
          <div className="mb-md flex flex-wrap items-center justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <Icon name="security" className="text-[22px] text-accent-default" />
              <span className="text-base font-semibold text-text-primary">
                Matriz de Decisão do Mecanismo Físico de Destravamento
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border-default text-outline">
                  <th className="p-sm">Zona de Acesso</th>
                  <th className="p-sm">Perfil Autorizado</th>
                  <th className="p-sm">Nível Exigido</th>
                  <th className="p-sm">Fatores Exigidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {MATRIZ_ZONAS.map((linha) => (
                  <tr key={linha.zona} className={linha.critico ? "bg-status-danger/5" : undefined}>
                    <td className="p-sm font-medium text-text-primary">{linha.zona}</td>
                    <td className="p-sm text-text-secondary">{linha.perfil}</td>
                    <td className="p-sm text-accent-default">{linha.nivel}</td>
                    <td className="p-sm text-text-primary">{linha.fatores}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="flex flex-col items-center gap-md border-t border-border-default px-lg py-2xl text-center md:px-2xl">
        <h2 className="text-xl font-bold text-text-primary">Pronto para começar?</h2>
        <div className="flex flex-wrap items-center justify-center gap-md">
          <Link href="/login" className={ctaPrimaria}>
            Entrar
          </Link>
          <Link href="/cadastro" className={ctaSecundaria}>
            Criar Conta Administrativa
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-default bg-bg-panel px-lg py-xl md:px-2xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-md">
          <div className="flex flex-col items-start justify-between gap-md md:flex-row md:items-center">
            <div className="flex flex-col gap-xs">
              <span className="text-base font-semibold tracking-tight text-text-primary">
                SIAB — Sistema de Identificação e Autenticação Biométrica
              </span>
              <span className="text-sm text-text-secondary">
                Lei Geral de Proteção de Dados (LGPD, art. 11 — dados biométricos sensíveis) ·
                APS — PIVC — UNIP
              </span>
            </div>
            <div className="rounded-sm bg-bg-chip px-sm py-xs font-mono text-xs text-accent-default">
              v1.0-ACADEMICO
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-sm border-t border-border-default pt-md text-xs text-text-secondary sm:flex-row">
            <span>SIAB © {new Date().getFullYear()} — Projeto acadêmico, uso educacional.</span>
            <span>Fase 1 (Aquisição) roda no navegador · demais fases no back-end Java</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
