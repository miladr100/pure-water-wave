import { formatDonationAmount } from "@/lib/donation-amount";
import { sendEmailSuccessDonation } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";

type DonationUser = {
  email: string;
  fullName: string;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export async function notifyDonationSuccessIfNeeded({
  externalReference,
  user,
  amount,
}: {
  externalReference: string;
  user: DonationUser;
  amount: number;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada; e-mail de doação não enviado.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn("Valor de doação inválido; e-mail não enviado.");
    return;
  }

  await connectDB();

  const donation = await Donation.findOneAndUpdate(
    {
      externalReference,
      successEmailSentAt: { $exists: false },
    },
    { $set: { successEmailSentAt: new Date() } },
  );

  if (!donation) {
    return;
  }

  try {
    await sendEmailSuccessDonation({
      userFirstname: getFirstName(user.fullName),
      amount: formatDonationAmount(amount),
      email: user.email,
    });
  } catch (error) {
    await Donation.updateOne(
      { externalReference },
      { $unset: { successEmailSentAt: "" } },
    );
    console.error("Erro ao enviar e-mail de doação:", error);
  }
}
