import { NextResponse } from "next/server";
import { randomInt } from "crypto";

import { findAccountByLogin } from "@/lib/academy/account-lookup";
import { sendEmailPasswordReset } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const EMAIL_SENT = {
  ok: true,
  message: "Enviamos um código para o seu e-mail.",
};

type ForgotBody = {
  email?: string;
};

// One "esqueci minha senha" for every account the site's Login accepts:
// library (pastors, HJ Team) and academy (students, educators). The reset
// codes are kept next to the account they belong to (account-lookup.ts).
export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Envio de e-mail não configurado" },
        { status: 503 },
      );
    }

    const { email } = (await request.json()) as ForgotBody;
    const normalizedEmail = email?.trim().toLowerCase() ?? "";

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
    }

    await connectDB();

    const account = await findAccountByLogin(normalizedEmail);

    if (!account) {
      return NextResponse.json(
        {
          error: "Este e-mail não está cadastrado",
          code: "USER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const latest = await account.resets.findOne({ email: account.email }).sort({
      createdAt: -1,
    });

    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json({
        ok: true,
        message:
          "Já enviamos um código recentemente. Confira sua caixa de entrada.",
      });
    }

    const code = String(randomInt(100000, 1000000));
    const codeHash = await hashPassword(code);

    await account.resets.deleteMany({ email: account.email });
    await account.resets.create({
      email: account.email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
    });

    const firstName = account.fullName.trim().split(/\s+/)[0] ?? account.fullName;

    try {
      await sendEmailPasswordReset({
        userFirstname: firstName,
        email: account.email,
        code,
      });
    } catch (error) {
      await account.resets.deleteMany({ email: account.email });
      throw error;
    }

    return NextResponse.json(EMAIL_SENT);
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o código. Tente novamente." },
      { status: 500 },
    );
  }
}
