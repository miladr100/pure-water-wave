import { Resend } from "resend";

import { NewStudentEmail } from "@/app/emails/academy/NewStudentEmail";
import { PasswordChangedEmail } from "@/app/emails/academy/PasswordChangedEmail";
import { PasswordResetEmail } from "@/app/emails/academy/PasswordResetEmail";
import { getEmailLogoAttachment } from "@/lib/email-assets";

// Created on first send, not at import: the Resend constructor throws without
// a key, and the academy must build and run (minus email) without one.
let client: Resend | null = null;

function resend() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }

  return client;
}

// Same sender the library uses; override with EMAIL_FROM once the academy
// gets a Resend domain of its own.
const FROM = process.env.EMAIL_FROM ?? "Pure Water Wave <contact@purewaterwave.org>";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

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
  const { error } = await resend().emails.send({
    from: FROM,
    to: [email],
    subject: "Código para redefinir sua senha",
    react: PasswordResetEmail({ userFirstname, code }),
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
  const { error } = await resend().emails.send({
    from: FROM,
    to: [email],
    subject: "Sua senha foi alterada",
    react: PasswordChangedEmail({ userFirstname }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending password changed email:", error);
    throw new Error("Error sending password changed email");
  }

  console.info("E-mail de senha alterada enviado para:", email);
}

interface NewStudentEmailParams {
  to: string[];
  studentName: string;
  studentEmail: string;
  country: string;
  language: string;
  adminUrl: string;
}

// Tutors hear about every sign-up (the FFPUM "Nueva cuenta" notice) so the
// first contact happens while the student is still warm.
export async function sendEmailNewStudent({
  to,
  studentName,
  studentEmail,
  country,
  language,
  adminUrl,
}: NewStudentEmailParams) {
  if (to.length === 0) {
    return;
  }

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: `[Academia Água Pura] Novo aluno: ${studentName}`,
    react: NewStudentEmail({ studentName, studentEmail, country, language, adminUrl }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending new student email:", error);
    throw new Error("Error sending new student email");
  }

  console.info("Aviso de novo aluno enviado para:", to.join(", "));
}
