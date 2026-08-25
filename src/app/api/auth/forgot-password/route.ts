import { NextResponse } from "next/server";
import { randomInt } from "crypto";

import { sendEmailPasswordReset } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { PasswordReset } from "@/models/password-reset";
import { SystemUser } from "@/models/system-user";

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

    const user = await SystemUser.findOne({
      $or: [{ email: normalizedEmail }, { login: normalizedEmail }],
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Este e-mail não está cadastrado",
          code: "USER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const latest = await PasswordReset.findOne({ email: user.email }).sort({
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

    await PasswordReset.deleteMany({ email: user.email });
    await PasswordReset.create({
      email: user.email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
    });

    const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName;

    try {
      await sendEmailPasswordReset({
        userFirstname: firstName,
        email: user.email,
        code,
      });
    } catch (error) {
      await PasswordReset.deleteMany({ email: user.email });
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
