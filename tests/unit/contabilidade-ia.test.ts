import { describe, expect, it } from "vitest";

import { CATEGORIAS_BASE } from "@/lib/hj/contabilidade";
import { propostasDe, tipoDoAudio, transcricaoVazia } from "@/lib/hj/contabilidade-ia";
import { mimeDosBytes, movimentosDoRelatorio } from "@/lib/hj/contabilidade-server";
import { maiuscula } from "@/lib/hj/dates";
import type { RelatorioDoc } from "@/lib/hj/data";
import { Types } from "mongoose";

describe("Contabilidade — server helpers", () => {
  it("checks what the model proposed", () => {
    const hoje = "2026-11-25";
    const propostas = propostasDe(
      [
        { tipo: "saida", valor: 12.5, moeda: "BRL", meio: "conta", categoriaId: "alimentacao", data: "2026-11-24", descricao: " Lanche ", revisar: false },
        { tipo: "entrada", valor: 18000, moeda: "KRW", meio: "dinheiro", categoriaId: "doacao", data: "ontem", descricao: "Oferta", revisar: false },
        { tipo: "saida", valor: "dez", moeda: "BRL", meio: "dinheiro", categoriaId: "outros", data: hoje, descricao: "x" },
        { tipo: "outro", valor: 5 },
      ],
      { hoje, categorias: CATEGORIAS_BASE },
    );
    expect(propostas).toEqual([
      { tipo: "saida", valorMinor: 1250, moeda: "BRL", meio: "conta", categoriaId: "alimentacao", data: "2026-11-24", descricao: "Lanche", revisar: false },
      // won has no cents; an unreadable day becomes today
      { tipo: "entrada", valorMinor: 18000, moeda: "KRW", meio: "dinheiro", categoriaId: "doacao", data: hoje, descricao: "Oferta", revisar: false },
    ]);
    expect(propostasDe("nada", { hoje, categorias: CATEGORIAS_BASE })).toEqual([]);
  });

  it("knows receipts and voice notes by their bytes", () => {
    expect(mimeDosBytes(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(mimeDosBytes(Buffer.from("%PDF-1.7 aaaaaaa"))).toBe("application/pdf");
    expect(mimeDosBytes(Buffer.from("<html>aaaaaaaa</html>"))).toBeNull();
    expect(tipoDoAudio(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("webm");
    expect(tipoDoAudio(Buffer.from("OggSaaaaaaaaaa"))?.ext).toBe("ogg");
    expect(transcricaoVazia("  Obrigado.  ")).toBe(true);
    expect(transcricaoVazia("gastei 18 de ônibus")).toBe(false);
    expect(transcricaoVazia("gastei 18", 0.9)).toBe(true);
  });

  it("turns a validated report into the team's movements", () => {
    const relatorio = {
      _id: new Types.ObjectId(),
      equipeId: new Types.ObjectId(),
      membroId: new Types.ObjectId(),
      data: "2026-11-20",
      dinheiroCents: 15000,
      pixCents: 0,
      despesasCents: 2500,
      despesasItens: [],
      validadoEm: new Date("2026-11-20T22:00:00Z"),
    } as unknown as RelatorioDoc;
    // a report from before the categories: its total expense counts as "Outros"
    expect(movimentosDoRelatorio(relatorio, "Ana").map((mov) => [mov.tipo, mov.valorMinor, mov.categoriaId, mov.origem])).toEqual([
      ["entrada", 15000, "rm", "relatorio"],
      ["saida", 2500, "outros", "relatorio"],
    ]);
  });

  it("capitalises only the first letter of a date", () => {
    expect(maiuscula("sábado, 14 de novembro")).toBe("Sábado, 14 de novembro");
    expect(maiuscula("")).toBe("");
  });
});
