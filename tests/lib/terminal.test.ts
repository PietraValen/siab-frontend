// @vitest-environment node
// WebCrypto do Node (globalThis.crypto.subtle) — no jsdom o importKey
// estranha buffers criados em outro "realm".
import { createHash, createHmac, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assinarMensagem,
  assinarScan,
  importarChave,
  mensagemCanonica,
  obterPareamento,
  sha256Hex,
} from "@/lib/terminal";

describe("mensagemCanonica", () => {
  it("segue exatamente o formato SIAB-SCAN-v1 do back-end (vetor de teste)", () => {
    expect(
      mensagemCanonica({
        terminalId: "7",
        nonce: "abc",
        timestamp: "1700000000000",
        hashesFrames: ["aa", "bb"],
        pin: "",
      }),
    ).toBe("SIAB-SCAN-v1\n7\nabc\n1700000000000\naa,bb\n");
  });

  it("trata PIN ausente como string vazia e inclui o PIN quando há", () => {
    const base = { terminalId: "7", nonce: "abc", timestamp: "1", hashesFrames: ["aa"] };
    expect(mensagemCanonica(base)).toBe("SIAB-SCAN-v1\n7\nabc\n1\naa\n");
    expect(mensagemCanonica({ ...base, pin: "1234" })).toBe("SIAB-SCAN-v1\n7\nabc\n1\naa\n1234");
  });
});

describe("criptografia do terminal (WebCrypto)", () => {
  const chaveBruta = randomBytes(32);
  const chaveBase64 = chaveBruta.toString("base64");

  it("sha256Hex gera hex minúsculo igual ao do Node", async () => {
    const dados = new TextEncoder().encode("frame");
    expect(await sha256Hex(dados)).toBe(createHash("sha256").update(dados).digest("hex"));
  });

  it("HMAC-SHA256 em base64 bate com o createHmac do Node", async () => {
    const chave = await importarChave(chaveBase64);
    const mensagem = "SIAB-SCAN-v1\n7\nabc\n1700000000000\naa,bb\n";

    expect(await assinarMensagem(chave, mensagem)).toBe(
      createHmac("sha256", chaveBruta).update(mensagem, "utf8").digest("base64"),
    );
  });

  it("importa a chave como não extraível", async () => {
    const chave = await importarChave(chaveBase64);
    expect(chave.extractable).toBe(false);
    expect(chave.usages).toEqual(["sign"]);
  });

  it("recusa chave que não tem 32 bytes ou não é base64", async () => {
    await expect(importarChave(randomBytes(16).toString("base64"))).rejects.toThrow(/32 bytes/);
    await expect(importarChave("não é base64!")).rejects.toThrow(/base64/);
  });

  it("assinarScan assina os hashes dos frames na ordem do upload", async () => {
    const chave = await importarChave(chaveBase64);
    const frames = [new Blob(["f0"]), new Blob(["f1"])];

    const { timestamp, assinatura } = await assinarScan(
      { terminalId: "7", chave },
      { nonce: "abc", frames, pin: "1234", timestamp: "1700000000000" },
    );

    const hash = (s: string) => createHash("sha256").update(s).digest("hex");
    const esperada = createHmac("sha256", chaveBruta)
      .update(`SIAB-SCAN-v1\n7\nabc\n1700000000000\n${hash("f0")},${hash("f1")}\n1234`, "utf8")
      .digest("base64");
    expect(timestamp).toBe("1700000000000");
    expect(assinatura).toBe(esperada);
  });
});

describe("pareamento", () => {
  it("sem IndexedDB disponível, trata o quiosque como não pareado", async () => {
    await expect(obterPareamento()).resolves.toBeNull();
  });
});
