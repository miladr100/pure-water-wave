import { NextResponse } from "next/server";

import { sendEmailPasswordChanged } from "@/lib/academy/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { AcademyPasswordReset } from "@/models/academy-password-reset";
import { AcademyUser } from "@/models/academy-user";

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

    const user = await AcademyUser.findOne({
      $or: [{ email }, { login: email }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Confirme o código antes de redefinir a senha" },
        { status: 400 },
      );
    }

    const reset = await AcademyPasswordReset.findOne({ email: user.email }).sort({
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

    const hashedPassword = await hashPassword(password);

    await AcademyUser.updateOne(
      { _id: user._id },
      { password: hashedPassword },
    );
    await AcademyPasswordReset.deleteMany({ email: user.email });

    const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName;

    try {
      await sendEmailPasswordChanged({
        userFirstname: firstName,
        email: user.email,
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
