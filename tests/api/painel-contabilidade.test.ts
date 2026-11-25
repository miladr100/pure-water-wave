import { createHash, randomBytes } from "node:crypto";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { POST as autorizar } from "@/app/api/oauth/authorize/route";
import { POST as registrar } from "@/app/api/oauth/register/route";
import { POST as token } from "@/app/api/oauth/token/route";
import { POST as mcp } from "@/app/api/mcp/contabilidade/route";
import { PUT as acesso } from "@/app/api/painel/contabilidade/acesso/route";
import { DELETE as desconectar, GET as agentes } from "@/app/api/painel/contabilidade/agentes/route";
import { POST as assistente } from "@/app/api/painel/contabilidade/assistente/route";
import { DELETE as apagarCategoria, POST as criarCategoria } from "@/app/api/painel/contabilidade/categorias/route";
import { GET as verComprovante } from "@/app/api/painel/contabilidade/comprovantes/[id]/route";
import { POST as subirComprovante } from "@/app/api/painel/contabilidade/comprovantes/route";
import { PUT as moedas } from "@/app/api/painel/contabilidade/moedas/route";
import { POST as restaurar } from "@/app/api/painel/contabilidade/movimentos/[id]/restaurar/route";
import { DELETE as apagar, PATCH as editar } from "@/app/api/painel/contabilidade/movimentos/[id]/route";
import { POST as lancar } from "@/app/api/painel/contabilidade/movimentos/route";
import { GET as contabilidade } from "@/app/api/painel/contabilidade/route";
import type { Comprovante, ContabilidadeReply, Movimento } from "@/lib/hj/contabilidade";
import { addDays } from "@/lib/hj/dates";
import { HjRelatorio } from "@/models/hj-relatorio";

import { jsonRequest, params, readJson } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { createAdmin, createEducator, createEquipe, createMember, createRelatorio, createTeamSetup, hoje, signInAsPanel } from "../helpers/hj";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const ler = (lado: "painel" | "admin") => contabilidade(jsonRequest(`/api/painel/contabilidade?lado=${lado}`));
const post = (body: unknown) => lancar(jsonRequest("/api/painel/contabilidade/movimentos", { body }));
const gasto = (projetoId: string, extra: Record<string, unknown> = {}) => ({
  projetoId,
  tipo: "saida",
  valorMinor: 1800,
  moeda: "BRL",
  meio: "dinheiro",
  categoriaId: "transporte",
  data: hoje,
  descricao: "Ônibus",
  ...extra,
});

function formRequest(path: string, campos: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(campos)) {
    form.append(key, value);
  }
  return new Request(`http://localhost${path}`, { method: "POST", body: form });
}

// the smallest PNG there is: 1×1, transparent
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

