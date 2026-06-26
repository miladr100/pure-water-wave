import { Resend } from "resend";

import { FailureDonationEmail } from "@/app/emails/FailureDonationEmail";
import { SuccessDonationEmail } from "@/app/emails/SuccessDonationEmail";
import { getEmailLogoAttachment } from "@/lib/email-assets";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SuccessDonationEmailParams {
  userFirstname: string;
  amount: string;
  email: string;
}

interface FailureDonationEmailParams {
  userFirstname: string;
  email: string;
  paymentUrl: string;
}

export async function sendEmailSuccessDonation({
  userFirstname,
  amount,
  email,
}: SuccessDonationEmailParams) {
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [email],
    subject: "Obrigado pela sua contribuição",
    react: SuccessDonationEmail({
      userFirstname,
      amount,
    }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending email notification:", error);
    throw new Error("Error sending email notification");
  }

  console.info("E-mail de doação enviado para:", email);
}

export async function sendEmailFailureDonation({
  userFirstname,
  email,
  paymentUrl,
}: FailureDonationEmailParams) {
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [email],
    subject: "Oh não! Ocorreu um problema com seu pagamento",
    react: FailureDonationEmail({
      userFirstname,
      paymentUrl,
    }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending failure email notification:", error);
    throw new Error("Error sending failure email notification");
  }

  console.info("E-mail de falha de doação enviado para:", email);
}
