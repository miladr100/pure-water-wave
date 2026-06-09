import { NextResponse } from "next/server";
import { Payment } from "mercadopago";

import { mercadoPagoClient } from "@/lib/mercadopago";

type WebhookBody = {
  type?: string;
  data?: {
    id?: string | number;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebhookBody;

    if (body.type === "payment" && body.data?.id) {
      const payment = new Payment(mercadoPagoClient);
      const paymentData = await payment.get({ id: String(body.data.id) });

      console.info("Pagamento Mercado Pago:", {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        external_reference: paymentData.external_reference,
        payer_email: paymentData.payer?.email,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
