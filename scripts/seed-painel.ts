import fs from "node:fs";
import path from "node:path";
import { Types } from "mongoose";

import { addDays, daysBetween, todayInBrazil } from "@/lib/hj/dates";
import { liquido } from "@/lib/hj/rm";
import type { ConvidadoEtapa, HjPrograma } from "@/lib/hj/types";
import { hashPassword } from "@/lib/password";
import { AcademyUser } from "@/models/academy-user";
import { HjAcontecimento, HjConvidado } from "@/models/hj-convidado";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";
import { HjRelatorio } from "@/models/hj-relatorio";
import { SystemUser } from "@/models/system-user";

// `npm run seed:painel`: a demo HJ Team the size of the real one — one RM
// project running today, thirteen teams across HJ Academy, HJ Rang, Pure
// Water and UPA, six educators, five pastors, reports for the days gone
// by, guests on every stage of the journey, and one account per role to
// sign in with. Re-running wipes the `hj_*` collections and the demo
// accounts (`@purewaterwave.test`) and builds them again, so the demo
// always starts from the same place.
//
// Accounts to show around (password for all: SEED_PAINEL_PASSWORD or "painel123"):
//   ana.membro@purewaterwave.test        member of Equipe 01 – HJA
//   bia.capita@purewaterwave.test        captain of Equipe 01 – HJA
//   david.educador@purewaterwave.test    educator (HJ Academy teams)
//   marcos.educador@purewaterwave.test   educator (HJ Rang teams)
//   yeseong.admin@purewaterwave.test     administrator (and educator of Pure Water)
//   pastor.teste@purewaterwave.test      pastor (library only), password "teste123"

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const DEMO_DOMAIN = "purewaterwave.test";
const PASSWORD = process.env.SEED_PAINEL_PASSWORD ?? "painel123";

// Deterministic "random": the same demo every time.
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
const random = rng(20261109);
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];

type Person = { email: string; nome: string; role: "student" | "tutor"; admin?: boolean; cidade: string };

const EDUCADORES: Person[] = [
  { email: "david.educador", nome: "David Lima", role: "tutor", cidade: "São Paulo" },
  { email: "fernanda.educadora", nome: "Fernanda Ikeda", role: "tutor", cidade: "São Paulo" },
  { email: "marcos.educador", nome: "Marcos Tanaka", role: "tutor", cidade: "Campinas" },
  { email: "paulo.educador", nome: "Paulo Nascimento", role: "tutor", cidade: "Belo Horizonte" },
  { email: "yeseong.admin", nome: "Yeseong Robert", role: "tutor", admin: true, cidade: "São Paulo" },
  { email: "larissa.educadora", nome: "Larissa Kang", role: "tutor", cidade: "Curitiba" },
];

const PASTORES = [
  { email: "pastor.teste", nome: "Pastor de Teste", igreja: "Igreja Teste", cidade: "São Paulo", senha: "teste123" },
  { email: "pr.joao", nome: "Pr. João Batista Lima", igreja: "Igreja Família da Paz – Jd. Paulista", cidade: "São Paulo" },
  { email: "pra.marcia", nome: "Pra. Márcia Oliveira", igreja: "Igreja Família da Paz – Campinas", cidade: "Campinas" },
  { email: "pr.renato", nome: "Pr. Renato Alves", igreja: "Igreja Família da Paz – BH", cidade: "Belo Horizonte" },
  { email: "pr.sergio", nome: "Pr. Sérgio Nakamura", igreja: "Igreja Família da Paz – Curitiba", cidade: "Curitiba" },
];

// The accounts the group already knows by name stay in Equipe 01 – HJA.
const NAMED_HJA_01: Person[] = [
  { email: "bia.capita", nome: "Bia Souza", role: "student", cidade: "São Paulo" },
  { email: "ana.membro", nome: "Ana Silva", role: "student", cidade: "São Paulo" },
  { email: "carlos.membro", nome: "Carlos Pereira", role: "student", cidade: "Guarulhos" },
  { email: "julia.membro", nome: "Júlia Nakamura", role: "student", cidade: "São Paulo" },
  { email: "pedro.membro", nome: "Pedro Alves", role: "student", cidade: "Osasco" },
  { email: "luana.membro", nome: "Luana Costa", role: "student", cidade: "São Paulo" },
];

