import { NextResponse } from "next/server";
import { Preference } from "mercadopago";

import {
  canUseAutoReturn,
  getAppBaseUrl,
  isMercadoPagoTestMode,
  mercadoPagoClient,
} from "@/lib/mercadopago";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

type CheckoutBody = {
  amount?: number;
  name?: string;
  email?: string;
  phone?: string;
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

    const { amount, name, email, phone } = (await request.json()) as CheckoutBody;
    const donationAmount = Math.round(Number(amount) * 100) / 100;
    const fullName = name?.trim();
    const userPhone = phone?.trim();
    const userEmail = email?.trim();

    if (
      !amount ||
      amount <= 0 ||
      !fullName ||
      !userPhone ||
      !userEmail
    ) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { phone: userPhone },
      { fullName, phone: userPhone, email: userEmail },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const baseUrl = getAppBaseUrl();
    const externalReference = `doacao-${user._id}-${Date.now()}`;
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
          name: fullName,
          email: userEmail,
        },
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        ...(canUseAutoReturn(baseUrl) ? { auto_return: "approved" as const } : {}),
        statement_descriptor: "AGUA PURA",
        external_reference: externalReference,
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
