import { Types } from "mongoose";

import { ref, usersById, type EquipeDoc, type UserDoc } from "@/lib/hj/data";
import type { OrientacaoModulo, OrientacaoRow } from "@/lib/hj/types";
import { HjOrientacao } from "@/models/hj-orientacao";

export type OrientacaoDoc = {
  _id: Types.ObjectId;
  modulo: OrientacaoModulo;
  equipeId: Types.ObjectId | null;
  membroId: Types.ObjectId | null;
  texto: string;
  data: string;
  autorId: Types.ObjectId;
  createdAt: Date;
};

export function orientacaoRow(doc: OrientacaoDoc, users: Map<string, UserDoc>, equipes: Map<string, EquipeDoc>): OrientacaoRow {
  const equipe = doc.equipeId ? equipes.get(String(doc.equipeId)) : undefined;
  return {
    id: doc._id.toString(),
    modulo: doc.modulo,
    equipe: equipe ? { id: equipe._id.toString(), nome: equipe.nome } : doc.equipeId ? { id: String(doc.equipeId), nome: "—" } : null,
    membro: doc.membroId ? { id: String(doc.membroId), nome: users.get(String(doc.membroId))?.fullName ?? "—" } : null,
    texto: doc.texto,
    data: doc.data,
    autor: ref(users.get(String(doc.autorId))) ?? { id: String(doc.autorId), nome: "—" },
    criadaEm: doc.createdAt.toISOString(),
  };
}

// The latest orientation per team (modulo testemunho) for a set of teams.
export async function ultimasDasEquipes(equipes: EquipeDoc[], modulo: OrientacaoModulo = "testemunho") {
  const docs = (await HjOrientacao.find({ modulo, equipeId: { $in: equipes.map((equipe) => equipe._id) } })
    .sort({ data: -1, createdAt: -1 })
    .lean()) as unknown as OrientacaoDoc[];
  const latest = new Map<string, OrientacaoDoc>();
  for (const doc of docs) {
    const key = String(doc.equipeId);
    if (!latest.has(key)) latest.set(key, doc);
  }
  const users = await usersById([...latest.values()].map((doc) => doc.autorId));
  const byId = new Map(equipes.map((equipe) => [equipe._id.toString(), equipe]));
  return new Map([...latest.entries()].map(([key, doc]) => [key, orientacaoRow(doc, users, byId)]));
}

// The latest "meta interna" per member for a set of members. The meta
// interna is the member's, not the project's: it is given in the RM and
// during the testimony drive alike (Victor, 23/11/2026), so the latest one
// wins whatever phase it was given in. `modulo` narrows it to one phase.
export async function ultimasDosMembros(membroIds: Iterable<Types.ObjectId | string>, modulo?: OrientacaoModulo) {
  const ids = [...new Set([...membroIds].map(String))].map((id) => new Types.ObjectId(id));
  if (ids.length === 0) {
    return new Map<string, OrientacaoRow>();
  }
  const docs = (await HjOrientacao.find({ ...(modulo ? { modulo } : {}), membroId: { $in: ids } }).sort({ data: -1, createdAt: -1 }).lean()) as unknown as OrientacaoDoc[];
  const latest = new Map<string, OrientacaoDoc>();
  for (const doc of docs) {
    const key = String(doc.membroId);
    if (!latest.has(key)) latest.set(key, doc);
  }
  const users = await usersById([...latest.values()].flatMap((doc) => [doc.autorId, doc.membroId!]));
  return new Map([...latest.entries()].map(([key, doc]) => [key, orientacaoRow(doc, users, new Map())]));
}