const FIRST = ["Lucas", "Mariana", "Gabriel", "Beatriz", "Rafael", "Camila", "Thiago", "Larissa", "Felipe", "Isabela", "Bruno", "Letícia", "Daniel", "Amanda", "Mateus", "Juliana", "Guilherme", "Fernanda", "Vinícius", "Natália", "Leonardo", "Carolina", "Eduardo", "Gabriela", "Henrique", "Bianca", "Rodrigo", "Aline", "Diego", "Vanessa", "Caio", "Renata", "Igor", "Patrícia", "Samuel", "Tatiane", "André", "Priscila", "Victor", "Débora", "Jonathan", "Raquel", "Otávio", "Sabrina", "Murilo", "Lívia", "Nicolas", "Yasmin", "Arthur", "Helena", "Davi", "Sofia", "Heitor", "Laura", "Enzo", "Valentina", "Miguel", "Clara", "Theo", "Alice", "Benjamin", "Manuela", "Joaquim", "Cecília", "Hyun-woo", "Ji-eun", "Min-jun", "Soo-ah", "Kenji", "Yuki"];
const LAST = ["Oliveira", "Santos", "Ferreira", "Rodrigues", "Almeida", "Carvalho", "Gomes", "Martins", "Araújo", "Ribeiro", "Barbosa", "Rocha", "Dias", "Moreira", "Nunes", "Mendes", "Cardoso", "Teixeira", "Correia", "Pinto", "Lopes", "Castro", "Ramos", "Freitas", "Kim", "Park", "Choi", "Yamamoto", "Sato", "Tanaka", "Batista", "Monteiro", "Vieira", "Cunha", "Melo", "Campos", "Duarte", "Reis", "Fonseca", "Machado"];

type TeamSpec = { nome: string; programa: HjPrograma; educador: string; tamanho: number; cidades: string[] };

const PROGRAMAS: { programa: HjPrograma; nome: string; equipes: number; tamanho: [number, number]; educadores: string[]; cidades: string[] }[] = [
  { programa: "HJA", nome: "HJ Academy", equipes: 4, tamanho: [5, 7], educadores: ["david.educador", "fernanda.educadora"], cidades: ["São Paulo", "Guarulhos", "Osasco", "Santo André"] },
  { programa: "HJR", nome: "HJ Rang", equipes: 5, tamanho: [5, 8], educadores: ["marcos.educador", "paulo.educador"], cidades: ["Campinas", "Belo Horizonte", "Jundiaí", "Valinhos", "Contagem"] },
  { programa: "PW", nome: "Pure Water", equipes: 3, tamanho: [4, 6], educadores: ["yeseong.admin", "larissa.educadora"], cidades: ["Curitiba", "Londrina", "Florianópolis"] },
  { programa: "UPA", nome: "UPA", equipes: 1, tamanho: [4, 5], educadores: ["larissa.educadora"], cidades: ["Porto Alegre"] },
];

function buildTeams(): { spec: TeamSpec; membros: Person[] }[] {
  const used = new Set<string>();
  const teams: { spec: TeamSpec; membros: Person[] }[] = [];
  const nextPerson = (cidades: string[]): Person => {
    for (;;) {
      const nome = `${pick(FIRST)} ${pick(LAST)}`;
      const email = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, ".");
      if (!used.has(email)) {
        used.add(email);
        return { email, nome, role: "student", cidade: pick(cidades) };
      }
    }
  };
  for (const programa of PROGRAMAS) {
    for (let n = 1; n <= programa.equipes; n += 1) {
      const nome = `Equipe ${String(n).padStart(2, "0")} – ${programa.programa}`;
      const educador = programa.educadores[(n - 1) % programa.educadores.length];
      const [min, max] = programa.tamanho;
      const tamanho = min + Math.floor(random() * (max - min + 1));
      const membros: Person[] =
        programa.programa === "HJA" && n === 1
          ? [...NAMED_HJA_01]
          : Array.from({ length: tamanho }, () => nextPerson(programa.cidades));
      teams.push({ spec: { nome, programa: programa.programa, educador, tamanho: membros.length, cidades: programa.cidades }, membros });
    }
  }
  return teams;
}

