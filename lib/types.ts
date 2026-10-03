/**
 * Tipos espelhando os DTOs do back-end (ver
 * br.edu.unip.siab.user.dto.UsuarioResponse,
 * br.edu.unip.siab.auditlog.AccessLogResponse,
 * br.edu.unip.siab.terminal.dto.*). Mantidos manualmente em
 * sincronia por enquanto — se o projeto crescer, considerar gerar isso a
 * partir do OpenAPI (/v3/api-docs) exposto pelo back-end.
 */

export type NivelAcessoNome = "Acesso Geral" | "Diretoria" | "Ministro";

export interface Usuario {
  id: number;
  nome: string;
  cargo: string | null;
  nivelAcesso: NivelAcessoNome;
  /** Se o usuário tem PIN cadastrado (segundo fator das portas de nível Ministro). */
  possuiPin: boolean;
  criadoEm: string;
}

export interface AccessLog {
  id: number;
  usuarioId: number | null;
  nomeUsuario: string;
  resultado: "CONCEDIDO" | "NEGADO";
  similaridade: number | null;
  motivo: string | null;
  /** Nome do terminal (porta) onde a tentativa aconteceu. */
  terminal: string | null;
  ip: string | null;
  dataHora: string;
}

/**
 * Resposta de POST /api/recognition/scan. Só o necessário para a tela do
 * quiosque — similaridade e motivo detalhado ficam apenas na auditoria
 * (ver AccessLog), para não ajudar quem tenta calibrar um ataque.
 */
export interface ScanResult {
  acessoConcedido: boolean;
  usuario: { nome: string; nivelAcesso: NivelAcessoNome } | null;
  mensagem: string;
}

/**
 * Desafio de uso único (GET /api/recognition/desafio): o nonce entra na
 * assinatura HMAC do próximo scan; o resto descreve a porta onde o
 * terminal está instalado (o nível exigido vem do cadastro do terminal).
 */
export interface Desafio {
  nonce: string;
  expiraEm: string;
  terminal: string;
  nivelExigidoId: number;
  nivelExigido: NivelAcessoNome;
  exigePin: boolean;
}

/** Terminal (porta) cadastrado no painel — nunca inclui a chave. */
export interface Terminal {
  id: number;
  nome: string;
  nivelExigidoId: number;
  nivelExigido: NivelAcessoNome;
  ativo: boolean;
  criadoEm: string;
  ultimoUsoEm: string | null;
}

/** Resposta do cadastro de terminal: a única vez em que a chave aparece. */
export interface TerminalCriado {
  terminal: Terminal;
  /** Chave HMAC em base64 (32 bytes), para colar na tela de pareamento do /scan. */
  chave: string;
}

export interface Sessao {
  username: string;
  mfaAtivo: boolean;
}

export interface ConfiguracaoMfa {
  segredo: string;
  /** URI otpauth:// para apps autenticadores (Google Authenticator etc.). */
  uri: string;
}

export interface VerificacaoAuditoria {
  integra: boolean;
  acessosVerificados: number;
  acoesVerificadas: number;
  registrosLegados: number;
  checkpointsVerificados: number;
  problemas: string[];
  impressaoDigitalChaves: string;
}

export interface AccessSummary {
  totalTentativas: number;
  acessosConcedidos: number;
  acessosNegados: number;
}

export interface Administrador {
  id: number;
  username: string;
  criadoEm: string;
}
