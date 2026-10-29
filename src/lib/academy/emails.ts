import { Resend } from "resend";

import { NewStudentEmail } from "@/app/emails/academy/NewStudentEmail";
import { PasswordChangedEmail } from "@/app/emails/academy/PasswordChangedEmail";
import { PasswordResetEmail } from "@/app/emails/academy/PasswordResetEmail";
import { WelcomeEmail } from "@/app/emails/academy/WelcomeEmail";
import type { AccountKind } from "@/lib/academy/types";
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

// Educators hear about every sign-up (the FFPUM "Nueva cuenta" notice) so the
// welcome happens while the student is still warm.
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

interface WelcomeEmailParams {
  to: string;
  fullName: string;
  kind: AccountKind;
  email: string;
  // null when the educator set the password themself
  temporaryPassword: string | null;
  appUrl: string;
}

// Sent to every account an educator creates from the panel: where to sign
// in, with which e-mail, and the temporary password when one was generated.
export async function sendEmailWelcome({
  to,
  fullName,
  kind,
  email,
  temporaryPassword,
  appUrl,
}: WelcomeEmailParams) {
  const { error } = await resend().emails.send({
    from: FROM,
    to: [to],
    subject: "Sua conta na Água Pura",
    react: WelcomeEmail({ fullName, kind, email, temporaryPassword, appUrl }),
    attachments: [getEmailLogoAttachment()],
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Error sending welcome email");
  }

  console.info("E-mail de boas-vindas enviado para:", to);
}
