import { sendEmailFailureDonation } from "@/lib/emails";
import { getDonationPageUrl } from "@/lib/mercadopago";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/donation";

type DonationUser = {
  email: string;
  fullName: string;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export async function notifyDonationFailureIfNeeded({
  externalReference,
  user,
}: {
  externalReference: string;
  user: DonationUser;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada; e-mail de falha não enviado.");
    return;
  }

  await connectDB();

  const donation = await Donation.findOneAndUpdate(
    {
      externalReference,
      failureEmailSentAt: { $exists: false },
      successEmailSentAt: { $exists: false },
    },
    { $set: { failureEmailSentAt: new Date() } },
  );

  if (!donation) {
    return;
  }

  try {
    await sendEmailFailureDonation({
      userFirstname: getFirstName(user.fullName),
      email: user.email,
      paymentUrl: getDonationPageUrl(),
    });
  } catch (error) {
    await Donation.updateOne(
      { externalReference },
      { $unset: { failureEmailSentAt: "" } },
    );
    console.error("Erro ao enviar e-mail de falha de doação:", error);
  }
}
