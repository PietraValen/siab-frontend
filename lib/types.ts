/**
 * Tipos espelhando os DTOs do back-end (ver
 * br.edu.unip.siab.user.dto.UsuarioResponse,
 * br.edu.unip.siab.auditlog.AccessLogResponse). Mantidos manualmente em
 * sincronia por enquanto — se o projeto crescer, considerar gerar isso a
 * partir do OpenAPI (/v3/api-docs) exposto pelo back-end.
 */

export type NivelAcessoNome = "Acesso Geral" | "Diretoria" | "Ministro";

export interface Usuario {
  id: number;
  nome: string;
  cargo: string | null;
  nivelAcesso: NivelAcessoNome;
  criadoEm: string;
}

export interface AccessLog {
  id: number;
  usuarioId: number | null;
  nomeUsuario: string;
  resultado: "CONCEDIDO" | "NEGADO";
  similaridade: number | null;
  dataHora: string;
}

/**
 * Área do cofre onde o terminal /scan está instalado. Espelha o enum
 * br.edu.unip.siab.accesscontrol.AreaCofre: cada área exige um nível mínimo
 * (GERAL = 1, DIRETORIA = 2, MINISTRO = 3).
 */
export type AreaCofre = "GERAL" | "DIRETORIA" | "MINISTRO";

export interface ScanResult {
  acessoConcedido: boolean;
  usuario: { id: number; nome: string; nivelAcesso: NivelAcessoNome } | null;
  similaridade: number;
  motivo: string;
  area: AreaCofre;
  nivelExigido: number;
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
