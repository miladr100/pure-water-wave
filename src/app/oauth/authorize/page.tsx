import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/academy/auth";
import { withDb } from "@/lib/academy/http";
import { loadContext } from "@/lib/hj/data";
import { loadClient, redirectRegistered } from "@/lib/oauth";

import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Conectar um agente — Água Pura" };
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

// Step 5 of the MCP sign-in: the agent sent the person here. Signed out → the
// login, and back. Then: which agent, what it may do, Allow or Deny.
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value.slice(0, 2048) : "";
  };
  const query = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);
  }

  await withDb();
  const client = await loadClient(one("client_id"));
  const valido = client && one("response_type") === "code" && redirectRegistered(client, one("redirect_uri"));
  const context = await loadContext(session);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center font-display text-3xl font-semibold text-primary-deep">Água Pura</p>
        <Card className="shadow-card border-border/60">
          {!valido ? (
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Pedido inválido</CardTitle>
              <CardDescription>Este link de conexão não é válido ou expirou. Comece de novo no seu agente.</CardDescription>
            </CardHeader>
          ) : !context?.papeis.educador ? (
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Só para educadores</CardTitle>
              <CardDescription>
                Só educadores e administradores conectam um agente à contabilidade. A sua conta ({context?.user.fullName ?? "esta conta"}) não pode.
              </CardDescription>
            </CardHeader>
          ) : (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="font-display text-2xl">Conectar {client.nome}</CardTitle>
                <CardDescription>
                  {client.nome} quer acessar a Contabilidade com a sua conta, {context.user.fullName}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsentForm
                  agente={client.nome}
                  pedido={{
                    client_id: one("client_id"),
                    redirect_uri: one("redirect_uri"),
                    state: one("state"),
                    scope: one("scope"),
                    code_challenge: one("code_challenge"),
                    code_challenge_method: one("code_challenge_method"),
                  }}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
