"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// O painel do assistente como o chat do Tensai Plan (Victor, 25/11/2026):
// flutua no canto de baixo à direita sem escurecer nem travar a página, cresce
// puxando a borda de cima, a da esquerda ou o canto, e guarda o tamanho neste
// navegador; o botão de expandir o leva à tela inteira. No celular ocupa a
// tela toda.

const TAMANHO_KEY = "pww_assistente_tamanho";
const LARGURA_PADRAO = 440;
const MINIMO = { largura: 340, altura: 360 };
// a distância do topo: a barra do painel (sino e perfil) continua à vista
const FOLGA_TOPO = 78;
const MARGEM = 20;

type Tamanho = { largura: number; altura: number };

function lerTamanho(): Tamanho | null {
  try {
    const raw = JSON.parse(window.localStorage.getItem(TAMANHO_KEY) ?? "null") as Partial<Tamanho> | null;
    return raw && Number.isFinite(raw.largura) && Number.isFinite(raw.altura) ? { largura: Math.round(raw.largura!), altura: Math.round(raw.altura!) } : null;
  } catch {
    return null;
  }
}

function gravarTamanho(tamanho: Tamanho) {
  try {
    window.localStorage.setItem(TAMANHO_KEY, JSON.stringify(tamanho));
  } catch {
    // sem armazenamento, o tamanho vale só enquanto a página está aberta
  }
}

const CELULAR = "(max-width: 639px)";

function useCelular() {
  return useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(CELULAR);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    () => window.matchMedia(CELULAR).matches,
    () => false,
  );
}

export function PainelFlutuante({
  titulo,
  acoes,
  onFechar,
  children,
}: {
  titulo: ReactNode;
  // botões extras no cabeçalho, antes de expandir e fechar
  acoes?: ReactNode;
  onFechar: () => void;
  children: (cheio: boolean) => ReactNode;
}) {
  const celular = useCelular();
  const [expandido, setExpandido] = useState(false);
  // lido só no navegador: o painel só existe aberto, nunca no servidor
  const [tamanho, setTamanho] = useState<Tamanho | null>(() => lerTamanho());
  const camada = useRef<HTMLDivElement>(null);
  const arrasto = useRef<{ eixo: "x" | "y" | "xy"; x: number; y: number; w: number; h: number; ultimo?: Tamanho } | null>(null);

  const cheio = expandido || celular;

  function comecar(eixo: "x" | "y" | "xy") {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = camada.current;
      if (!el || event.button) {
        return;
      }
      const caixa = el.getBoundingClientRect();
      arrasto.current = { eixo, x: event.clientX, y: event.clientY, w: caixa.width, h: caixa.height };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
  }

  function mover(event: ReactPointerEvent<HTMLDivElement>) {
    const atual = arrasto.current;
    const el = camada.current;
    if (!atual || !el) {
      return;
    }
    const maxW = window.innerWidth - 2 * MARGEM;
    const maxH = window.innerHeight - FOLGA_TOPO - MARGEM;
    const largura = atual.eixo === "y" ? atual.w : Math.min(Math.max(MINIMO.largura, atual.w + (atual.x - event.clientX)), maxW);
    const altura = atual.eixo === "x" ? atual.h : Math.min(Math.max(MINIMO.altura, atual.h + (atual.y - event.clientY)), maxH);
    el.style.width = `${largura}px`;
    el.style.height = `${altura}px`;
    atual.ultimo = { largura: Math.round(largura), altura: Math.round(altura) };
  }

  function soltar() {
    const atual = arrasto.current;
    arrasto.current = null;
    if (atual?.ultimo) {
      gravarTamanho(atual.ultimo);
      setTamanho(atual.ultimo);
    }
  }

  const alca = (eixo: "x" | "y" | "xy", className: string, rotulo: string) => (
    <div
      role="separator"
      aria-orientation={eixo === "x" ? "vertical" : "horizontal"}
      aria-label={rotulo}
      onPointerDown={comecar(eixo)}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      className={cn("absolute z-10 touch-none", className)}
    />
  );

  const iconeBotao =
    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep";

  return (
    <div
      ref={camada}
      role="dialog"
      aria-modal="false"
      aria-label="Assistente"
      onKeyDown={(event) => {
        if (event.key === "Escape" && expandido) {
          setExpandido(false);
        }
      }}
      className={cn(
        "fixed z-40 flex flex-col text-foreground",
        cheio ? "inset-0 bg-card" : "rounded-2xl shadow-2xl",
      )}
      style={
        cheio
          ? undefined
          : {
              right: MARGEM,
              bottom: MARGEM,
              width: `min(${tamanho?.largura ?? LARGURA_PADRAO}px, calc(100vw - ${2 * MARGEM}px))`,
              height: tamanho ? `min(${tamanho.altura}px, calc(100vh - ${FOLGA_TOPO + MARGEM}px))` : `calc(100vh - ${FOLGA_TOPO + MARGEM}px)`,
            }
      }
    >
      {!cheio ? (
        <>
          {/* fora do recorte arredondado, senão o canto não recebe o clique */}
          {alca("y", "-top-1 left-3 right-0 h-2.5 cursor-ns-resize", "Mudar a altura")}
          {alca("x", "-left-1 top-3 bottom-0 w-2.5 cursor-ew-resize", "Mudar a largura")}
          {alca("xy", "-left-1.5 -top-1.5 h-5 w-5 cursor-nwse-resize", "Mudar o tamanho")}
        </>
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-card", !cheio && "rounded-2xl border border-border/70")}>
      <header className="flex shrink-0 items-center gap-1 border-b border-border/60 py-1.5 pl-4 pr-2">
        <div className="min-w-0 flex-1">{titulo}</div>
        {acoes}
        {!celular ? (
          <button type="button" className={iconeBotao} aria-label={expandido ? "Voltar ao canto" : "Expandir"} title={expandido ? "Voltar ao canto" : "Expandir"} onClick={() => setExpandido((atual) => !atual)}>
            {expandido ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        ) : null}
        <button type="button" className={iconeBotao} aria-label="Fechar o assistente" title="Fechar" onClick={onFechar}>
          <X className="h-4 w-4" />
        </button>
      </header>
      {children(cheio)}
      </div>
    </div>
  );
}
