import fs from "node:fs";
import path from "node:path";
import { Types } from "mongoose";

import { addDays, daysBetween, todayInBrazil } from "@/lib/hj/dates";
import { liquido } from "@/lib/hj/rm";
import { hashPassword } from "@/lib/password";
import { AcademyUser } from "@/models/academy-user";
import { HjAcontecimento, HjConvidado } from "@/models/hj-convidado";
import { HjEquipe } from "@/models/hj-equipe";
import { HjProjeto } from "@/models/hj-projeto";
import { HjRelatorio } from "@/models/hj-relatorio";

// `npm run seed:painel`: a demo HJ Team — one RM project running today,
// four teams across three programs, reports for the days gone by, guests
// on every stage of the journey, and one account per role to sign in with.
// Re-running wipes the `hj_*` collections and the demo accounts and builds
// them again, so the demo always starts from the same place.
//
// Accounts (password for all: SEED_PAINEL_PASSWORD or "painel123"):
//   ana.membro@purewaterwave.test      member of Equipe 01 – HJA
//   bia.capita@purewaterwave.test      captain of Equipe 01 – HJA
//   david.educador@purewaterwave.test  educator of the HJA teams
//   yeseong.admin@purewaterwave.test   administrator (and educator of PW)

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

type Person = { email: string; nome: string; role: "student" | "tutor"; admin?: boolean; cidade?: string };

const EDUCADORES: Person[] = [
  { email: "david.educador", nome: "David Lima", role: "tutor", cidade: "São Paulo" },
  { email: "yeseong.admin", nome: "Yeseong Robert", role: "tutor", admin: true, cidade: "São Paulo" },
  { email: "marcos.educador", nome: "Marcos Tanaka", role: "tutor", cidade: "Campinas" },
];

const MEMBROS: Record<string, Person[]> = {
  "Equipe 01 – HJA": [
    { email: "bia.capita", nome: "Bia Souza", role: "student", cidade: "São Paulo" },
    { email: "ana.membro", nome: "Ana Silva", role: "student", cidade: "São Paulo" },
    { email: "carlos.membro", nome: "Carlos Pereira", role: "student", cidade: "Guarulhos" },
    { email: "julia.membro", nome: "Júlia Nakamura", role: "student", cidade: "São Paulo" },
    { email: "pedro.membro", nome: "Pedro Alves", role: "student", cidade: "Osasco" },
    { email: "luana.membro", nome: "Luana Costa", role: "student", cidade: "São Paulo" },
  ],
  "Equipe 02 – HJA": [
    { email: "rafael.capitao", nome: "Rafael Moreira", role: "student", cidade: "São Paulo" },
    { email: "camila.membro", nome: "Camila Rocha", role: "student", cidade: "Santo André" },
    { email: "thiago.membro", nome: "Thiago Kim", role: "student", cidade: "São Paulo" },
    { email: "beatriz.membro", nome: "Beatriz Lopes", role: "student", cidade: "São Paulo" },
    { email: "gabriel.membro", nome: "Gabriel Santos", role: "student", cidade: "Diadema" },
  ],
  "Equipe 01 – HJR": [
    { email: "mariana.capita", nome: "Mariana Ferreira", role: "student", cidade: "Campinas" },
    { email: "lucas.membro", nome: "Lucas Oliveira", role: "student", cidade: "Campinas" },
    { email: "sofia.membro", nome: "Sofia Martins", role: "student", cidade: "Jundiaí" },
    { email: "daniel.membro", nome: "Daniel Park", role: "student", cidade: "Campinas" },
    { email: "helena.membro", nome: "Helena Dias", role: "student", cidade: "Campinas" },
    { email: "bruno.membro", nome: "Bruno Carvalho", role: "student", cidade: "Valinhos" },
    { email: "isabela.membro", nome: "Isabela Ramos", role: "student", cidade: "Campinas" },
  ],
  "Equipe 01 – PW": [
    { email: "felipe.capitao", nome: "Felipe Araújo", role: "student", cidade: "Curitiba" },
    { email: "laura.membro", nome: "Laura Mendes", role: "student", cidade: "Curitiba" },
    { email: "mateus.membro", nome: "Mateus Ribeiro", role: "student", cidade: "Curitiba" },
    { email: "clara.membro", nome: "Clara Yamamoto", role: "student", cidade: "Londrina" },
  ],
};

