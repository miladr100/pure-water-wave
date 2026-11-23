"use client";

import {
  ArrowLeftRight,
  BedDouble,
  Bus,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  Ellipsis,
  Gift,
  HandCoins,
  Handshake,
  HeartPulse,
  Landmark,
  Package,
  Scale,
  Tag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  fmtMes,
  fmtMoeda,
  MOEDAS,
  ORIGEM_NOME,
  somaMes,
  type Categoria,
  type IconeCategoria,
  type Moeda,
  type Movimento,
  type Origem,
  type TipoMovimento,
} from "@/lib/hj/contabilidade";
import { cn } from "@/lib/utils";

export const ICONES: Record<IconeCategoria, LucideIcon> = {
  onibus: Bus,
  pacote: Package,
  talheres: Utensils,
  moedas: HandCoins,
  cartao: CreditCard,
  aperto: Handshake,
  saude: HeartPulse,
  cama: BedDouble,
  pontos: Ellipsis,
  presente: Gift,
  banco: Landmark,
  etiqueta: Tag,
  rm: Coins,
};

// A cor de uma categoria nos gráficos e no seu ícone. Posição fixa: a
// categoria leva a mesma cor em toda tela.
export const corDe = (categoria: Categoria | undefined) => `var(--viz-${categoria?.cor ?? 0})`;

export function tinta(cor: string): CSSProperties {
  return { backgroundColor: `color-mix(in oklab, ${cor} 15%, transparent)`, color: cor };
}

// O quadradinho com o ícone do movimento. Gastos levam a cor da categoria;
// entradas são sempre menta, para se ler "entrou" antes de ler o valor.
export function CatIcone({
  tipo,
  categoria,
  className,
}: {
  tipo: TipoMovimento;
  categoria: Categoria | undefined;
  className?: string;
}) {
  const base = cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl [&_svg]:h-[18px] [&_svg]:w-[18px]", className);
  if (tipo === "transferencia" || tipo === "ajuste") {
    const Icon = tipo === "ajuste" ? Scale : ArrowLeftRight;
    return (
      <span className={cn(base, "bg-muted text-muted-foreground")} aria-hidden>
        <Icon />
      </span>
    );
  }
  const Icon = ICONES[categoria?.icone ?? "pontos"];
  if (tipo === "entrada") {
    return (
      <span className={cn(base, "bg-mint/40 text-mint-foreground dark:bg-mint/20 dark:text-mint")} aria-hidden>
        <Icon />
      </span>
    );
  }
  return (
    <span className={base} style={tinta(corDe(categoria))} aria-hidden>
      <Icon />
    </span>
  );
}

export const corEntrada = "text-mint-foreground dark:text-mint";

// O valor de um movimento, com sinal: + entrou, − saiu.
export function Valor({ mov, className }: { mov: Movimento; className?: string }) {
  if (mov.tipo === "transferencia") {
    const troca = mov.para && mov.para.moeda !== mov.moeda;
    return (
      <span className={cn("text-right font-semibold tabular-nums text-muted-foreground", className)}>
        {fmtMoeda(mov.valorMinor, mov.moeda)}
        {troca && mov.para ? <span className="block text-xs font-medium">→ {fmtMoeda(mov.para.valorMinor, mov.para.moeda)}</span> : null}
      </span>
    );
  }
  const positivo = mov.tipo === "entrada" || (mov.tipo === "ajuste" && mov.valorMinor > 0);
  const valor = mov.tipo === "saida" ? -mov.valorMinor : mov.valorMinor;
  return (
    <span className={cn("font-semibold tabular-nums", positivo ? corEntrada : "text-foreground", className)}>
      {fmtMoeda(valor, mov.moeda, { sinal: true })}
    </span>
  );
}

export function Etiqueta({ children, tom = "neutro" }: { children: ReactNode; tom?: "neutro" | "aviso" | "azul" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
        tom === "aviso" && "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
        tom === "azul" && "bg-secondary text-secondary-foreground",
        tom === "neutro" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function OrigemEtiqueta({ origem }: { origem: Origem }) {
  // o que a pessoa lançou à mão não leva etiqueta
  return origem === "manual" ? null : <Etiqueta tom={origem === "relatorio" ? "azul" : "neutro"}>{ORIGEM_NOME[origem]}</Etiqueta>;
}

// ‹ Novembro de 2026 ›
export function MesStepper({
  mes,
  onChange,
  min,
  max,
  className,
}: {
  mes: string;
  onChange: (mes: string) => void;
  min?: string;
  max?: string;
  className?: string;
}) {
  const botao =
    "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep disabled:pointer-events-none disabled:opacity-30 cursor-pointer";
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full border border-border/70 bg-card p-0.5", className)}>
      <button type="button" className={botao} aria-label="Mês anterior" disabled={Boolean(min && mes <= min)} onClick={() => onChange(somaMes(mes, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[9.5rem] text-center text-sm font-semibold text-primary-deep">{fmtMes(mes)}</span>
      <button type="button" className={botao} aria-label="Mês seguinte" disabled={Boolean(max && mes >= max)} onClick={() => onChange(somaMes(mes, 1))}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Botões lado a lado onde só um vale: Gasto | Entrada | Transferência.
export function Segmentado<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  full,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
  full?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto rounded-full bg-muted p-0.5", full && "flex w-full", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-deep",
            full && "flex-1",
            option.value === value && "bg-card font-semibold text-primary-deep shadow-sm",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Só aparece quando o escopo tem mais de uma moeda: as contas nunca misturam.
export function MoedaPills({ moedas, value, onChange }: { moedas: Moeda[]; value: Moeda; onChange: (moeda: Moeda) => void }) {
  if (moedas.length < 2) {
    return null;
  }
  return (
    <Segmentado
      label="Moeda"
      value={value}
      onChange={onChange}
      options={moedas.map((moeda) => ({ value: moeda, label: MOEDAS[moeda].simbolo }))}
    />
  );
}

export const campo =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <p className="font-semibold text-primary-deep">{titulo}</p>
      {children ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}
