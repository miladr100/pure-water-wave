import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/academy/auth";
import { connectDB } from "@/lib/mongodb";
import { activeProject } from "@/lib/hj/data";
import { hjConfiguracao } from "@/models/hj-configuracao";

// The member's testimony module exists only while the administrator shows
// it (a drive running, or forced on). Educators always get in.
export default async function PainelTestemunhoLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session && session.role !== "tutor" && process.env.MONGODB_URI) {
    await connectDB();
    const config = await hjConfiguracao();
    const visivel =
      config.modulos.testemunho === "visivel" ? true : config.modulos.testemunho === "oculto" ? false : (await activeProject("testemunho")) !== null;
    if (!visivel) {
      redirect("/painel");
    }
  }
  return children;
}
