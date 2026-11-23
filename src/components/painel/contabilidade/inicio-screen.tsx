"use client";

import { ArrowRight, Banknote, Plus, Scale, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Card, Eyebrow, Stat } from "@/components/painel/bits";
import { PainelHeading } from "@/components/painel/painel-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fmtMes,
  fmtMoeda,
  MEIO_NOME,
  MOEDA_ORDEM,
  MOEDAS,
  mesDe,
  parseValor,
  porCategoria,
  resumo,
  saldoDe,
  saldos,
  somaMes,
  valorParaCampo,
  type Meio,
  type Moeda,
  type Saldo,
} from "@/lib/hj/contabilidade";
import { INICIO_DEMO } from "@/lib/hj/contabilidade-mock";
import { cn } from "@/lib/utils";

import { Colunas, dobrar, Rosca } from "./charts";
import { LinhaMovimento } from "./linha";
import { corEntrada, MesStepper, MoedaPills, Segmentado, Vazio } from "./pieces";
import { atualizarEstado, useContabilidade } from "./store";

export function InicioScreen() {
  const { escopoNome, combinado, doEscopo, movimentos, moedas, hoje, base, categoria, setEscopo } = useContabilidade();
  const [mes, setMes] = useState(mesDe(hoje));
  const [moedaEscolhida, setMoeda] = useState<Moeda>("BRL");
  const [ajuste, setAjuste] = useState<Saldo | null>(null);
  const moeda = moedas.includes(moedaEscolhida) ? moedaEscolhida : "BRL";

  const caixas = useMemo(() => saldos(movimentos, moedas), [movimentos, moedas]);
  const doMes = useMemo(() => resumo(movimentos, moeda, (dia) => mesDe(dia) === mes), [movimentos, moeda, mes]);
  const fatias = useMemo(
    () => dobrar(porCategoria(movimentos, "saida", moeda, (dia) => mesDe(dia) === mes, categoria)),
    [movimentos, moeda, mes, categoria],
  );
  const meses = useMemo(() => [-5, -4, -3, -2, -1, 0].map((n) => somaMes(mes, n)), [mes]);
  const porMes = useMemo(() => meses.map((item) => resumo(movimentos, moeda, (dia) => mesDe(dia) === item)), [meses, movimentos, moeda]);

  const equipes = useMemo(
    () =>
      combinado
        ? doEscopo.map((projeto) => {
            const seus = movimentos.filter((mov) => mov.projetoId === projeto.id);
            return {
              projeto,
              mes: resumo(seus, moeda, (dia) => mesDe(dia) === mes),
              saldo: saldoDe(seus, moeda).total,
            };
          })
        : [],
    [combinado, doEscopo, movimentos, moeda, mes],
  );

  const unico = combinado ? null : doEscopo[0];
  const faltam = MOEDA_ORDEM.filter((item) => !moedas.includes(item));
  const descricao = combinado
    ? `${doEscopo.length} contabilidades juntas. Os saldos e os movimentos abaixo somam todas elas; cada moeda tem o seu saldo.`
    : unico?.tipo === "geral"
      ? "O caixa central do projeto: o que não pertence a uma equipe só."
      : [unico?.programa, unico?.capitao ? `Capitão: ${unico.capitao}` : null, unico?.educador ? `Educador: ${unico.educador}` : null]
          .filter(Boolean)
          .join(" · ");

  function adicionarMoeda(nova: Moeda) {
    if (!unico) {
      return;
    }
    atualizarEstado((estado) => ({ ...estado, moedas: { ...estado.moedas, [unico.id]: [...(estado.moedas[unico.id] ?? []), nova] } }));
    toast.success(`${MOEDAS[nova].nome} adicionado a ${unico.nome}`);
  }

  return (
    <div className="space-y-8">
      <PainelHeading eyebrow="Contabilidade" title={escopoNome} description={descricao} />

      <section aria-labelledby="saldos-titulo" className="!mt-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="saldos-titulo" className="font-display text-xl font-semibold text-primary-deep">
            Saldos
          </h2>
          {unico && faltam.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="rounded-full text-primary">
                  <Plus className="h-4 w-4" aria-hidden />
                  Adicionar moeda
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {faltam.map((item) => (
                  <DropdownMenuItem key={item} onSelect={() => adicionarMoeda(item)} className="gap-2">
                    <span className="w-8 text-xs font-semibold text-muted-foreground">{MOEDAS[item].simbolo}</span>
                    {MOEDAS[item].nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {caixas.map((caixa) => (
            <Card key={caixa.moeda} className="!p-5">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow>{MOEDAS[caixa.moeda].nome}</Eyebrow>
                {unico ? (
                  <button
                    type="button"
                    onClick={() => setAjuste(caixa)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep"
                  >
                    <Scale className="h-3.5 w-3.5" aria-hidden />
                    Ajustar
                  </button>
                ) : null}
              </div>
              <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", caixa.total < 0 ? "text-destructive" : "text-primary-deep")}>
                {fmtMoeda(caixa.total, caixa.moeda)}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5" aria-hidden />
                    Dinheiro
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{fmtMoeda(caixa.dinheiro, caixa.moeda)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Smartphone className="h-3.5 w-3.5" aria-hidden />
                    Pix / conta
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{fmtMoeda(caixa.conta, caixa.moeda)}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Resumo do mês" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <MesStepper mes={mes} onChange={setMes} min={mesDe(INICIO_DEMO)} max={mesDe(hoje)} />
          <MoedaPills moedas={moedas} value={moeda} onChange={setMoeda} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Entradas" value={<span className={corEntrada}>{fmtMoeda(doMes.entradas, moeda)}</span>} />
          <Stat label="Saídas" value={fmtMoeda(doMes.saidas, moeda)} />
          <Stat label="Balanço do mês" value={fmtMoeda(doMes.balanco, moeda, { sinal: true })} hint={doMes.balanco < 0 ? "Saiu mais do que entrou" : doMes.balanco > 0 ? "Entrou mais do que saiu" : doMes.entradas ? "Entrou o mesmo que saiu" : "Sem movimentos no mês"} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold text-primary-deep">Balanço mensal</h2>
          <p className="mb-4 text-sm text-muted-foreground">Entradas e saídas dos últimos seis meses, em {MOEDAS[moeda].nome.toLowerCase()}.</p>
          <Colunas
            rotulos={meses.map((item) => fmtMes(item, "curto"))}
            dicas={meses.map((item) => fmtMes(item))}
            moeda={moeda}
            series={[
              { nome: "Entradas", cor: "var(--viz-in)", valores: porMes.map((item) => item.entradas) },
              { nome: "Saídas", cor: "var(--viz-out)", valores: porMes.map((item) => item.saidas) },
            ]}
            rodape={(index) => ({ nome: "Balanço", valor: fmtMoeda(porMes[index].balanco, moeda, { sinal: true }) })}
          />
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold text-primary-deep">Gastos por categoria</h2>
          <p className="mb-4 text-sm text-muted-foreground">{fmtMes(mes)}</p>
          {fatias.length ? <Rosca fatias={fatias} moeda={moeda} rotulo="Gastos" /> : <Vazio titulo="Nenhum gasto neste mês" />}
        </Card>
      </div>

      {combinado ? (
        <Card>
          <h2 className="font-display text-xl font-semibold text-primary-deep">Por equipe</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {fmtMes(mes)}, em {MOEDAS[moeda].nome.toLowerCase()}. Toque numa equipe para abrir só a contabilidade dela.
          </p>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-2 py-2 font-bold">Equipe</th>
                  <th className="hidden px-2 py-2 text-right font-bold sm:table-cell">Entradas</th>
                  <th className="hidden px-2 py-2 text-right font-bold sm:table-cell">Saídas</th>
                  <th className="px-2 py-2 text-right font-bold">Balanço</th>
                  <th className="px-2 py-2 text-right font-bold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {equipes.map((item) => (
                  <tr key={item.projeto.id} onClick={() => setEscopo(item.projeto.id)} className="cursor-pointer transition-colors hover:bg-muted/60">
                    <td className="px-2 py-3">
                      <button type="button" className="cursor-pointer text-left font-semibold text-primary-deep">
                        {item.projeto.nome}
                      </button>
                      <span className="block text-xs text-muted-foreground">
                        {[item.projeto.area, item.projeto.capitao].filter(Boolean).join(" · ") || (item.projeto.tipo === "geral" ? "Caixa central" : item.projeto.programa)}
                      </span>
                    </td>
                    <td className={cn("hidden px-2 py-3 text-right tabular-nums sm:table-cell", corEntrada)}>{fmtMoeda(item.mes.entradas, moeda)}</td>
                    <td className="hidden px-2 py-3 text-right tabular-nums sm:table-cell">{fmtMoeda(item.mes.saidas, moeda)}</td>
                    <td className="px-2 py-3 text-right font-medium tabular-nums">{fmtMoeda(item.mes.balanco, moeda, { sinal: true })}</td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums text-primary-deep">{fmtMoeda(item.saldo, moeda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-primary-deep">Recentes</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-primary">
            <Link href={`${base}/movimentos`}>
              Ver tudo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
        {movimentos.length ? (
          <ul className="mt-1 divide-y divide-border/60">
            {movimentos.slice(0, 6).map((mov) => (
              <LinhaMovimento key={mov.id} mov={mov} />
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <Vazio titulo="Nenhum movimento ainda">Use “Novo” ou o assistente para lançar o primeiro.</Vazio>
          </div>
        )}
      </Card>

      {ajuste && unico ? <AjusteDialog key={ajuste.moeda} saldo={ajuste} projetoId={unico.id} onClose={() => setAjuste(null)} /> : null}
    </div>
  );
}

// "Contei o caixa e não bate": a pessoa diz quanto tem de verdade e a
// diferença entra como um movimento de ajuste, à vista de todos.
function AjusteDialog({ saldo, projetoId, onClose }: { saldo: Saldo; projetoId: string; onClose: () => void }) {
  const { salvar, eu, hoje } = useContabilidade();
  const [meio, setMeio] = useState<Meio>("dinheiro");
  const atual = saldo[meio];
  const [texto, setTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  // o caixa pode estar no vermelho: "-50" é um saldo real de menos cinquenta
  const zero = /^\s*[-−]?\s*0+([.,]0+)?\s*$/.test(texto);
  const lido = zero ? 0 : parseValor(texto, saldo.moeda);
  const real = lido !== null && /^\s*[-−]/.test(texto) ? -lido : lido;
  const diferenca = real === null ? null : real - atual;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!diferenca) {
      return;
    }
    salvar({
      projetoId,
      tipo: "ajuste",
      valorMinor: diferenca,
      moeda: saldo.moeda,
      meio,
      categoriaId: null,
      data: hoje,
      descricao: motivo.trim() || "Ajuste de saldo",
      responsavel: eu.nome,
      origem: "manual",
      pendente: false,
      comprovante: null,
    });
    toast.success("Saldo ajustado");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar saldo em {MOEDAS[saldo.moeda].nome.toLowerCase()}</DialogTitle>
          <DialogDescription>Diga quanto há de verdade. A diferença entra como um ajuste na lista de movimentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Segmentado
            full
            label="Onde"
            value={meio}
            onChange={setMeio}
            options={[
              { value: "dinheiro", label: MEIO_NOME.dinheiro },
              { value: "conta", label: MEIO_NOME.conta },
            ]}
          />
          <p className="text-sm text-muted-foreground">
            Saldo no sistema: <span className="font-semibold tabular-nums text-foreground">{fmtMoeda(atual, saldo.moeda)}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="ajuste-real">Saldo real ({MOEDAS[saldo.moeda].simbolo})</Label>
            <Input id="ajuste-real" inputMode="decimal" placeholder={valorParaCampo(Math.max(atual, 0), saldo.moeda)} value={texto} onChange={(event) => setTexto(event.target.value)} className="h-11 rounded-xl text-base tabular-nums" />
            {diferenca !== null ? (
              <p className="text-sm text-muted-foreground">
                {diferenca === 0 ? "Igual ao sistema: não há o que ajustar." : <>Ajuste de <span className="font-semibold tabular-nums text-foreground">{fmtMoeda(diferenca, saldo.moeda, { sinal: true })}</span></>}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ajuste-motivo">Motivo (opcional)</Label>
            <Input id="ajuste-motivo" value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ex.: troco que não foi lançado" className="h-11 rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!diferenca}>
              Ajustar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
