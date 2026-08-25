import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import { PasswordReset } from "@/models/password-reset";
import { SystemUser } from "@/models/system-user";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_ATTEMPTS = 5;

type ResetBody = {
  email?: string;
  code?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as ResetBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const code = body.code?.replace(/\s+/g, "") ?? "";
    const password = body.password ?? "";

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Informe o código de 6 dígitos" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await SystemUser.findOne({
      $or: [{ email }, { login: email }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    const reset = await PasswordReset.findOne({ email: user.email }).sort({
      createdAt: -1,
    });

    if (!reset || reset.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    if (reset.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Muitas tentativas. Solicite um novo código." },
        { status: 429 },
      );
    }

    const isValidCode = await verifyPassword(code, reset.codeHash);

    if (!isValidCode) {
      reset.attempts += 1;
      await reset.save();

      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);

    await SystemUser.updateOne(
      { _id: user._id },
      { password: hashedPassword },
    );
    await PasswordReset.deleteMany({ email: user.email });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha. Tente novamente." },
      { status: 500 },
    );
  }
}
