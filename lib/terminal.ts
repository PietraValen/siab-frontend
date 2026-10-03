/**
 * Pareamento e assinatura do quiosque /scan com o back-end (ver
 * TerminalAutenticacaoService no siab-backend).
 *
 * Cada porta do cofre é um terminal cadastrado no painel (/admin/terminais),
 * que gera um id e uma chave HMAC de 32 bytes mostrada uma única vez. O
 * quiosque é pareado colando esse id + chave; a partir daí toda tentativa
 * de reconhecimento vai assinada com HMAC-SHA256 sobre uma mensagem
 * canônica (ver mensagemCanonica), o que impede que alguém fora de um
 * terminal cadastrado (ou repetindo uma requisição antiga) chame o scan.
 *
 * A chave é importada na WebCrypto como NÃO extraível e só o objeto
 * CryptoKey é guardado (em IndexedDB, que aceita CryptoKey por structured
 * clone). Os bytes da chave nunca vão para localStorage nem ficam
 * acessíveis a script depois do pareamento — um XSS conseguiria usar a
 * chave enquanto roda, mas não copiá-la para fora do navegador.
 */

export const VERSAO_MENSAGEM = "SIAB-SCAN-v1";

const NOME_BANCO = "siab-terminal";
const NOME_STORE = "pareamento";
const CHAVE_REGISTRO = "atual";

export type Pareamento = {
  terminalId: string;
  chave: CryptoKey;
};

/**
 * Mensagem assinada em cada scan — precisa bater byte a byte com
 * TerminalAutenticacaoService.mensagemCanonica no back-end: linhas unidas
 * por "\n", sem quebra de linha no final, hashes SHA-256 dos frames em hex
 * minúsculo separados por vírgula na mesma ordem do upload, e PIN vazio
 * quando não houver.
 */
export function mensagemCanonica(dados: {
  terminalId: string;
  nonce: string;
  timestamp: string;
  hashesFrames: string[];
  pin?: string;
}): string {
  return [
    VERSAO_MENSAGEM,
    dados.terminalId,
    dados.nonce,
    dados.timestamp,
    dados.hashesFrames.join(","),
    dados.pin ?? "",
  ].join("\n");
}

function paraHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function paraBase64(bytes: ArrayBuffer): string {
  let binario = "";
  for (const b of new Uint8Array(bytes)) binario += String.fromCharCode(b);
  return btoa(binario);
}

/** SHA-256 em hex minúsculo (mesmo formato do HexFormat.of() do back-end). */
export async function sha256Hex(dados: ArrayBuffer | Uint8Array): Promise<string> {
  return paraHex(await crypto.subtle.digest("SHA-256", dados as BufferSource));
}

/** HMAC-SHA256 da mensagem em UTF-8, em base64 padrão (com padding). */
export async function assinarMensagem(chave: CryptoKey, mensagem: string): Promise<string> {
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(mensagem));
  return paraBase64(assinatura);
}

/** Importa a chave em base64 (32 bytes) como CryptoKey HMAC não extraível. */
export async function importarChave(chaveBase64: string): Promise<CryptoKey> {
  let binario: string;
  try {
    binario = atob(chaveBase64.trim());
  } catch {
    throw new Error("Chave inválida: não está em base64.");
  }
  if (binario.length !== 32) {
    throw new Error("Chave inválida: deve ter 32 bytes (copie exatamente o valor mostrado no painel).");
  }
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

/**
 * Assina uma tentativa de scan. Devolve o timestamp usado (vai no header
 * X-Timestamp) e a assinatura (header X-Assinatura).
 */
export async function assinarScan(
  pareamento: Pareamento,
  dados: { nonce: string; frames: Blob[]; pin?: string; timestamp?: string },
): Promise<{ timestamp: string; assinatura: string }> {
  const timestamp = dados.timestamp ?? String(Date.now());
  const hashesFrames = await Promise.all(
    dados.frames.map(async (frame) => sha256Hex(await frame.arrayBuffer())),
  );
  const mensagem = mensagemCanonica({
    terminalId: pareamento.terminalId,
    nonce: dados.nonce,
    timestamp,
    hashesFrames,
    pin: dados.pin,
  });
  return { timestamp, assinatura: await assinarMensagem(pareamento.chave, mensagem) };
}

// ---------------------------------------------------------------------------
// Persistência do pareamento (IndexedDB)
// ---------------------------------------------------------------------------

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador não oferece IndexedDB."));
      return;
    }
    const pedido = indexedDB.open(NOME_BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(NOME_STORE);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function operar<T>(
  modo: IDBTransactionMode,
  acao: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const banco = await abrirBanco();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, modo);
      const pedido = acao(transacao.objectStore(NOME_STORE));
      transacao.oncomplete = () => resolve(pedido.result as T);
      transacao.onerror = () => reject(transacao.error);
      transacao.onabort = () => reject(transacao.error);
    });
  } finally {
    banco.close();
  }
}

/** Pareamento salvo neste navegador, ou null se o quiosque ainda não foi pareado. */
export async function obterPareamento(): Promise<Pareamento | null> {
  try {
    const registro = await operar<Pareamento | undefined>("readonly", (store) =>
      store.get(CHAVE_REGISTRO),
    );
    return registro && registro.terminalId && registro.chave ? registro : null;
  } catch {
    return null;
  }
}

/** Valida e salva o id + chave gerados em /admin/terminais. */
export async function parear(terminalId: string, chaveBase64: string): Promise<Pareamento> {
  const id = terminalId.trim();
  if (!/^\d+$/.test(id)) {
    throw new Error("ID do terminal inválido: use o número mostrado no painel.");
  }
  const pareamento: Pareamento = { terminalId: id, chave: await importarChave(chaveBase64) };
  await operar("readwrite", (store) => store.put(pareamento, CHAVE_REGISTRO));
  return pareamento;
}

/** Apaga o pareamento deste navegador (ex.: terminal revogado no painel). */
export async function desparear(): Promise<void> {
  await operar("readwrite", (store) => store.delete(CHAVE_REGISTRO));
}
