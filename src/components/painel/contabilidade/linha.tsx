"use client";

import { EllipsisVertical, Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { downloadText } from "@/components/admin/csv-accounts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { csvDe, MEIO_NOME, semAcento, type Movimento } from "@/lib/hj/contabilidade";

import { CatIcone, Etiqueta, OrigemEtiqueta, Valor } from "./pieces";
import { useContabilidade } from "./store";

// Uma linha da lista de movimentos, igual no Início e em Movimentos.
export function LinhaMovimento({ mov }: { mov: Movimento }) {
  const { categoria, projeto, combinado, abrirEditor, remover, restaurar } = useContabilidade();
  const cat = categoria(mov.categoriaId);
  // o que veio do relatório de RM muda no relatório, não aqui
  const doRelatorio = mov.origem === "relatorio";
  const editavel = !doRelatorio && mov.tipo !== "ajuste";

  const detalhe = [
    mov.tipo === "transferencia"
      ? `${MEIO_NOME[mov.meio]} → ${mov.para ? MEIO_NOME[mov.para.meio] : ""}`
      : mov.tipo === "ajuste"
        ? "Ajuste de saldo"
        : (cat?.nome ?? "Outros"),
    mov.responsavel,
    mov.tipo === "transferencia" ? null : MEIO_NOME[mov.meio],
    combinado ? projeto(mov.projetoId)?.nome : null,
  ].filter(Boolean);

  function excluir() {
    const removido = remover(mov.id);
    if (removido) {
      toast("Movimento excluído", { action: { label: "Desfazer", onClick: () => restaurar(removido) } });
    }
  }

  const corpo = (
    <>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-foreground">{mov.descricao}</span>
        <OrigemEtiqueta origem={mov.origem} />
        {mov.pendente ? <Etiqueta tom="aviso">A conferir</Etiqueta> : null}
        {mov.comprovante ? (
          <span className="inline-flex text-muted-foreground" title={mov.comprovante}>
            <Paperclip className="h-3.5 w-3.5" aria-label="Com comprovante" />
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{detalhe.join(" · ")}</span>
    </>
  );

  return (
    <li className="flex items-center gap-3 py-3">
      <CatIcone tipo={mov.tipo} categoria={cat} />
      {editavel ? (
        <button type="button" onClick={() => abrirEditor(mov)} className="min-w-0 flex-1 cursor-pointer text-left text-sm">
          {corpo}
        </button>
      ) : (
        <div className="min-w-0 flex-1 text-sm">{corpo}</div>
      )}
      <Valor mov={mov} className="shrink-0 text-sm sm:text-base" />
      {doRelatorio ? (
        <span className="w-8 shrink-0" aria-hidden />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções de ${mov.descricao}`}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary-deep"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {editavel ? (
              <DropdownMenuItem onSelect={() => abrirEditor(mov)} className="gap-2">
                <Pencil className="h-4 w-4" aria-hidden />
                Editar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={excluir} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" aria-hidden />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

// Baixa os movimentos no formato da planilha da educadora: uma coluna para
// dinheiro, uma para Pix, uma para dólar.
export function useExportar() {
  const { categoria, projeto } = useContabilidade();
  return (movimentos: Movimento[], nome: string) => {
    if (!movimentos.length) {
      toast("Não há movimentos para exportar nesse período.");
      return;
    }
    downloadText(`${nome}.csv`, csvDe(movimentos, categoria, projeto));
    toast.success(`${movimentos.length} movimentos exportados`);
  };
}

export const slug = (text: string) =>
  semAcento(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
