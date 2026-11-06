import { ConvidadoScreen } from "@/components/painel/convidado-screen";

export default async function PainelConvidadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConvidadoScreen id={id} base="/painel/testemunho" />;
}
