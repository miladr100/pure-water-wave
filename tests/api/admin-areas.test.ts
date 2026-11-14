import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as listAreas, POST as createArea } from "@/app/api/admin/hj/areas/route";
import { DELETE as deleteArea, PATCH as patchArea } from "@/app/api/admin/hj/areas/[id]/route";
import { PATCH as patchEquipe } from "@/app/api/admin/hj/equipes/[id]/route";
import { GET as resultados } from "@/app/api/admin/hj/testemunho/resultados/route";
import type { AreaNode, TestemunhoResultados } from "@/lib/hj/types";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createConvidado, createEducator, createEquipe, createMember, createProjeto, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const areas = async () => (await readJson<{ areas: AreaNode[] }>(await listAreas())).areas;
const post = (body: unknown) => createArea(jsonRequest("/api/admin/hj/areas", { body }));
const patch = (id: string, body: unknown) => patchArea(jsonRequest(`/api/admin/hj/areas/${id}`, { method: "PATCH", body }), params({ id }));
const remove = (id: string) => deleteArea(jsonRequest(`/api/admin/hj/areas/${id}`, { method: "DELETE" }), params({ id }));

describe("Áreas de missão e resultados por área", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("seeds the five regions with their countries; the administrator adds locals under a country", async () => {
    const educador = await createEducator();
    await signInAsPanel(educador);
    const seeded = await areas();
    expect(seeded.filter((area) => area.tipo === "regiao").map((area) => area.nome)).toEqual(["Região 1", "Região 2", "Região 3", "Região 4", "Região 5"]);
    const brasil = seeded.find((area) => area.nome === "Brasil")!;
    expect(seeded.find((area) => area.id === brasil.paiId)?.nome).toBe("Região 1");
    // an educator reads, never writes
    expect((await post({ tipo: "local", nome: "Campinas", paiId: brasil.id })).status).toBe(404);

    const admin = await createAdmin();
    await signInAsPanel(admin);
    expect((await readJson<ErrorBody>(await post({ tipo: "local", nome: "Campinas" }))).code).toBe("PARENT_REQUIRED");
    expect((await readJson<ErrorBody>(await post({ tipo: "regiao", nome: "Região X", paiId: brasil.id }))).code).toBe("INVALID_PARENT");
    const regiao1 = seeded.find((area) => area.nome === "Região 1")!;
    expect((await readJson<ErrorBody>(await post({ tipo: "local", nome: "Campinas", paiId: regiao1.id }))).code).toBe("INVALID_PARENT");
    const created = await post({ tipo: "local", nome: "Campinas", paiId: brasil.id });
    expect(created.status).toBe(201);
    expect((await readJson<ErrorBody>(await post({ tipo: "local", nome: "campinas", paiId: brasil.id }))).code).toBe("DUPLICATE");
    const { area } = await readJson<{ area: { id: string } }>(created);

    expect((await readJson<ErrorBody>(await remove(brasil.id))).code).toBe("HAS_CHILDREN");
    await patch(area.id, { nome: "Campinas – Centro", ativo: false });
    expect((await areas()).find((item) => item.id === area.id)).toMatchObject({ nome: "Campinas – Centro", ativo: false, tipo: "local" });
    expect((await remove(area.id)).status).toBe(200);
  });

  it("a team points at a local; results roll up local → país → região and by program", async () => {
    const admin = await createAdmin();
    await signInAsPanel(admin);
    const brasil = (await areas()).find((area) => area.nome === "Brasil")!;
    const { area: campinas } = await readJson<{ area: { id: string } }>(await post({ tipo: "local", nome: "Campinas", paiId: brasil.id }));
    const { area: curitiba } = await readJson<{ area: { id: string } }>(await post({ tipo: "local", nome: "Curitiba", paiId: brasil.id }));

    const rm = await createProjeto();
    await createProjeto({ nome: "Testemunho", tipo: "testemunho" });
    const a = await createMember("A");
    const b = await createMember("B");
    const c = await createMember("C");
    const equipeA = await createEquipe(rm._id, { nome: "Equipe 01 – HJA", programa: "HJA", membroIds: [a._id, b._id] });
    const equipeB = await createEquipe(rm._id, { nome: "Equipe 01 – HJR", programa: "HJR", membroIds: [c._id] });
    const semArea = await createEquipe(rm._id, { nome: "Equipe 02 – HJA", programa: "HJA", membroIds: [] });
    void semArea;

    // a team's area must be a local
    expect((await readJson<ErrorBody>(await patchEquipe(jsonRequest(`/api/admin/hj/equipes/${equipeA._id}`, { method: "PATCH", body: { areaId: brasil.id } }), params({ id: equipeA._id.toString() })))).code).toBe("AREA_NOT_LOCAL");
    await patchEquipe(jsonRequest(`/api/admin/hj/equipes/${equipeA._id}`, { method: "PATCH", body: { areaId: campinas.id } }), params({ id: equipeA._id.toString() }));
    await patchEquipe(jsonRequest(`/api/admin/hj/equipes/${equipeB._id}`, { method: "PATCH", body: { areaId: curitiba.id } }), params({ id: equipeB._id.toString() }));
    expect((await areas()).find((area) => area.id === campinas.id)?.equipes).toBe(1);

    await createConvidado(a._id, { nome: "G1", etapa: "gateway" });
    await createConvidado(a._id, { nome: "G2", etapa: "sistema1", conferencias: 3 });
    await createConvidado(c._id, { nome: "G3", etapa: "jardim" });

    const body = await readJson<TestemunhoResultados>(await resultados(jsonRequest("/api/admin/hj/testemunho/resultados")));
    expect(body.projeto?.nome).toBe("Testemunho");
    expect(body.total).toMatchObject({ convidados: 3, membros: 3, membrosComConvidado: 2, porEtapa: { gateway: 1, sistema1: 1, jardim: 1, pre_gateway: 0, sistema2: 0 } });
    const regiao1 = body.arvore.find((node) => node.nome === "Região 1")!;
    expect(regiao1.convidados).toBe(3);
    const brasilNode = regiao1.filhos[0];
    expect(brasilNode.nome).toBe("Brasil");
    expect(brasilNode.filhos.map((node) => `${node.nome}:${node.convidados}`)).toEqual(["Campinas:2", "Curitiba:1"]);
    expect(brasilNode.filhos[0].filhos[0]).toMatchObject({ tipo: "equipe", nome: "Equipe 01 – HJA", programa: "HJA", convidados: 2, membros: 2, membrosComConvidado: 1 });
    expect(body.arvore.find((node) => node.tipo === "sem_area")?.filhos.map((node) => node.nome)).toEqual(["Equipe 02 – HJA"]);
    expect(body.porPrograma.map((row) => `${row.programa}:${row.convidados}`)).toEqual(["HJA:2", "HJR:1"]);
  });
});
