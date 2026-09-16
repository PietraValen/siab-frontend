import Link from "next/link";

const ctaPrimaria =
  "inline-flex items-center justify-center rounded-md bg-accent-default px-lg py-md text-[15px] font-semibold text-text-primary transition-opacity hover:opacity-90";
const ctaSecundaria =
  "inline-flex items-center justify-center rounded-md border border-border-default bg-bg-elevated px-lg py-md text-[15px] font-semibold text-text-primary transition-colors hover:bg-bg-surface";

const ETAPAS_PIPELINE = [
  {
    numero: "01",
    titulo: "Captura",
    descricao: "Aquisição de uma imagem do rosto pela webcam, na tela de reconhecimento.",
  },
  {
    numero: "02",
    titulo: "Pré-processamento",
    descricao: "Normalização de iluminação e correção de enquadramento da imagem capturada.",
  },
  {
    numero: "03",
    titulo: "Detecção facial",
    descricao: "Localização do rosto no quadro e verificação de que é uma pessoa real (liveness).",
  },
  {
    numero: "04",
    titulo: "Extração de características",
    descricao: "Geração do embedding facial — a representação numérica usada na comparação.",
  },
  {
    numero: "05",
    titulo: "Reconhecimento e decisão",
    descricao: "Comparação com a base cadastrada e liberação de acesso conforme o nível de permissão.",
  },
] as const;

/**
 * Landing page do SIAB. Apresenta o sistema para quem chega pela primeira
 * vez e direciona para os dois fluxos administrativos (login e cadastro do
 * primeiro admin). A tela de reconhecimento (/scan) continua existindo
 * normalmente — só deixou de ser a rota raiz.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg-primary">
      <header className="flex items-center justify-between border-b border-border-default px-lg py-md md:px-2xl">
        <span className="text-lg font-bold text-accent-default">SIAB</span>
        <nav className="flex items-center gap-md text-sm font-medium text-text-secondary">
          <Link href="/login" className="hover:text-text-primary">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-text-primary">
            Criar conta administrativa
          </Link>
        </nav>
      </header>

      <section className="flex flex-col items-center gap-lg px-lg py-2xl text-center md:px-2xl">
        <h1 className="max-w-2xl text-[32px] font-bold leading-tight text-text-primary md:text-[40px]">
          Controle de acesso por reconhecimento facial, com auditoria completa
        </h1>
        <p className="max-w-xl text-base text-text-secondary">
          O SIAB identifica pessoas autorizadas pelo rosto e registra cada
          tentativa de acesso, concedida ou negada, com três níveis de
          permissão configuráveis pela administração.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-md">
          <Link href="/login" className={ctaPrimaria}>
            Entrar no Sistema Administrativo
          </Link>
          <Link href="/cadastro" className={ctaSecundaria}>
            Criar Conta Administrativa
          </Link>
        </div>
      </section>

      <section className="border-t border-border-default bg-bg-surface px-lg py-2xl md:px-2xl">
        <h2 className="text-center text-2xl font-bold text-text-primary">
          Como funciona o reconhecimento facial
        </h2>
        <div className="mx-auto mt-xl grid max-w-5xl grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">
          {ETAPAS_PIPELINE.map((etapa) => (
            <div
              key={etapa.numero}
              className="flex flex-col gap-2 rounded-lg border border-border-default bg-bg-primary p-lg"
            >
              <span className="text-xs font-semibold text-accent-default">{etapa.numero}</span>
              <h3 className="text-sm font-semibold text-text-primary">{etapa.titulo}</h3>
              <p className="text-xs text-text-secondary">{etapa.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-md border-t border-border-default px-lg py-2xl text-center md:px-2xl">
        <h2 className="text-xl font-bold text-text-primary">Pronto para começar?</h2>
        <div className="flex flex-wrap items-center justify-center gap-md">
          <Link href="/login" className={ctaPrimaria}>
            Entrar
          </Link>
          <Link href="/cadastro" className={ctaSecundaria}>
            Criar conta administrativa
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-border-default px-lg py-lg text-center text-xs text-text-secondary md:px-2xl">
        SIAB — Sistema de Identificação e Autenticação Biométrica · APS — PIVC — UNIP
      </footer>
    </main>
  );
}
