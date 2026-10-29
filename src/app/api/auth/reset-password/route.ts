import { NextResponse } from "next/server";

import { findAccountByLogin } from "@/lib/academy/account-lookup";
import { sendEmailPasswordChanged } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type ResetBody = {
  email?: string;
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
    const password = body.password ?? "";

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    await connectDB();

    const account = await findAccountByLogin(email);

    if (!account) {
      return NextResponse.json(
        { error: "Confirme o código antes de redefinir a senha" },
        { status: 400 },
      );
    }

    const reset = await account.resets.findOne({ email: account.email }).sort({
      createdAt: -1,
    });

    if (!reset || reset.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Código inválido ou expirado. Solicite um novo código." },
        { status: 400 },
      );
    }

    if (!reset.verifiedAt) {
      return NextResponse.json(
        { error: "Confirme o código antes de redefinir a senha" },
        { status: 400 },
      );
    }

    await account.setPassword(await hashPassword(password));
    await account.resets.deleteMany({ email: account.email });

    const firstName = account.fullName.trim().split(/\s+/)[0] ?? account.fullName;

    try {
      await sendEmailPasswordChanged({
        userFirstname: firstName,
        email: account.email,
      });
    } catch (error) {
      console.error("Senha alterada, mas o e-mail de aviso falhou:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha. Tente novamente." },
      { status: 500 },
    );
  }
}
