"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { fmtMoeda, MOEDAS, type FatiaCategoria, type Moeda } from "@/lib/hj/contabilidade";
import { cn } from "@/lib/utils";

// Gráficos da Contabilidade, desenhados à mão em SVG: marcas finas, pontas
// arredondadas, 2px de respiro entre preenchimentos, texto sempre em tinta de
// texto (a cor fica na marca) e o valor ao passar o cursor.

export type Fatia = { id: string; nome: string; valor: number; cor: string; quantos: number };

// As categorias sem cor própria (as criadas pela equipe e "Outros") entram
// juntas numa fatia cinza, sempre por último.
export function dobrar(fatias: FatiaCategoria[]): Fatia[] {
  const coloridas = fatias
    .filter((fatia) => fatia.categoria.cor > 0)
    .map((fatia) => ({ id: fatia.categoria.id, nome: fatia.categoria.nome, valor: fatia.valor, cor: `var(--viz-${fatia.categoria.cor})`, quantos: fatia.quantos }));
  const cinzas = fatias.filter((fatia) => fatia.categoria.cor === 0);
  if (!cinzas.length) {
    return coloridas;
  }
  return [
    ...coloridas,
    {
      id: "outros",
      nome: cinzas.length === 1 ? cinzas[0].categoria.nome : "Outros",
      valor: cinzas.reduce((sum, fatia) => sum + fatia.valor, 0),
      cor: "var(--viz-0)",
      quantos: cinzas.reduce((sum, fatia) => sum + fatia.quantos, 0),
    },
  ];
}

export function fmtEixo(minor: number, moeda: Moeda) {
  const valor = minor / 10 ** MOEDAS[moeda].decimais;
  const texto = (numero: number, casas: number) => numero.toLocaleString("pt-BR", { maximumFractionDigits: casas });
  if (Math.abs(valor) >= 1_000_000) {
    return `${texto(valor / 1_000_000, 1)} mi`;
  }
  if (Math.abs(valor) >= 1_000) {
    return `${texto(valor / 1_000, 1)} mil`;
  }
  return texto(valor, 0);
}

