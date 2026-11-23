import type { AreasTree } from "@/lib/hj/areas";
import { countsAsResult, type EquipeDoc, type RelatorioDoc } from "@/lib/hj/data";
import type { ArrecadacaoAreaLinha, ArrecadacaoPorArea } from "@/lib/hj/types";

export const SEM_AREA = "sem_area";

type Soma = Omit<ArrecadacaoAreaLinha, "mediaCents" | "participacao"> & { membroIds: Set<string> };

const vazia = (id: string, nome: string, regiao: string | null): Soma => ({
  id,
  nome,
  regiao,
  equipes: 0,
  membros: 0,
  relatorios: 0,
  dinheiroCents: 0,
  pixCents: 0,
  despesasCents: 0,
  liquidoCents: 0,
  membroIds: new Set(),
});

// The RM numbers by region and by country (Wang Song, 23/11/2026). A team
// belongs to the country and region of its local (Organização › Áreas);
// teams with no local are one "Sem área definida" row in both tables.
// Only the teams and reports given count, so the caller's filters hold.
export function arrecadacaoPorArea(
  equipes: EquipeDoc[],
  relatorios: RelatorioDoc[],
  areas: AreasTree,
  semAreaNome: string,
  membrosDaEquipe: (equipe: EquipeDoc) => string[] = (equipe) => equipe.membroIds.map(String),
): ArrecadacaoPorArea {
  const regioes = new Map<string, Soma>();
  const paises = new Map<string, Soma>();
  const total = vazia("total", "Total", null);
  const ondeEsta = new Map<string, { regiao: Soma; pais: Soma }>();

  for (const equipe of equipes) {
    const area = areas.daEquipe(equipe.areaId);
    const regiaoId = area?.regiao?.id ?? SEM_AREA;
    const paisId = area?.pais?.id ?? SEM_AREA;
    const regiao = regioes.get(regiaoId) ?? vazia(regiaoId, area?.regiao?.nome ?? semAreaNome, null);
    const pais = paises.get(paisId) ?? vazia(paisId, area?.pais?.nome ?? semAreaNome, area?.pais ? (area.regiao?.nome ?? null) : null);
    regioes.set(regiaoId, regiao);
    paises.set(paisId, pais);
    const membros = membrosDaEquipe(equipe);
    for (const soma of [regiao, pais, total]) {
      soma.equipes += 1;
      for (const id of membros) soma.membroIds.add(id);
    }
    ondeEsta.set(equipe._id.toString(), { regiao, pais });
  }

  for (const item of relatorios) {
    const onde = ondeEsta.get(String(item.equipeId));
    if (!onde || !countsAsResult(item.estado)) continue;
    for (const soma of [onde.regiao, onde.pais, total]) {
      soma.relatorios += 1;
      soma.dinheiroCents += item.dinheiroCents;
      soma.pixCents += item.pixCents;
      soma.despesasCents += item.despesasCents;
      soma.liquidoCents += item.liquidoCents;
    }
  }

  const linha = ({ membroIds, ...soma }: Soma): ArrecadacaoAreaLinha => ({
    ...soma,
    membros: membroIds.size,
    mediaCents: soma.relatorios > 0 ? Math.round(soma.liquidoCents / soma.relatorios) : 0,
    participacao: total.liquidoCents > 0 ? soma.liquidoCents / total.liquidoCents : 0,
  });
  // the order of Organização › Áreas; "Sem área definida" last
  const ordem = new Map(areas.docs.map((doc, index) => [doc._id.toString(), index]));
  const regiaoDoPais = (id: string) => {
    const doc = areas.byId.get(id);
    return doc?.paiId ? (ordem.get(doc.paiId.toString()) ?? 0) : 0;
  };
  const porOrdem = (porRegiao: boolean) => (a: Soma, b: Soma) =>
    Number(a.id === SEM_AREA) - Number(b.id === SEM_AREA) ||
    (porRegiao ? regiaoDoPais(a.id) - regiaoDoPais(b.id) : 0) ||
    (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0) ||
    a.nome.localeCompare(b.nome, "pt");

  return {
    regioes: [...regioes.values()].sort(porOrdem(false)).map(linha),
    paises: [...paises.values()].sort(porOrdem(true)).map(linha),
    total: linha(total),
  };
}
