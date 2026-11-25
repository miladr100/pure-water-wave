"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const PODE = [
  "Ver as contabilidades que você vê, com saldos e movimentos",
  "Lançar gastos, entradas e transferências em seu nome (ficam marcados como “Agente”)",
  "Resumir gastos por categoria e por mês",
];

export function ConsentForm({ agente, pedido }: { agente: string; pedido: Record<string, string> }) {
  const [enviando, setEnviando] = useState<"allow" | "deny" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(decision: "allow" | "deny") {
    setEnviando(decision);
    setErro(null);
    try {
      const response = await fetch("/api/oauth/authorize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pedido, decision }),
      });
      const data = (await response.json().catch(() => ({}))) as { redirect?: string; error?: string };
      if (!response.ok || !data.redirect) {
        setErro(data.error ?? "Não foi possível concluir. Tente de novo.");
        setEnviando(null);
        return;
      }
      window.location.assign(data.redirect);
    } catch {
      setErro("Sem conexão. Tente de novo.");
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2 text-sm text-foreground">
        {PODE.map((item) => (
          <li key={item} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {agente} não apaga movimentos nem muda o que veio de um relatório de RM. Você pode desconectar quando quiser em Contabilidade › Ajustes.
      </p>
      {erro ? <p className="text-sm font-medium text-destructive">{erro}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={enviando !== null} onClick={() => void decidir("deny")}>
          Não permitir
        </Button>
        <Button type="button" className="rounded-full" disabled={enviando !== null} onClick={() => void decidir("allow")}>
          {enviando === "allow" ? "Conectando…" : "Permitir"}
        </Button>
      </div>
    </div>
  );
}
