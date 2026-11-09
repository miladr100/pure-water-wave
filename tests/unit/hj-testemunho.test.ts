import { describe, expect, it } from "vitest";

import { alertaDe, proximaEtapa, sugestoesPara } from "@/lib/hj/testemunho";
import type { ConvidadoDatas, ConvidadoEtapa } from "@/lib/hj/types";

const hoje = "2026-11-06";

function guest(etapa: ConvidadoEtapa, ultimoContato: string | null, datas: Partial<ConvidadoDatas> = {}, conferencias = 0) {
  return {
    etapa,
    conferencias,
    ultimoContato,
    datas: {
      primeiroContato: null,
      gateway: null,
      fichaAssinada: null,
      inicioSistema1: null,
      fimSistema1: null,
      inicioSistema2: null,
      jardim: null,
      ...datas,
    },
  };
}

describe("alertaDe", () => {
  it("flags a week without contact, whatever the stage", () => {
    expect(alertaDe(guest("pre_gateway", "2026-10-29"), hoje)).toEqual({ tipo: "sem_contato", texto: "sem contato há 8 dias" });
    expect(alertaDe(guest("pre_gateway", "2026-11-01"), hoje)).toBeNull();
  });

  it("asks for the form after the Gateway", () => {
    expect(alertaDe(guest("gateway", "2026-11-05", { gateway: "2026-11-01" }), hoje)).toEqual({ tipo: "ficha_pendente", texto: "ficha pendente" });
  });

  it("flags a Gateway that has not moved on in two weeks", () => {
    expect(alertaDe(guest("gateway", "2026-11-05", { gateway: "2026-10-20", fichaAssinada: "2026-10-21" }), hoje)).toEqual({
      tipo: "gateway_parado",
      texto: "Gateway há 17 dias",
    });
    expect(alertaDe(guest("gateway", "2026-11-05", { gateway: "2026-11-01", fichaAssinada: "2026-11-02" }), hoje)).toBeNull();
  });

  it("no contact in three weeks stalls Sistema 1 (but a week already fires sem_contato first)", () => {
    expect(alertaDe(guest("sistema1", "2026-10-10", {}, 5), hoje)?.tipo).toBe("sem_contato");
    expect(alertaDe(guest("sistema1", "2026-11-03", {}, 5), hoje)).toBeNull();
  });

  it("leaves the Jardim alone", () => {
    expect(alertaDe(guest("jardim", "2026-01-01"), hoje)).toBeNull();
  });
});

describe("sugestoesPara", () => {
  it("points at the next step of each stage", () => {
    expect(sugestoesPara(guest("pre_gateway", null))).toEqual(["Combinar a data do Gateway", "Registrar o primeiro contato"]);
    expect(sugestoesPara(guest("gateway", "2026-11-05"))).toEqual([
      "Assinar a ficha de inscrição",
      "Convidar para a primeira conferência do Sistema 1",
    ]);
    expect(sugestoesPara(guest("gateway", "2026-11-05", { fichaAssinada: "2026-11-05" }))).toEqual([
      "Convidar para a primeira conferência do Sistema 1",
    ]);
    expect(sugestoesPara(guest("sistema1", "2026-11-05", {}, 7))).toEqual(["Próxima conferência (8 de 16)"]);
    expect(sugestoesPara(guest("sistema1", "2026-11-05", {}, 16))).toEqual(["Concluir o Sistema 1 e combinar o Sistema 2"]);
    expect(sugestoesPara(guest("sistema2", "2026-11-05"))).toEqual(["Acompanhar o Sistema 2 até o Jardim"]);
    expect(sugestoesPara(guest("jardim", "2026-11-05"))).toEqual([]);
  });
});

describe("proximaEtapa", () => {
  it("walks the journey in order and stops at the Jardim", () => {
    expect(proximaEtapa("pre_gateway")).toBe("gateway");
    expect(proximaEtapa("sistema1")).toBe("sistema2");
    expect(proximaEtapa("jardim")).toBeNull();
  });
});