describe("Contabilidade", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("each role sees its own books", async () => {
    const { educador, capita, membro, projeto, equipe } = await createTeamSetup();
    const outroEducador = await createEducator("Outra Educadora");
    const outra = await createEquipe(projeto._id, { nome: "Equipe 02 – HJA", educadorId: outroEducador._id, membroIds: [] });
    const admin = await createAdmin();

    await signInAsPanel(membro);
    expect((await readJson<ContabilidadeReply>(await ler("painel"))).livros).toEqual([]);
    expect((await post(gasto(String(equipe._id)))).status).toBe(404);

    await signInAsPanel(capita);
    const daCapita = await readJson<ContabilidadeReply>(await ler("painel"));
    expect(daCapita.livros.map((livro) => livro.id)).toEqual([String(equipe._id)]);
    expect(daCapita.podeConectar).toBe(false);
    expect((await readJson<ErrorBody>(await post(gasto(String(outra._id))))).code).toBe("BOOK_NOT_ALLOWED");

    await signInAsPanel(educador);
    const doEducador = await readJson<ContabilidadeReply>(await ler("admin"));
    expect(doEducador.livros.map((livro) => livro.nome)).toEqual(["Equipe 01 – HJA"]);
    expect(doEducador.podeConectar).toBe(true);

    await signInAsPanel(admin);
    const doAdmin = await readJson<ContabilidadeReply>(await ler("admin"));
    expect(doAdmin.livros.map((livro) => livro.nome)).toEqual(["Equipe 01 – HJA", "Equipe 02 – HJA", "Time HJ — Geral"]);

    // the administrator lets the other educator see every book
    expect((await acesso(jsonRequest("/api/painel/contabilidade/acesso", { method: "PUT", body: { educadorId: String(outroEducador._id), ve: true } }))).status).toBe(200);
    await signInAsPanel(outroEducador);
    expect((await readJson<ContabilidadeReply>(await ler("admin"))).livros).toHaveLength(3);
  });

  it("stores, edits, deletes and restores movements; RM reports come in by themselves", async () => {
    const { capita, membro, projeto, equipe } = await createTeamSetup();
    const livro = String(equipe._id);
    const relatorio = await createRelatorio(projeto._id, equipe._id, membro._id, { dinheiroCents: 20000, pixCents: 5000, despesasCents: 3000, estado: "validado" });
    await HjRelatorio.updateOne(
      { _id: relatorio._id },
      { $set: { despesasItens: [{ categoria: "transporte", valorCents: 1800 }, { categoria: "alimentacao", valorCents: 1200 }], validadoEm: new Date() } },
    );
    await createRelatorio(projeto._id, equipe._id, capita._id, { dinheiroCents: 99900, estado: "devolvido" });

    await signInAsPanel(capita);
    let dados = await readJson<ContabilidadeReply>(await ler("painel"));
    const doRm = dados.movimentos.filter((mov) => mov.origem === "relatorio");
    expect(doRm.map((mov) => [mov.tipo, mov.meio, mov.categoriaId, mov.valorMinor])).toEqual([
      ["entrada", "dinheiro", "rm", 20000],
      ["entrada", "conta", "rm", 5000],
      ["saida", "dinheiro", "transporte", 1800],
      ["saida", "dinheiro", "alimentacao", 1200],
    ]);
    expect(doRm[0].responsavel).toBe("Membro da Equipe");
    // what came from a report changes there, not here
    const editarRm = await editar(jsonRequest(`/api/painel/contabilidade/movimentos/${doRm[0].id}`, { method: "PATCH", body: {} }), params({ id: doRm[0].id }));
    expect((await readJson<ErrorBody>(editarRm)).code).toBe("FROM_REPORT");

    expect((await readJson<ErrorBody>(await post(gasto(livro, { categoriaId: "rm" })))).code).toBe("INVALID_CATEGORY");
    expect((await readJson<ErrorBody>(await post(gasto(livro, { data: addDays(hoje, 1) })))).code).toBe("INVALID_DATE");
    expect((await readJson<ErrorBody>(await post(gasto(livro, { valorMinor: -5 })))).code).toBe("INVALID_AMOUNT");
    expect((await readJson<ErrorBody>(await post({ ...gasto(livro), tipo: "transferencia", para: { moeda: "BRL", meio: "dinheiro" } }))).code).toBe("SAME_PLACE");

    const criado = await post(gasto(livro));
    expect(criado.status).toBe(201);
    const { movimento } = await readJson<{ movimento: Movimento }>(criado);
    expect(movimento).toMatchObject({ projetoId: livro, origem: "manual", responsavel: "Capitã da Equipe", valorMinor: 1800 });

    const deposito = await readJson<{ movimento: Movimento }>(
      await post({ projetoId: livro, tipo: "transferencia", valorMinor: 10000, moeda: "BRL", meio: "dinheiro", para: { moeda: "BRL", meio: "conta" }, descricao: "Depósito" }),
    );
    expect(deposito.movimento.para).toEqual({ moeda: "BRL", meio: "conta", valorMinor: 10000 });

    const editado = await editar(
      jsonRequest(`/api/painel/contabilidade/movimentos/${movimento.id}`, { method: "PATCH", body: { ...gasto(livro), valorMinor: 2200, pendente: true } }),
      params({ id: movimento.id }),
    );
    expect((await readJson<{ movimento: Movimento }>(editado)).movimento).toMatchObject({ valorMinor: 2200, pendente: true });

    expect((await apagar(jsonRequest(`/api/painel/contabilidade/movimentos/${movimento.id}`, { method: "DELETE" }), params({ id: movimento.id }))).status).toBe(200);
    dados = await readJson<ContabilidadeReply>(await ler("painel"));
    expect(dados.movimentos.some((mov) => mov.id === movimento.id)).toBe(false);
    const volta = await readJson<{ movimento: Movimento }>(await restaurar(jsonRequest(`/api/painel/contabilidade/movimentos/${movimento.id}/restaurar`, { method: "POST" }), params({ id: movimento.id })));
    expect(volta.movimento).toMatchObject({ id: movimento.id, valorMinor: 2200 });
  });

  it("categories, currencies and receipts are kept on the server", async () => {
    const { capita, equipe } = await createTeamSetup();
    const livro = String(equipe._id);
    await signInAsPanel(capita);

    const nova = await criarCategoria(jsonRequest("/api/painel/contabilidade/categorias", { body: { nome: "Combustível", tipo: "saida" } }));
    expect(nova.status).toBe(201);
    const { categoria } = await readJson<{ categoria: { id: string } }>(nova);
    expect((await criarCategoria(jsonRequest("/api/painel/contabilidade/categorias", { body: { nome: "combustivel", tipo: "saida" } }))).status).toBe(409);
    expect((await apagarCategoria(jsonRequest("/api/painel/contabilidade/categorias?id=transporte", { method: "DELETE" }))).status).toBe(400);
    await post(gasto(livro, { categoriaId: categoria.id }));
    expect((await readJson<ErrorBody>(await apagarCategoria(jsonRequest(`/api/painel/contabilidade/categorias?id=${encodeURIComponent(categoria.id)}`, { method: "DELETE" })))).code).toBe("IN_USE");
    expect((await readJson<ContabilidadeReply>(await ler("painel"))).categoriasEmUso).toEqual([categoria.id]);

    await moedas(jsonRequest("/api/painel/contabilidade/moedas", { method: "PUT", body: { livroId: livro, moedas: ["USD", "XXX", "BRL"] } }));
    expect((await readJson<ContabilidadeReply>(await ler("painel"))).moedasLigadas[livro]).toEqual(["USD"]);

    const texto = await subirComprovante(formRequest("/api/painel/contabilidade/comprovantes", { livroId: livro, arquivo: new Blob(["olá"], { type: "image/png" }) }));
    expect((await readJson<ErrorBody>(texto)).code).toBe("FILE_TYPE");
    const subido = await subirComprovante(formRequest("/api/painel/contabilidade/comprovantes", { livroId: livro, arquivo: new File([PNG], "cupom.png", { type: "image/png" }) }));
    expect(subido.status).toBe(201);
    const { comprovante } = await readJson<{ comprovante: Comprovante }>(subido);
    expect(comprovante).toMatchObject({ nome: "cupom.png", mime: "image/png" });

    const { movimento } = await readJson<{ movimento: Movimento }>(await post(gasto(livro, { comprovanteId: comprovante.id })));
    expect(movimento.comprovante).toEqual(comprovante);
    const imagem = await verComprovante(jsonRequest(`/api/painel/contabilidade/comprovantes/${comprovante.id}`), params({ id: comprovante.id }));
    expect(imagem.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await imagem.arrayBuffer()).equals(PNG)).toBe(true);

    // another team's captain cannot open it
    const outra = await createMember("Outra Capitã");
    await createEquipe(equipe.projetoId, { nome: "Equipe 02 – HJA", capitaoId: outra._id, membroIds: [outra._id] });
    await signInAsPanel(outra);
    expect((await verComprovante(jsonRequest(`/api/painel/contabilidade/comprovantes/${comprovante.id}`), params({ id: comprovante.id }))).status).toBe(404);
  });

  it("the assistant asks Claude and returns cards to confirm", async () => {
    const { capita, equipe } = await createTeamSetup();
    const livro = String(equipe._id);
    await signInAsPanel(capita);

    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const sem = await assistente(formRequest("/api/painel/contabilidade/assistente", { livroId: livro, mensagem: "gastei 18 de ônibus" }));
    expect((await readJson<ErrorBody>(sem)).code).toBe("AI_NOT_CONFIGURED");
    expect((await readJson<ContabilidadeReply>(await ler("painel"))).assistenteIA).toEqual({ texto: false, foto: false, audio: false });

    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-teste");
    const chamadas: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        chamadas.push({ url, body: JSON.parse(String(init.body)) as Record<string, unknown> });
        return new Response(
          JSON.stringify({
            stop_reason: "end_turn",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  resposta: "Entendi assim. Confira e confirme:",
                  movimentos: [
                    { tipo: "saida", valor: 18, moeda: "BRL", meio: "dinheiro", categoriaId: "transporte", data: hoje, descricao: "Ônibus", revisar: false },
                    { tipo: "saida", valor: 32.5, moeda: "BRL", meio: "conta", categoriaId: "inventada", data: addDays(hoje, 3), descricao: "Almoço", revisar: false },
                    { tipo: "saida", valor: 0, moeda: "BRL", meio: "conta", categoriaId: "outros", data: hoje, descricao: "Sem valor", revisar: false },
                  ],
                }),
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );
    const resposta = await assistente(
      formRequest("/api/painel/contabilidade/assistente", {
        livroId: livro,
        mensagem: "gastei 18 de ônibus e 32,50 no almoço no pix",
        historico: JSON.stringify([{ de: "eu", texto: "oi" }, { de: "assistente", texto: "Olá" }]),
      }),
    );
    expect(resposta.status).toBe(200);
    const corpo = await readJson<{ texto: string; propostas: { valorMinor: number; categoriaId: string; data: string; revisar: boolean }[] }>(resposta);
    expect(corpo.texto).toBe("Entendi assim. Confira e confirme:");
    // the amountless one is dropped; the wrong category and the future day are flagged
    expect(corpo.propostas).toEqual([
      expect.objectContaining({ valorMinor: 1800, categoriaId: "transporte", data: hoje, revisar: false }),
      expect.objectContaining({ valorMinor: 3250, categoriaId: "outros", data: hoje, revisar: true }),
    ]);
    expect(chamadas[0].url).toBe("https://api.anthropic.com/v1/messages");
    expect(chamadas[0].body).toMatchObject({ output_config: { format: { type: "json_schema" } } });
    expect(String(chamadas[0].body.system)).toContain("Equipe 01 – HJA");
    // nothing was saved: the person confirms each card
    expect((await readJson<ContabilidadeReply>(await ler("painel"))).movimentos.filter((mov) => mov.origem !== "relatorio")).toEqual([]);

    // a photo becomes a receipt and goes to Claude as an image
    const comFoto = await assistente(formRequest("/api/painel/contabilidade/assistente", { livroId: livro, foto: new File([PNG], "cupom.png", { type: "image/png" }) }));
    const lido = await readJson<{ comprovante: Comprovante }>(comFoto);
    expect(lido.comprovante).toMatchObject({ nome: "cupom.png" });
    const mensagens = chamadas[1].body.messages as { content: { type: string }[] }[];
    expect(mensagens[mensagens.length - 1].content[0].type).toBe("image");
  });

  it("an educator connects an agent with OAuth and uses the MCP tools", async () => {
    const { educador, capita, equipe } = await createTeamSetup();
    const livro = String(equipe._id);

    // no token: 401 pointing at the discovery document
    const anonimo = await mcp(jsonRequest("/api/mcp/contabilidade", { body: { jsonrpc: "2.0", id: 1, method: "initialize" } }));
    expect(anonimo.status).toBe(401);
    expect(anonimo.headers.get("www-authenticate")).toContain("/.well-known/oauth-protected-resource/api/mcp/contabilidade");

    const registro = await readJson<{ client_id: string }>(
      await registrar(jsonRequest("/api/oauth/register", { body: { client_name: "Claude", redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] } })),
    );
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const pedido = {
      client_id: registro.client_id,
      redirect_uri: "https://claude.ai/api/mcp/auth_callback",
      state: "xyz",
      code_challenge: challenge,
      code_challenge_method: "S256",
      decision: "allow",
    };

    // a captain is not an educator: no connector
    await signInAsPanel(capita);
    expect((await readJson<ErrorBody>(await autorizar(jsonRequest("/api/oauth/authorize", { body: pedido })))).code).toBe("NOT_EDUCATOR");

    await signInAsPanel(educador);
    const { redirect } = await readJson<{ redirect: string }>(await autorizar(jsonRequest("/api/oauth/authorize", { body: pedido })));
    const volta = new URL(redirect);
    expect(volta.searchParams.get("state")).toBe("xyz");
    const code = volta.searchParams.get("code") ?? "";

    const form = (campos: Record<string, string>) =>
      new Request("http://localhost/api/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(campos).toString() });
    const errado = await token(form({ grant_type: "authorization_code", code, client_id: registro.client_id, redirect_uri: pedido.redirect_uri, code_verifier: randomBytes(32).toString("base64url") }));
    expect((await readJson<{ error: string }>(errado)).error).toBe("invalid_grant");
    // a code is single-use: the failed attempt spent it, so even the right verifier fails now
    const tokens = await token(form({ grant_type: "authorization_code", code, client_id: registro.client_id, redirect_uri: pedido.redirect_uri, code_verifier: verifier }));
    expect(tokens.status).toBe(400);

    // a fresh authorization, done right
    const segundo = await readJson<{ redirect: string }>(await autorizar(jsonRequest("/api/oauth/authorize", { body: pedido })));
    const code2 = new URL(segundo.redirect).searchParams.get("code") ?? "";
    const emitidos = await readJson<{ access_token: string; refresh_token: string }>(
      await token(form({ grant_type: "authorization_code", code: code2, client_id: registro.client_id, redirect_uri: pedido.redirect_uri, code_verifier: verifier })),
    );
    expect(emitidos.access_token).toMatch(/^pwa_/);

    // the refresh token rotates: used once it gives a new pair, used again it is refused
    const girado = await token(form({ grant_type: "refresh_token", refresh_token: emitidos.refresh_token, client_id: registro.client_id }));
    expect(girado.status).toBe(200);
    expect((await readJson<{ error: string }>(await token(form({ grant_type: "refresh_token", refresh_token: emitidos.refresh_token, client_id: registro.client_id })))).error).toBe("invalid_grant");
    // …and reusing a retired refresh token revokes the whole family, the first access token included
    const novo = await readJson<{ redirect: string }>(await autorizar(jsonRequest("/api/oauth/authorize", { body: pedido })));
    Object.assign(
      emitidos,
      await readJson<{ access_token: string; refresh_token: string }>(
        await token(form({ grant_type: "authorization_code", code: new URL(novo.redirect).searchParams.get("code") ?? "", client_id: registro.client_id, redirect_uri: pedido.redirect_uri, code_verifier: verifier })),
      ),
    );

    const chamar = (body: unknown) => mcp(jsonRequest("/api/mcp/contabilidade", { body, headers: { authorization: `Bearer ${emitidos.access_token}` } }));
    const init = await readJson<{ result: { protocolVersion: string; serverInfo: { name: string } } }>(
      await chamar({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }),
    );
    expect(init.result).toMatchObject({ protocolVersion: "2025-06-18", serverInfo: { name: "pww-contabilidade" } });
    expect((await chamar({ jsonrpc: "2.0", method: "notifications/initialized" })).status).toBe(202);
    const lista = await readJson<{ result: { tools: { name: string }[] } }>(await chamar({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
    expect(lista.result.tools.map((tool) => tool.name)).toContain("lancar_movimentos");

    const livros = await readJson<{ result: { structuredContent: { livros: { id: string }[] } } }>(
      await chamar({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "listar_contabilidades", arguments: {} } }),
    );
    expect(livros.result.structuredContent.livros.map((item) => item.id)).toEqual([livro]);

    const ruim = await readJson<{ result: { isError: boolean; content: { text: string }[] } }>(
      await chamar({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "lancar_movimentos", arguments: { movimentos: [{ livroId: livro, tipo: "saida", valor: 10, meio: "dinheiro", categoriaId: "nada" }] } } }),
    );
    expect(ruim.result.isError).toBe(true);
    const bom = await readJson<{ result: { structuredContent: { lancados: number } } }>(
      await chamar({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "lancar_movimentos", arguments: { movimentos: [{ livroId: livro, tipo: "saida", valor: 45.9, meio: "conta", categoriaId: "alimentacao", descricao: "Mercado" }] } },
      }),
    );
    expect(bom.result.structuredContent.lancados).toBe(1);
    await signInAsPanel(educador);
    const dados = await readJson<ContabilidadeReply>(await ler("admin"));
    expect(dados.movimentos.find((mov) => mov.descricao === "Mercado")).toMatchObject({ origem: "mcp", valorMinor: 4590, responsavel: "Educador da Equipe" });

    // the agent shows in Ajustes, and disconnecting it stops the token
    const conectados = await readJson<{ agentes: { id: string; nome: string }[] }>(await agentes());
    expect(conectados.agentes.map((item) => item.nome)).toEqual(["Claude"]);
    await desconectar(jsonRequest(`/api/painel/contabilidade/agentes?id=${conectados.agentes[0].id}`, { method: "DELETE" }));
    expect((await chamar({ jsonrpc: "2.0", id: 6, method: "tools/list" })).status).toBe(401);
  });
});
