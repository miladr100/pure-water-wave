import { NextResponse } from "next/server";
import { Preference } from "mercadopago";

import {
  canUseAutoReturn,
  getAppBaseUrl,
  isMercadoPagoTestMode,
  mercadoPagoClient,
} from "@/lib/mercadopago";
import {
  getMercadoPagoDonationAmount,
  parseUserIdFromExternalReference,
} from "@/lib/mercadopago-donation";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

type RetryBody = {
  externalReference?: string;
  preferenceId?: string;
  paymentId?: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Pagamentos não configurados" },
        { status: 503 }
      );
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 }
      );
    }

    const { externalReference, preferenceId, paymentId } =
      (await request.json()) as RetryBody;

    if (!externalReference) {
      return NextResponse.json(
        { error: "Referência da doação não informada" },
        { status: 400 }
      );
    }

    const userId = parseUserIdFromExternalReference(externalReference);
    if (!userId) {
      return NextResponse.json(
        { error: "Referência de doação inválida" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const amount = await getMercadoPagoDonationAmount(preferenceId, paymentId);
    if (!amount) {
      return NextResponse.json(
        { error: "Não foi possível recuperar o valor da doação" },
        { status: 400 }
      );
    }

    const baseUrl = getAppBaseUrl();
    const newExternalReference = `doacao-${user._id}-${Date.now()}`;
    const preference = new Preference(mercadoPagoClient);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "doacao-agua-pura",
            title: "Doação — Água Pura",
            description: "Apoio ao movimento Pure Water Wave",
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: user.fullName,
          email: user.email,
        },
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        ...(canUseAutoReturn(baseUrl) ? { auto_return: "approved" as const } : {}),
        statement_descriptor: "AGUA PURA",
        external_reference: newExternalReference,
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
    console.error("Erro ao refazer checkout:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento" },
      { status: 500 }
    );
  }
}
