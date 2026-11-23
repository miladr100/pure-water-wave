import type { ReactNode } from "react";

import { ContabilidadeFrame } from "@/components/painel/contabilidade/frame";

// A Contabilidade do capitão: a da sua equipe. A moldura fica no layout para
// o projeto escolhido e o assistente não se perderem ao trocar de tela.
export default function PainelContabilidadeLayout({ children }: { children: ReactNode }) {
  return <ContabilidadeFrame lado="painel">{children}</ContabilidadeFrame>;
}
