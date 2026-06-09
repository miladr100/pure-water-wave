import { NextResponse } from "next/server";
import { Preference } from "mercadopago";

import {
  canUseAutoReturn,
  getAppBaseUrl,
  isMercadoPagoTestMode,
  mercadoPagoClient,
} from "@/lib/mercadopago";

type CheckoutBody = {
  amount?: number;
  name?: string;
  email?: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Pagamentos não configurados" },
        { status: 503 }
      );
    }

    const { amount, name, email } = (await request.json()) as CheckoutBody;
    const donationAmount = Math.round(Number(amount) * 100) / 100;

    if (!amount || amount <= 0 || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const baseUrl = getAppBaseUrl();
    const preference = new Preference(mercadoPagoClient);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "doacao-agua-pura",
            title: "Doação — Água Pura",
            description: "Apoio ao movimento Pure Water Wave",
            quantity: 1,
            unit_price: donationAmount,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: name.trim(),
          email: email.trim(),
        },
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        ...(canUseAutoReturn(baseUrl) ? { auto_return: "approved" as const } : {}),
        statement_descriptor: "AGUA PURA",
        external_reference: `doacao-${Date.now()}`,
      },
    });

    const url = isMercadoPagoTestMode()
      ? (result.sandbox_init_point ?? result.init_point)
      : result.init_point;

    if (!url) {
      return NextResponse.json(
        { error: "Não foi possível gerar o link de pagamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erro ao criar preferência MP:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento" },
      { status: 500 }
    );
  }
}
