import { NextResponse } from "next/server";

import {
  isApprovedDonation,
  isFailedDonation,
  markSameDayDonationIfNeeded,
} from "@/lib/donation-same-day";
import { notifyDonationFailureIfNeeded } from "@/lib/donation-failure-notification";
import { notifyDonationSuccessIfNeeded } from "@/lib/donation-success-notification";
import {
  getMercadoPagoDonationAmount,
  mapMercadoPagoRedirectParams,
  parseUserIdFromExternalReference,
  type MercadoPagoRedirectParams,
} from "@/lib/mercadopago-donation";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";
import { User } from "@/models/user";

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as MercadoPagoRedirectParams;
    const mapped = mapMercadoPagoRedirectParams(body);

    if (!mapped.externalReference) {
      return NextResponse.json(
        { error: "external_reference é obrigatório" },
        { status: 400 }
      );
    }

    const userId = parseUserIdFromExternalReference(mapped.externalReference);
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

    const amount = await getMercadoPagoDonationAmount(
      mapped.preferenceId,
      mapped.paymentId,
    );

    await Donation.findOneAndUpdate(
      { externalReference: mapped.externalReference },
      {
        $set: {
          ...mapped,
          user: user._id,
          ...(amount ? { amount } : {}),
        },
      },
      { upsert: true, new: true }
    );

    if (isApprovedDonation(mapped.status, mapped.collectionStatus)) {
      await markSameDayDonationIfNeeded({
        userId: user._id,
        referenceDate: new Date(),
      });

      if (amount) {
        await notifyDonationSuccessIfNeeded({
          externalReference: mapped.externalReference,
          user,
          amount,
        });
      }
    } else if (isFailedDonation(mapped.status, mapped.collectionStatus)) {
      await notifyDonationFailureIfNeeded({
        externalReference: mapped.externalReference,
        user,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao salvar doação:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a doação" },
      { status: 500 }
    );
  }
}
