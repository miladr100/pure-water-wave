import { NextResponse } from "next/server";
import { Payment } from "mercadopago";

import {
  isApprovedDonation,
  markSameDayDonationIfNeeded,
} from "@/lib/donation-same-day";
import {
  mapMercadoPagoPaymentData,
  parseUserIdFromExternalReference,
} from "@/lib/mercadopago-donation";
import { mercadoPagoClient } from "@/lib/mercadopago";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";
import { User } from "@/models/user";

type WebhookBody = {
  type?: string;
  topic?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

function isPaymentNotFoundError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const err = error as { status?: number; error?: string; message?: string };
  return (
    err.status === 404 ||
    err.error === "not_found" ||
    err.message === "Payment not found"
  );
}

async function parseWebhookNotification(request: Request) {
  const url = new URL(request.url);
  const typeFromQuery =
    url.searchParams.get("type") ?? url.searchParams.get("topic");
  const idFromQuery =
    url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: WebhookBody = {};

  try {
    const rawBody = await request.text();
    if (rawBody) {
      body = JSON.parse(rawBody) as WebhookBody;
    }
  } catch {
    // O MP também envia notificações só via query string.
  }

  const type = body.type ?? body.topic ?? typeFromQuery ?? undefined;
  const paymentId = body.data?.id ?? idFromQuery ?? undefined;

  return {
    type,
    paymentId: paymentId != null ? String(paymentId) : undefined,
  };
}

async function processPaymentNotification(paymentId: string) {
  const payment = new Payment(mercadoPagoClient);

  let paymentData;
  try {
    paymentData = await payment.get({ id: paymentId });
  } catch (error) {
    if (isPaymentNotFoundError(error)) {
      console.info(
        "Webhook MP: pagamento não encontrado (simulação ou ID inválido):",
        paymentId
      );
      return;
    }
    throw error;
  }

  const mapped = mapMercadoPagoPaymentData(paymentData);

  if (!mapped.externalReference) return;

  const userId = parseUserIdFromExternalReference(mapped.externalReference);
  if (!userId) return;

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return;

  await Donation.findOneAndUpdate(
    { externalReference: mapped.externalReference },
    { $set: { ...mapped, user: user._id } },
    { upsert: true }
  );

  if (isApprovedDonation(mapped.status, mapped.collectionStatus)) {
    const referenceDate = paymentData.date_approved
      ? new Date(paymentData.date_approved)
      : paymentData.date_created
        ? new Date(paymentData.date_created)
        : new Date();

    await markSameDayDonationIfNeeded({
      userId: user._id,
      referenceDate,
    });
  }

  console.info("Pagamento Mercado Pago:", {
    id: paymentData.id,
    status: paymentData.status,
    amount: paymentData.transaction_amount,
    external_reference: paymentData.external_reference,
    payer_email: paymentData.payer?.email,
  });
}

export async function POST(request: Request) {
  try {
    const { type, paymentId } = await parseWebhookNotification(request);

    if (type === "payment" && paymentId) {
      await processPaymentNotification(paymentId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