const EQUIPES: { nome: string; programa: "HJA" | "HJR" | "PW"; educador: string }[] = [
  { nome: "Equipe 01 – HJA", programa: "HJA", educador: "david.educador" },
  { nome: "Equipe 02 – HJA", programa: "HJA", educador: "david.educador" },
  { nome: "Equipe 01 – HJR", programa: "HJR", educador: "marcos.educador" },
  { nome: "Equipe 01 – PW", programa: "PW", educador: "yeseong.admin" },
];

// Deterministic "random": the same demo every time.
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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

  // Start clean.
  await Promise.all([
    HjProjeto.deleteMany({}),
    HjEquipe.deleteMany({}),
    HjRelatorio.deleteMany({}),
    HjConvidado.deleteMany({}),
    HjAcontecimento.deleteMany({}),
    AcademyUser.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN.replace(".", "\\.")}$`), login: { $not: /^(tutor|aluno|hjteam\.teste|pastor\.teste)@/ } }),
  ]);

  const hash = await hashPassword(PASSWORD);
  const ids = new Map<string, Types.ObjectId>();
  const people = [...EDUCADORES, ...Object.values(MEMBROS).flat()];
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
          city: person.cidade ?? "",
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
  const prevInicio = addDays(inicio, -1).slice(0, 8) + "01";
  const prevFim = addDays(inicio, -1);
  await HjProjeto.create({
    nome: `RM 30 dias – anterior`,
    tipo: "arrecadacao",
    inicio: prevInicio,
    fim: prevFim,
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

  const random = rng(20261106);
  const dias = daysBetween(inicio, hoje).filter((dia) => !descanso.includes(dia));
  const diasPassados = dias.filter((dia) => dia < hoje);

  for (const team of EQUIPES) {
    const membros = MEMBROS[team.nome];
    const equipe = await HjEquipe.create({
      projetoId: projeto._id,
      nome: team.nome,
      programa: team.programa,
      educadorId: ids.get(team.educador),
      capitaoId: ids.get(membros[0].email),
      membroIds: membros.map((member) => ids.get(member.email)),
    });

    for (const [index, member] of membros.entries()) {
      const membroId = ids.get(member.email)!;
      const base = 25000 + Math.round(random() * 40000);
      for (const dia of diasPassados) {
        // Not everyone sends every day.
        if (random() < 0.12) continue;
        const dinheiro = Math.round((base * (0.5 + random())) / 100) * 100;
        const pix = Math.round((base * random() * 0.8) / 100) * 100;
        const despesas = random() < 0.3 ? Math.round((random() * 4000) / 100) * 100 : 0;
        const old = dia < addDays(hoje, -2);
        await HjRelatorio.create({
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
          observacoes: random() < 0.15 ? "Dia de chuva, menos gente na rua" : "",
          estado: old ? "validado" : random() < 0.8 ? "enviado" : "devolvido",
          motivoDevolucao: "",
          enviadoEm: new Date(`${dia}T21:30:00-03:00`),
          validadoPorId: old ? ids.get(membros[0].email) : null,
          validadoEm: old ? new Date(`${dia}T22:10:00-03:00`) : null,
        });
      }
      // Today: the captain and a couple of members already sent; Ana did not.
      if (index !== 1 && random() < 0.5) {
        const dinheiro = Math.round((base * (0.6 + random())) / 100) * 100;
        const pix = Math.round((base * random() * 0.6) / 100) * 100;
        await HjRelatorio.create({
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
  }
  // One returned report for Ana to correct, with a reason.
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

  // Guests across the journey.
  const guests: {
    owner: string;
    nome: string;
    etapa: "pre_gateway" | "gateway" | "sistema1" | "sistema2" | "jardim";
    conferencias?: number;
    diasAtras: number; // last contact
    gatewayAtras?: number;
    ficha?: boolean;
    cidade?: string;
  }[] = [
    { owner: "ana.membro", nome: "João Martins", etapa: "pre_gateway", diasAtras: 8, cidade: "São Paulo" },
    { owner: "ana.membro", nome: "Carla Pinto", etapa: "gateway", diasAtras: 3, gatewayAtras: 16, ficha: true },
    { owner: "ana.membro", nome: "Rafael Freitas", etapa: "gateway", diasAtras: 2, gatewayAtras: 5, ficha: false },
    { owner: "ana.membro", nome: "Marina Lopes", etapa: "sistema1", conferencias: 7, diasAtras: 1, gatewayAtras: 40, ficha: true },
    { owner: "ana.membro", nome: "Tiago Ramos", etapa: "sistema1", conferencias: 16, diasAtras: 4, gatewayAtras: 90, ficha: true },
    { owner: "ana.membro", nome: "Paula Nunes", etapa: "sistema2", diasAtras: 6, gatewayAtras: 150, ficha: true },
    { owner: "ana.membro", nome: "Vitor Hugo", etapa: "jardim", diasAtras: 20, gatewayAtras: 300, ficha: true },
    { owner: "bia.capita", nome: "Renata Alves", etapa: "sistema1", conferencias: 3, diasAtras: 2, gatewayAtras: 20, ficha: true },
    { owner: "bia.capita", nome: "Eduardo Sato", etapa: "pre_gateway", diasAtras: 1 },
    { owner: "carlos.membro", nome: "Fernanda Gomes", etapa: "gateway", diasAtras: 10, gatewayAtras: 12, ficha: false },
    { owner: "julia.membro", nome: "Igor Batista", etapa: "sistema1", conferencias: 12, diasAtras: 25, gatewayAtras: 60, ficha: true },
    { owner: "camila.membro", nome: "Aline Castro", etapa: "pre_gateway", diasAtras: 0 },
    { owner: "lucas.membro", nome: "Henrique Mota", etapa: "sistema1", conferencias: 1, diasAtras: 5, gatewayAtras: 9, ficha: true },
    { owner: "laura.membro", nome: "Priscila Teles", etapa: "gateway", diasAtras: 4, gatewayAtras: 4, ficha: true },
    { owner: "felipe.capitao", nome: "Otávio Reis", etapa: "sistema2", diasAtras: 3, gatewayAtras: 200, ficha: true },
  ];

  for (const guest of guests) {
    const ultimoContato = addDays(hoje, -guest.diasAtras);
    const gateway = guest.gatewayAtras !== undefined ? addDays(hoje, -guest.gatewayAtras) : null;
    const primeiroContato = addDays(gateway ?? ultimoContato, -7);
    const doc = await HjConvidado.create({
      responsavelId: ids.get(guest.owner),
      nome: guest.nome,
      telefone: `+55 11 9${String(Math.round(random() * 99999999)).padStart(8, "0")}`,
      cidade: guest.cidade ?? "São Paulo",
      origem: random() < 0.5 ? "Rua" : "Amigo de membro",
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
    const events: { tipo: string; texto: string; data: string }[] = [
      { tipo: "contato", texto: "Primeiro contato", data: primeiroContato },
    ];
    if (gateway) events.push({ tipo: "gateway", texto: "Participou do Gateway", data: gateway });
    if (guest.ficha && gateway) events.push({ tipo: "ficha", texto: "Ficha assinada", data: addDays(gateway, 1) });
    for (let n = 1; n <= (guest.conferencias ?? 0) && gateway; n += 1) {
      events.push({ tipo: "conferencia", texto: `Conferência ${n} de 16`, data: addDays(gateway, 7 + n * 5) });
    }
    events.push({ tipo: "contato", texto: "Conversa por WhatsApp", data: ultimoContato });
    await HjAcontecimento.insertMany(
      events.map((event) => ({ convidadoId: doc._id, autorId: ids.get(guest.owner), ...event })),
    );
  }

  console.log(`Painel demo pronto: projeto "${projeto.nome}", ${EQUIPES.length} equipes, ${people.length} contas, ${guests.length} convidados.`);
  console.log(`Senha de todas as contas: ${PASSWORD}`);
  for (const person of [...EDUCADORES, MEMBROS["Equipe 01 – HJA"][0], MEMBROS["Equipe 01 – HJA"][1]]) {
    console.log(`  ${person.email}@${DEMO_DOMAIN}  (${person.admin ? "administrador" : person.role === "tutor" ? "educador" : person.email.includes("capit") ? "capitã" : "membro"})`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