const pct = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)}%` : "0%");

function useLargura() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      setLargura(Math.round(entries[0].contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, largura] as const;
}

function Ponto({ cor }: { cor: string }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: cor }} aria-hidden />;
}

function Dica({ x, y, largura, children }: { x: number; y: number; largura: number; children: ReactNode }) {
  // encosta na borda em vez de sair do gráfico
  const esquerda = Math.min(Math.max(x, 84), Math.max(84, largura - 84));
  return (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-[15rem] -translate-x-1/2 -translate-y-full rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
      style={{ left: esquerda, top: y }}
    >
      {children}
    </div>
  );
}

// ---- rosca ----------------------------------------------------------------

function arco(r0: number, r1: number, a0: number, a1: number) {
  const ponto = (raio: number, angulo: number) => `${(100 + raio * Math.sin(angulo)).toFixed(2)} ${(100 - raio * Math.cos(angulo)).toFixed(2)}`;
  const fim = Math.min(a1, a0 + Math.PI * 2 - 0.0001);
  const grande = fim - a0 > Math.PI ? 1 : 0;
  return `M${ponto(r1, a0)}A${r1} ${r1} 0 ${grande} 1 ${ponto(r1, fim)}L${ponto(r0, fim)}A${r0} ${r0} 0 ${grande} 0 ${ponto(r0, a0)}Z`;
}

export function Rosca({ fatias, moeda, rotulo }: { fatias: Fatia[]; moeda: Moeda; rotulo: string }) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const total = fatias.reduce((sum, fatia) => sum + fatia.valor, 0);
  const destaque = fatias.find((fatia) => fatia.id === ativa);
  const arcos = fatias.reduce<{ fatia: Fatia; de: number; ate: number }[]>((lista, fatia) => {
    const de = lista.length ? lista[lista.length - 1].ate : 0;
    return [...lista, { fatia, de, ate: de + (fatia.valor / total) * Math.PI * 2 }];
  }, []);

  return (
    // empilha quando o cartão é estreito: ao lado da rosca a legenda não cabe
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @lg:flex-row">
        <div className="relative h-48 w-48 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${rotulo}: ${fmtMoeda(total, moeda)}`}>
            {arcos.map(({ fatia, de, ate }) => (
              <path
                key={fatia.id}
                d={arco(64, 92, de, ate)}
                fill={fatia.cor}
                stroke="var(--card)"
                strokeWidth={2}
                opacity={ativa && ativa !== fatia.id ? 0.35 : 1}
                className="transition-opacity"
                onMouseEnter={() => setAtiva(fatia.id)}
                onMouseLeave={() => setAtiva(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center">
            <span className="line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-[0.06em] text-muted-foreground">{destaque ? destaque.nome : rotulo}</span>
            <span className="mt-0.5 font-display text-lg font-semibold leading-tight text-primary-deep tabular-nums">{fmtMoeda(destaque ? destaque.valor : total, moeda, { curto: total >= 10_000_000 })}</span>
            {destaque ? <span className="text-xs text-muted-foreground">{pct(destaque.valor, total)}</span> : null}
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-0.5">
          {fatias.map((fatia) => (
            <li
              key={fatia.id}
              className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors", ativa === fatia.id && "bg-muted")}
              onMouseEnter={() => setAtiva(fatia.id)}
              onMouseLeave={() => setAtiva(null)}
            >
              <Ponto cor={fatia.cor} />
              <span className="min-w-0 flex-1 leading-snug text-foreground">{fatia.nome}</span>
              <span className="shrink-0 font-medium tabular-nums text-foreground">{fmtMoeda(fatia.valor, moeda)}</span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{pct(fatia.valor, total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- barras por categoria -------------------------------------------------

export function BarrasCategoria({ fatias, moeda }: { fatias: Fatia[]; moeda: Moeda }) {
  const maior = Math.max(1, ...fatias.map((fatia) => fatia.valor));
  const total = fatias.reduce((sum, fatia) => sum + fatia.valor, 0);
  return (
    <ul className="space-y-3">
      {fatias.map((fatia) => (
        <li key={fatia.id} title={`${fatia.nome}: ${fmtMoeda(fatia.valor, moeda)} (${pct(fatia.valor, total)})`}>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="min-w-0 flex-1 leading-snug text-foreground">{fatia.nome}</span>
            <span className="font-medium tabular-nums text-foreground">{fmtMoeda(fatia.valor, moeda)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct(fatia.valor, total)}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full" style={{ width: `${Math.max(1.5, (fatia.valor / maior) * 100)}%`, backgroundColor: fatia.cor }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- colunas --------------------------------------------------------------

function degraus(maximo: number) {
  if (maximo <= 0) {
    return [0, 1];
  }
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((multiplo) => multiplo * potencia).find((candidato) => candidato >= bruto) ?? 10 * potencia;
  const quantos = Math.ceil(maximo / passo);
  return Array.from({ length: quantos + 1 }, (_, index) => index * passo);
}

// coluna com o topo arredondado, apoiada na linha de base
function coluna(x: number, y: number, largura: number, altura: number) {
  const raio = Math.min(4, largura / 2, altura);
  return `M${x} ${y + altura}V${y + raio}Q${x} ${y} ${x + raio} ${y}H${x + largura - raio}Q${x + largura} ${y} ${x + largura} ${y + raio}V${y + altura}Z`;
}

export type Serie = { nome: string; cor: string; valores: number[] };

export function Colunas({
  rotulos,
  dicas,
  series,
  moeda,
  altura = 240,
  rodape,
}: {
  rotulos: string[];
  // o título da dica de cada coluna, quando o rótulo do eixo é curto demais
  dicas?: string[];
  series: Serie[];
  moeda: Moeda;
  altura?: number;
  // uma linha a mais na dica (o balanço do mês)
  rodape?: (index: number) => { nome: string; valor: string } | null;
}) {
  const [ref, largura] = useLargura();
  const [ativo, setAtivo] = useState<number | null>(null);
  const esquerda = 46;
  const baixo = 26;
  const topo = 10;
  const area = Math.max(0, largura - esquerda - 4);
  const faixa = rotulos.length ? area / rotulos.length : 0;
  const marcas = degraus(Math.max(0, ...series.flatMap((serie) => serie.valores)));
  const teto = marcas[marcas.length - 1];
  const y = (valor: number) => topo + (altura - topo - baixo) * (1 - valor / teto);
  const base = y(0);
  const barra = Math.max(3, Math.min(22, (faixa * 0.62 - (series.length - 1) * 2) / series.length));
  const grupo = barra * series.length + (series.length - 1) * 2;
  const cada = faixa > 0 ? Math.max(1, Math.ceil(30 / faixa)) : 1;
  const linhaRodape = ativo !== null && rodape ? rodape(ativo) : null;

  return (
    <div>
      {series.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((serie) => (
            <span key={serie.nome} className="inline-flex items-center gap-1.5">
              <Ponto cor={serie.cor} />
              {serie.nome}
            </span>
          ))}
        </div>
      ) : null}
      <div ref={ref} className="relative" style={{ height: altura }}>
        {largura > 0 ? (
          <svg width={largura} height={altura} role="img" aria-label={series.map((serie) => serie.nome).join(" e ")}>
            {marcas.map((marca) => (
              <g key={marca}>
                <line x1={esquerda} x2={largura} y1={y(marca)} y2={y(marca)} stroke="var(--border)" strokeWidth={1} strokeDasharray={marca === 0 ? undefined : "3 4"} />
                <text x={esquerda - 8} y={y(marca) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {fmtEixo(marca, moeda)}
                </text>
              </g>
            ))}
            {rotulos.map((rotulo, index) => {
              const x0 = esquerda + faixa * index;
              const inicio = x0 + (faixa - grupo) / 2;
              return (
                <g key={`${rotulo}-${index}`}>
                  {ativo === index ? <rect x={x0 + 1} y={topo} width={Math.max(0, faixa - 2)} height={base - topo} rx={6} fill="var(--muted)" /> : null}
                  {series.map((serie, posicao) => {
                    const valor = serie.valores[index] ?? 0;
                    if (valor <= 0) {
                      return null;
                    }
                    const alto = Math.max(1.5, base - y(valor));
                    return <path key={serie.nome} d={coluna(inicio + posicao * (barra + 2), base - alto, barra, alto)} fill={serie.cor} />;
                  })}
                  {index % cada === 0 ? (
                    <text x={x0 + faixa / 2} y={altura - 7} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                      {rotulo}
                    </text>
                  ) : null}
                  <rect x={x0} y={0} width={faixa} height={altura} fill="transparent" onMouseEnter={() => setAtivo(index)} onMouseLeave={() => setAtivo(null)} />
                </g>
              );
            })}
          </svg>
        ) : null}
        {ativo !== null && largura > 0 ? (
          <Dica x={esquerda + faixa * (ativo + 0.5)} y={Math.max(56, Math.min(...series.map((serie) => y(serie.valores[ativo] ?? 0))) - 8)} largura={largura}>
            <p className="mb-1 font-semibold text-foreground">{dicas?.[ativo] ?? rotulos[ativo]}</p>
            {series.map((serie) => (
              <p key={serie.nome} className="flex items-center gap-1.5">
                <Ponto cor={serie.cor} />
                <span className="text-muted-foreground">{serie.nome}</span>
                <span className="ml-auto pl-3 font-medium tabular-nums">{fmtMoeda(serie.valores[ativo] ?? 0, moeda)}</span>
              </p>
            ))}
            {linhaRodape ? (
              <p className="mt-1 flex items-center gap-1.5 border-t border-border/70 pt-1">
                <span className="text-muted-foreground">{linhaRodape.nome}</span>
                <span className="ml-auto pl-3 font-semibold tabular-nums">{linhaRodape.valor}</span>
              </p>
            ) : null}
          </Dica>
        ) : null}
      </div>
    </div>
  );
}