async function main() {
  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI não está definida (.env.local ou ambiente)");
  }
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();

  const hoje = todayInBrazil();
  const [year, month] = hoje.split("-").map(Number);
  const inicio = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const fim = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 15)));

  const teams = buildTeams();
  const people = [...EDUCADORES, ...teams.flatMap((team) => team.membros)];

  // Start clean: the panel's collections and every demo account.
  const demoEmails = new RegExp(`@${DEMO_DOMAIN.replace(".", "\\.")}$`);
  await Promise.all([
    HjProjeto.deleteMany({}),
    HjEquipe.deleteMany({}),
    HjRelatorio.deleteMany({}),
    HjConvidado.deleteMany({}),
    HjAcontecimento.deleteMany({}),
    AcademyUser.deleteMany({ email: demoEmails, login: { $not: /^(tutor|aluno|hjteam\.teste)@/ } }),
    SystemUser.deleteMany({ email: demoEmails, role: "pastor" }),
  ]);

  const hash = await hashPassword(PASSWORD);
  const ids = new Map<string, Types.ObjectId>();
  for (const person of people) {
    const email = `${person.email}@${DEMO_DOMAIN}`;
    const doc = await AcademyUser.findOneAndUpdate(
      { email },
      {
        $set: {
          fullName: person.nome,
          email,
          login: email,
          password: hash,
          phone: "",
          country: "Brasil",
          city: person.cidade,
          language: "pt",
          role: person.role,
          isAdmin: person.admin === true,
          theme: "system",
        },
      },
      { upsert: true, new: true },
    );
    ids.set(person.email, doc!._id as Types.ObjectId);
  }

  for (const [index, pastor] of PASTORES.entries()) {
    const email = `${pastor.email}@${DEMO_DOMAIN}`;
    await SystemUser.create({
      fullName: pastor.nome,
      phone: `551199990${String(index).padStart(3, "0")}`,
      email,
      churchName: pastor.igreja,
      country: "Brasil",
      language: "pt",
      login: email,
      password: pastor.senha ? await hashPassword(pastor.senha) : hash,
      role: "pastor",
    });
  }

  const descanso = daysBetween(inicio, fim).filter((dia) => new Date(`${dia}T12:00:00Z`).getUTCDay() === 0);
  const projeto = await HjProjeto.create({
    nome: `RM 30 dias – ${monthName} ${year}`,
    tipo: "arrecadacao",
    inicio,
    fim,
    ativo: true,
    diasDescanso: descanso,
    moeda: "BRL",
    metaDiariaPadraoCents: 30000,
    metaTotalCents: 120_000_000,
    metasPrograma: [
      { programa: "HJA", metaCents: 35_000_000 },
      { programa: "HJR", metaCents: 55_000_000 },
      { programa: "PW", metaCents: 30_000_000 },
    ],
    regraNovaMeta: { fator: 1.3, arredondarCents: 5000, minimoCents: 30000 },
  });

  // Last month's project, closed, so "copiar do projeto anterior" has a source.
  await HjProjeto.create({
    nome: "RM 30 dias – anterior",
    tipo: "arrecadacao",
    inicio: addDays(inicio, -1).slice(0, 8) + "01",
    fim: addDays(inicio, -1),
    ativo: false,
    diasDescanso: [],
    metaDiariaPadraoCents: 30000,
    metaTotalCents: 100_000_000,
    metasPrograma: [],
  });

  await HjProjeto.create({
    nome: `Testemunho ${year}`,
    tipo: "testemunho",
    inicio: `${year}-01-01`,
    fim: `${year}-12-31`,
    ativo: true,
    diasDescanso: [],
  });

  const dias = daysBetween(inicio, hoje).filter((dia) => !descanso.includes(dia));
  const diasPassados = dias.filter((dia) => dia < hoje);
  let relatorios = 0;

  for (const team of teams) {
    const capitao = team.membros[0];
    const equipe = await HjEquipe.create({
      projetoId: projeto._id,
      nome: team.spec.nome,
      programa: team.spec.programa,
      educadorId: ids.get(team.spec.educador),
      capitaoId: ids.get(capitao.email),
      membroIds: team.membros.map((member) => ids.get(member.email)),
    });

    const docs: Record<string, unknown>[] = [];
    for (const [index, member] of team.membros.entries()) {
      const membroId = ids.get(member.email)!;
      // Each member has their own pace; the programs differ a little too.
      const base = (team.spec.programa === "HJR" ? 32000 : 26000) + Math.round(random() * 40000);
      for (const dia of diasPassados) {
        if (random() < 0.12) continue; // not everyone sends every day
        const dinheiro = Math.round((base * (0.5 + random())) / 100) * 100;
        const pix = Math.round((base * random() * 0.8) / 100) * 100;
        const despesas = random() < 0.3 ? Math.round((random() * 4000) / 100) * 100 : 0;
        const old = dia < addDays(hoje, -2);
        docs.push({
          projetoId: projeto._id,
          equipeId: equipe._id,
          membroId,
          data: dia,
          dinheiroCents: dinheiro,
          pixCents: pix,
          despesasCents: despesas,
          liquidoCents: liquido(dinheiro, pix, despesas),
          itens: Math.round(random() * 12),
          contatos: Math.round(random() * 30),
          observacoes: random() < 0.15 ? pick(["Dia de chuva, menos gente na rua", "Feira da cidade, muita gente", "Saí mais tarde hoje"]) : "",
          estado: old ? "validado" : random() < 0.8 ? "enviado" : "devolvido",
          motivoDevolucao: "",
          enviadoEm: new Date(`${dia}T21:30:00-03:00`),
          validadoPorId: old ? ids.get(capitao.email) : null,
          validadoEm: old ? new Date(`${dia}T22:10:00-03:00`) : null,
        });
      }
      // Today: about half already sent; Ana (index 1 of Equipe 01 – HJA) did not.
      const isAna = member.email === "ana.membro";
      if (!isAna && index !== 1 && random() < 0.5) {
        const dinheiro = Math.round((base * (0.6 + random())) / 100) * 100;
        const pix = Math.round((base * random() * 0.6) / 100) * 100;
        docs.push({
          projetoId: projeto._id,
          equipeId: equipe._id,
          membroId,
          data: hoje,
          dinheiroCents: dinheiro,
          pixCents: pix,
          despesasCents: 0,
          liquidoCents: liquido(dinheiro, pix, 0),
          itens: Math.round(random() * 10),
          contatos: Math.round(random() * 20),
          observacoes: "",
          estado: "enviado",
          enviadoEm: new Date(),
        });
      }
    }
    if (docs.length > 0) {
      await HjRelatorio.insertMany(docs);
      relatorios += docs.length;
    }
  }

  // One returned report for Ana to correct, with a reason.
  if (diasPassados.length > 0) {
    await HjRelatorio.updateOne(
      { membroId: ids.get("ana.membro"), data: diasPassados[diasPassados.length - 1] },
      {
        $set: {
          estado: "devolvido",
          motivoDevolucao: "O pix de R$ 180 entrou na conta da equipe, não no seu — confere?",
          validadoPorId: ids.get("bia.capita"),
          validadoEm: new Date(),
        },
      },
    );
  }

  // Guests across the journey: Ana's hand-picked set, then one to three
  // for about half of everyone else.
  type GuestSpec = { owner: string; nome: string; etapa: ConvidadoEtapa; conferencias?: number; diasAtras: number; gatewayAtras?: number; ficha?: boolean; cidade?: string };
  const guests: GuestSpec[] = [
    { owner: "ana.membro", nome: "João Martins", etapa: "pre_gateway", diasAtras: 8 },
    { owner: "ana.membro", nome: "Carla Pinto", etapa: "gateway", diasAtras: 3, gatewayAtras: 16, ficha: true },
    { owner: "ana.membro", nome: "Rafael Freitas", etapa: "gateway", diasAtras: 2, gatewayAtras: 5, ficha: false },
    { owner: "ana.membro", nome: "Marina Lopes", etapa: "sistema1", conferencias: 7, diasAtras: 1, gatewayAtras: 40, ficha: true },
    { owner: "ana.membro", nome: "Tiago Ramos", etapa: "sistema1", conferencias: 16, diasAtras: 4, gatewayAtras: 90, ficha: true },
    { owner: "ana.membro", nome: "Paula Nunes", etapa: "sistema2", diasAtras: 6, gatewayAtras: 150, ficha: true },
    { owner: "ana.membro", nome: "Vitor Hugo", etapa: "jardim", diasAtras: 20, gatewayAtras: 300, ficha: true },
    { owner: "bia.capita", nome: "Renata Alves", etapa: "sistema1", conferencias: 3, diasAtras: 2, gatewayAtras: 20, ficha: true },
    { owner: "bia.capita", nome: "Eduardo Sato", etapa: "pre_gateway", diasAtras: 1 },
  ];
  const ETAPAS: ConvidadoEtapa[] = ["pre_gateway", "pre_gateway", "gateway", "gateway", "sistema1", "sistema1", "sistema1", "sistema2", "jardim"];
  for (const team of teams) {
    for (const member of team.membros) {
      if (member.email === "ana.membro" || member.email === "bia.capita" || random() < 0.5) continue;
      const count = 1 + Math.floor(random() * 3);
      for (let i = 0; i < count; i += 1) {
        const etapa = pick(ETAPAS);
        const gatewayAtras = etapa === "pre_gateway" ? undefined : etapa === "gateway" ? 2 + Math.floor(random() * 20) : etapa === "sistema1" ? 20 + Math.floor(random() * 80) : etapa === "sistema2" ? 120 + Math.floor(random() * 80) : 250 + Math.floor(random() * 100);
        guests.push({
          owner: member.email,
          nome: `${pick(FIRST)} ${pick(LAST)}`,
          etapa,
          conferencias: etapa === "sistema1" ? 1 + Math.floor(random() * 15) : etapa === "sistema2" || etapa === "jardim" ? 16 : 0,
          diasAtras: Math.floor(random() * (random() < 0.25 ? 30 : 7)),
          gatewayAtras,
          ficha: etapa !== "pre_gateway" && random() < 0.85,
          cidade: member.cidade,
        });
      }
    }
  }

  for (const guest of guests) {
    const ultimoContato = addDays(hoje, -guest.diasAtras);
    const gateway = guest.gatewayAtras !== undefined ? addDays(hoje, -guest.gatewayAtras) : null;
    const primeiroContato = addDays(gateway ?? ultimoContato, -7);
    const doc = await HjConvidado.create({
      responsavelId: ids.get(guest.owner),
      nome: guest.nome,
      telefone: `+55 11 9${String(Math.round(random() * 99999999)).padStart(8, "0")}`,
      cidade: guest.cidade ?? "São Paulo",
      origem: pick(["Rua", "Amigo de membro", "Evento", "Instagram"]),
      etapa: guest.etapa,
      conferencias: guest.conferencias ?? 0,
      ultimoContato,
      proximoObjetivo: guest.etapa === "pre_gateway" ? "Combinar o Gateway" : "",
      notas: "",
      datas: {
        primeiroContato,
        gateway,
        fichaAssinada: guest.ficha && gateway ? addDays(gateway, 1) : null,
        inicioSistema1: ["sistema1", "sistema2", "jardim"].includes(guest.etapa) && gateway ? addDays(gateway, 7) : null,
        fimSistema1: ["sistema2", "jardim"].includes(guest.etapa) && gateway ? addDays(gateway, 120) : null,
        inicioSistema2: ["sistema2", "jardim"].includes(guest.etapa) && gateway ? addDays(gateway, 125) : null,
        jardim: guest.etapa === "jardim" && gateway ? addDays(gateway, 280) : null,
      },
    });
    const events: { tipo: string; texto: string; data: string }[] = [{ tipo: "contato", texto: "Primeiro contato", data: primeiroContato }];
    if (gateway) events.push({ tipo: "gateway", texto: "Participou do Gateway", data: gateway });
    if (guest.ficha && gateway) events.push({ tipo: "ficha", texto: "Ficha assinada", data: addDays(gateway, 1) });
    for (let n = 1; n <= (guest.conferencias ?? 0) && gateway; n += 1) {
      events.push({ tipo: "conferencia", texto: `Conferência ${n} de 16`, data: addDays(gateway, 7 + n * 5) });
    }
    events.push({ tipo: "contato", texto: pick(["Conversa por WhatsApp", "Visita", "Ligação"]), data: ultimoContato });
    await HjAcontecimento.insertMany(events.map((event) => ({ convidadoId: doc._id, autorId: ids.get(guest.owner), ...event })));
  }

  const membros = teams.reduce((sum, team) => sum + team.membros.length, 0);
  console.log(`Painel demo pronto: projeto "${projeto.nome}", ${teams.length} equipes, ${membros} membros, ${EDUCADORES.length} educadores, ${PASTORES.length} pastores, ${relatorios} relatórios, ${guests.length} convidados.`);
  console.log(`Senha das contas do painel: ${PASSWORD}`);
  for (const person of [...EDUCADORES, NAMED_HJA_01[0], NAMED_HJA_01[1]]) {
    console.log(`  ${person.email}@${DEMO_DOMAIN}  (${person.admin ? "administrador" : person.role === "tutor" ? "educador" : person.email.includes("capit") ? "capitã" : "membro"})`);
  }
  console.log(`  pastor.teste@${DEMO_DOMAIN}  (pastor, senha teste123); os outros pastores usam ${PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
