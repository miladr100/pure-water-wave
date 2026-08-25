import { Resend } from "resend";

import { PasswordChangedEmail } from "@/app/emails/PasswordChangedEmail";
import { PasswordResetEmail } from "@/app/emails/PasswordResetEmail";
import { FeedbackEmail } from "@/app/emails/FeedbackEmail";
import { FailureDonationEmail } from "@/app/emails/FailureDonationEmail";
import { RemarketingDonationEmail } from "@/app/emails/RemarketingDonationEmail";
import { SuccessDonationEmail } from "@/app/emails/SuccessDonationEmail";
import { getEmailLogoAttachment } from "@/lib/email-assets";
import { getDonationPageUrl } from "@/lib/mercadopago";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PasswordResetEmailParams {
  userFirstname: string;
  email: string;
  code: string;
}

export async function sendEmailPasswordReset({
  userFirstname,
  email,
  code,
}: PasswordResetEmailParams) {
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [email],
    subject: "Código para redefinir sua senha",
    react: PasswordResetEmail({
      userFirstname,
      code,
    }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Error sending password reset email");
  }

  console.info("E-mail de redefinição de senha enviado para:", email);
}

interface PasswordChangedEmailParams {
  userFirstname: string;
  email: string;
}

export async function sendEmailPasswordChanged({
  userFirstname,
  email,
}: PasswordChangedEmailParams) {
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [email],
    subject: "Sua senha foi alterada",
    react: PasswordChangedEmail({
      userFirstname,
    }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending password changed email:", error);
    throw new Error("Error sending password changed email");
  }

  console.info("E-mail de senha alterada enviado para:", email);
}

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

interface RemarketingDonationEmailParams {
  userFirstname: string;
  email: string;
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

export async function sendEmailRemarketingDonation({
  userFirstname,
  email,
}: RemarketingDonationEmailParams) {
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [email],
    subject: "Sua doação ainda pode fazer a diferença",
    react: RemarketingDonationEmail({
      userFirstname,
      donationUrl: getDonationPageUrl(),
    }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending remarketing email notification:", error);
    throw new Error("Error sending remarketing email notification");
  }

  console.info("E-mail de remarketing enviado para:", email);
}

const FEEDBACK_INBOX = "pure.water.2027@gmail.com";

type FeedbackEmailParams = {
  type: "error" | "suggestion";
  message: string;
  page: string;
  link: string;
  imageNames: string[];
  images: {
    filename: string;
    content: string;
    contentType: string;
  }[];
  fullName: string;
  email: string;
  login: string;
  phone: string;
  churchName: string;
  country: string;
  language: string;
  role: string;
};

export async function sendEmailFeedback({
  type,
  message,
  page,
  link,
  imageNames,
  images,
  fullName,
  email,
  login,
  phone,
  churchName,
  country,
  language,
  role,
}: FeedbackEmailParams) {
  const typeLabel = type === "error" ? "Erro" : "Sugestão";
  const { error } = await resend.emails.send({
    from: "Pure Water Wave <contact@purewaterwave.org>",
    to: [FEEDBACK_INBOX],
    replyTo: email,
    subject: `[Água Pura] ${typeLabel} de ${fullName}`,
    react: FeedbackEmail({
      typeLabel,
      message,
      page,
      link,
      imageNames,
      fullName,
      email,
      login,
      phone,
      churchName,
      country,
      language,
      role,
    }),
    attachments: [
      getEmailLogoAttachment(),
      ...images.map((image) => ({
        filename: image.filename,
        content: image.content,
        contentType: image.contentType,
      })),
    ],
  });

  if (error) {
    console.error("Error sending feedback email:", error);
    throw new Error("Error sending feedback email");
  }

  console.info("E-mail de feedback enviado para:", FEEDBACK_INBOX);
}
